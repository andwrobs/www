import { IndexedDb } from "./indexed-db";

/**
 * Service for persisting File objects to IndexedDB.
 *
 * Files are stored by a unique key and can be retrieved across
 * browser sessions. Useful for offline-first apps or caching
 * user-uploaded files without re-uploading.
 *
 * All operations are scoped to the "local-files" namespace to avoid
 * collisions with other IndexedDB usage in the app.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 */

interface FileMetadata {
	fileKey: string;
}

/**
 * Internal representation of a file in IndexedDB.
 * Stores the binary data as ArrayBuffer along with metadata.
 */
interface StoredFile {
	data: ArrayBuffer;
	name: string;
	type: string;
	lastModified: number;
	size: number;
}

// Storage limits
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB total

export class FileStorageService {
	private storage: IndexedDb;
	private sizeCache: Map<string, number> = new Map();

	constructor() {
		this.storage = new IndexedDb({ prefix: "local-files" });
	}

	/**
	 * Convert a File object to a storable format.
	 */
	private async fileToStoredFile(file: File): Promise<StoredFile> {
		if (file.size > MAX_FILE_SIZE) {
			throw new Error(
				`File "${file.name}" exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
			);
		}

		const data = await file.arrayBuffer();

		return {
			data,
			name: file.name,
			type: file.type,
			lastModified: file.lastModified,
			size: file.size,
		};
	}

	/**
	 * Convert stored format back to a File object.
	 */
	private storedFileToFile(stored: StoredFile): File {
		return new File([stored.data], stored.name, {
			type: stored.type,
			lastModified: stored.lastModified,
		});
	}

	/**
	 * Get total storage used by all files.
	 */
	async getTotalSize(): Promise<number> {
		return Array.from(this.sizeCache.values()).reduce(
			(sum, size) => sum + size,
			0,
		);
	}

	/**
	 * Check if adding a file would exceed storage limits.
	 */
	async canStoreFile(fileSize: number): Promise<boolean> {
		const currentSize = await this.getTotalSize();
		return currentSize + fileSize <= MAX_TOTAL_SIZE;
	}

	/**
	 * Load multiple files from IndexedDB by their metadata.
	 *
	 * @param files - Map of file IDs to their storage metadata
	 * @returns Map of file IDs to File objects (only includes files that were found)
	 */
	async loadFiles(
		files: Record<string, FileMetadata>,
	): Promise<Record<string, File>> {
		const entries = await Promise.all(
			Object.entries(files).map(async ([fileId, metadata]) => {
				const file = await this.loadFile(metadata.fileKey);
				return file ? [fileId, file] : null;
			}),
		);

		return Object.fromEntries(
			entries.filter((entry): entry is [string, File] => entry !== null),
		);
	}

	/**
	 * Load a single file from IndexedDB.
	 *
	 * @param fileKey - Unique identifier for the file
	 * @returns The File object, or undefined if not found
	 */
	async loadFile(fileKey: string): Promise<File | undefined> {
		try {
			const stored = await this.storage.get<StoredFile>(fileKey);
			if (!stored) return undefined;

			return this.storedFileToFile(stored);
		} catch (error) {
			console.error(`Failed to load file ${fileKey}:`, error);
			return undefined;
		}
	}

	/**
	 * Save a file to IndexedDB.
	 *
	 * @param fileKey - Unique identifier for the file
	 * @param file - The File object to persist
	 */
	async saveFile(fileKey: string, file: File): Promise<void> {
		// Check storage limits before saving
		if (!(await this.canStoreFile(file.size))) {
			throw new Error(
				`Cannot store file: would exceed storage limit of ${MAX_TOTAL_SIZE / 1024 / 1024}MB`,
			);
		}

		const stored = await this.fileToStoredFile(file);
		await this.storage.set(fileKey, stored);

		// Update size cache
		this.sizeCache.set(fileKey, file.size);
	}

	/**
	 * Delete a single file from IndexedDB.
	 *
	 * @param fileKey - Unique identifier for the file to delete
	 */
	async deleteFile(fileKey: string): Promise<void> {
		await this.storage.delete(fileKey);
		this.sizeCache.delete(fileKey);
	}

	/**
	 * Delete multiple files from IndexedDB.
	 *
	 * @param fileKeys - Array of file identifiers to delete
	 */
	async deleteFiles(fileKeys: string[]): Promise<void> {
		await Promise.all(fileKeys.map((key) => this.deleteFile(key)));
	}

	/**
	 * Clear all files from IndexedDB storage.
	 * Use with caution - this deletes everything in the "local-files" namespace.
	 */
	async clearAllFiles(): Promise<void> {
		await this.storage.clear();
		this.sizeCache.clear();
	}
}
