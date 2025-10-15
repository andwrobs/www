import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { STORAGE_KEYS } from "~/lib/stores-config";
import { FileStorageService } from "./file-storage-service";
import type { FileWithPath } from "@mantine/dropzone";

export type FileUploadStatus = "pending" | "uploading" | "success" | "error";

export type StoredFileMetadata = {
	fileKey: string;
	name: string;
	size: number;
	type: string;
	lastModified: number;
	status: FileUploadStatus;
	error?: string;
	uploadedAt: number;
};

export type FileStoreState = {
	files: Record<string, StoredFileMetadata>;
	isInitialized: boolean;
};

export type FileStoreActions = {
	actions: {
		// Initialization
		initialize: () => Promise<void>;

		// File operations
		addFiles: (files: FileWithPath[]) => Promise<void>;
		removeFile: (fileId: string) => Promise<void>;
		removeFiles: (fileIds: string[]) => Promise<void>;
		clearAllFiles: () => Promise<void>;

		// Status updates
		setFileStatus: (
			fileId: string,
			status: FileUploadStatus,
			error?: string,
		) => void;
		setFileError: (fileId: string, error: string) => void;

		// Getters
		getFile: (fileId: string) => Promise<File | undefined>;
		getFiles: (fileIds: string[]) => Promise<Record<string, File>>;
		getAllFiles: () => Promise<Record<string, File>>;

		// Utilities
		hasFile: (fileId: string) => boolean;
		getFileMetadata: (fileId: string) => StoredFileMetadata | undefined;
		getAllFileMetadata: () => StoredFileMetadata[];
		getFilesByStatus: (status: FileUploadStatus) => StoredFileMetadata[];
	};
};

export const initialState: FileStoreState = {
	files: {},
	isInitialized: false,
};

const devtoolsOptions = {
	name: STORAGE_KEYS.FILES,
};

// Create a singleton instance of the storage service
const fileStorage = new FileStorageService();

/**
 * Generate a unique file key based on file properties and timestamp
 */
const generateFileKey = (file: File): string => {
	const timestamp = Date.now();
	const randomSuffix = Math.random().toString(36).substring(2, 9);
	return `${file.name}-${file.size}-${timestamp}-${randomSuffix}`;
};

export const useFileStore = create<FileStoreState & FileStoreActions>()(
	devtools(
		immer((set, get) => ({
			...initialState,
			actions: {
				initialize: async () => {
					// Load existing file metadata from the store on initialization
					// IndexedDB files are loaded on-demand
					set((state) => {
						state.isInitialized = true;
					});
				},

				addFiles: async (files: FileWithPath[]) => {
					const fileEntries = await Promise.allSettled(
						files.map(async (file) => {
							const fileKey = generateFileKey(file);
							const fileId = fileKey; // Using fileKey as fileId for simplicity

							// Optimistically add to store
							set((state) => {
								state.files[fileId] = {
									fileKey,
									name: file.name,
									size: file.size,
									type: file.type,
									lastModified: file.lastModified,
									status: "uploading",
									uploadedAt: Date.now(),
								};
							});

							try {
								// Save to IndexedDB
								await fileStorage.saveFile(fileKey, file);

								// Update status to success
								set((state) => {
									if (state.files[fileId]) {
										state.files[fileId].status = "success";
									}
								});

								return { fileId, success: true };
							} catch (error) {
								const errorMessage =
									error instanceof Error
										? error.message
										: "Failed to save file";

								// Update status to error
								set((state) => {
									if (state.files[fileId]) {
										state.files[fileId].status = "error";
										state.files[fileId].error = errorMessage;
									}
								});

								return { fileId, success: false, error: errorMessage };
							}
						}),
					);

					// Log any failures
					const failures = fileEntries.filter(
						(result) =>
							result.status === "rejected" ||
							(result.status === "fulfilled" && !result.value.success),
					);

					if (failures.length > 0) {
						console.error("Some files failed to upload:", failures);
					}
				},

				removeFile: async (fileId: string) => {
					const metadata = get().files[fileId];
					if (!metadata) return;

					try {
						// Remove from IndexedDB
						await fileStorage.deleteFile(metadata.fileKey);

						// Remove from store
						set((state) => {
							delete state.files[fileId];
						});
					} catch (error) {
						console.error("Failed to remove file:", error);
						throw error;
					}
				},

				removeFiles: async (fileIds: string[]) => {
					const fileKeys = fileIds
						.map((id) => get().files[id]?.fileKey)
						.filter((key): key is string => key !== undefined);

					try {
						// Remove from IndexedDB
						await fileStorage.deleteFiles(fileKeys);

						// Remove from store
						set((state) => {
							fileIds.forEach((id) => {
								delete state.files[id];
							});
						});
					} catch (error) {
						console.error("Failed to remove files:", error);
						throw error;
					}
				},

				clearAllFiles: async () => {
					try {
						// Clear IndexedDB
						await fileStorage.clearAllFiles();

						// Clear store
						set((state) => {
							state.files = {};
						});
					} catch (error) {
						console.error("Failed to clear files:", error);
						throw error;
					}
				},

				setFileStatus: (
					fileId: string,
					status: FileUploadStatus,
					error?: string,
				) => {
					set((state) => {
						if (state.files[fileId]) {
							state.files[fileId].status = status;
							if (error) {
								state.files[fileId].error = error;
							} else {
								delete state.files[fileId].error;
							}
						}
					});
				},

				setFileError: (fileId: string, error: string) => {
					set((state) => {
						if (state.files[fileId]) {
							state.files[fileId].status = "error";
							state.files[fileId].error = error;
						}
					});
				},

				getFile: async (fileId: string) => {
					const metadata = get().files[fileId];
					if (!metadata) return undefined;

					try {
						return await fileStorage.loadFile(metadata.fileKey);
					} catch (error) {
						console.error("Failed to load file:", error);
						return undefined;
					}
				},

				getFiles: async (fileIds: string[]) => {
					const filesMetadata = fileIds.reduce(
						(acc, id) => {
							const metadata = get().files[id];
							if (metadata) {
								acc[id] = { fileKey: metadata.fileKey };
							}
							return acc;
						},
						{} as Record<string, { fileKey: string }>,
					);

					try {
						return await fileStorage.loadFiles(filesMetadata);
					} catch (error) {
						console.error("Failed to load files:", error);
						return {};
					}
				},

				getAllFiles: async () => {
					const allFileIds = Object.keys(get().files);
					return get().actions.getFiles(allFileIds);
				},

				hasFile: (fileId: string) => {
					return fileId in get().files;
				},

				getFileMetadata: (fileId: string) => {
					return get().files[fileId];
				},

				getAllFileMetadata: () => {
					return Object.values(get().files);
				},

				getFilesByStatus: (status: FileUploadStatus) => {
					return Object.values(get().files).filter(
						(file) => file.status === status,
					);
				},
			},
		})),
		devtoolsOptions,
	),
);
