// file-storage-service.ts
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

export class FileStorageService {
	private storage: IndexedDb;

	constructor() {
		this.storage = new IndexedDb({ prefix: "local-files" });
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
				const file = await this.storage.get<File>(metadata.fileKey);
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
		return this.storage.get<File>(fileKey);
	}

	/**
	 * Save a file to IndexedDB.
	 *
	 * @param fileKey - Unique identifier for the file
	 * @param file - The File object to persist
	 */
	async saveFile(fileKey: string, file: File): Promise<void> {
		return this.storage.set(fileKey, file);
	}

	/**
	 * Delete a single file from IndexedDB.
	 *
	 * @param fileKey - Unique identifier for the file to delete
	 */
	async deleteFile(fileKey: string): Promise<void> {
		return this.storage.delete(fileKey);
	}

	/**
	 * Delete multiple files from IndexedDB.
	 *
	 * @param fileKeys - Array of file identifiers to delete
	 */
	async deleteFiles(fileKeys: string[]): Promise<void> {
		await Promise.all(fileKeys.map((key) => this.storage.delete(key)));
	}

	/**
	 * Clear all files from IndexedDB storage.
	 * Use with caution - this deletes everything in the "local-files" namespace.
	 */
	async clearAllFiles(): Promise<void> {
		return this.storage.clear();
	}
}
