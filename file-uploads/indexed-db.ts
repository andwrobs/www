// indexed-db.ts
import { get, set, del, keys, delMany } from "idb-keyval";

/**
 * Generic wrapper around idb-keyval for namespaced key-value storage.
 *
 * Uses a prefix to avoid key collisions when multiple parts of the app
 * use IndexedDB. All keys are automatically prefixed with the namespace.
 *
 * @see https://github.com/jakearchibald/idb-keyval
 */

const DEFAULT_SEPARATOR = "/";

interface IndexedDBConfig {
	prefix: string;
	separator?: string;
}

export class IndexedDb {
	private prefix: string;
	private separator: string;

	constructor(config: IndexedDBConfig) {
		this.prefix = config.prefix;
		this.separator = config.separator ?? DEFAULT_SEPARATOR;
	}

	private getFullKey(key: string): string {
		return `${this.prefix}${this.separator}${key}`;
	}

	async get<T>(key: string): Promise<T | undefined> {
		return get(this.getFullKey(key));
	}

	async set<T>(key: string, value: T): Promise<void> {
		return set(this.getFullKey(key), value);
	}

	async delete(key: string): Promise<void> {
		return del(this.getFullKey(key));
	}

	/**
	 * Deletes all keys matching this instance's prefix.
	 * Useful for clearing an entire namespace.
	 */
	async clear(): Promise<void> {
		const allKeys = await keys();
		const prefixedKeys = allKeys.filter(
			(key) =>
				typeof key === "string" && key.startsWith(this.prefix + this.separator),
		);
		return delMany(prefixedKeys);
	}
}
