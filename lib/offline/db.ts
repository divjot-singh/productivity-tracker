// Tiny IndexedDB key-value wrapper: "cache" holds last-known GET responses, "queue" holds writes made offline.
const DB_NAME = "daylog-offline";
const DB_VERSION = 1;

export type StoreName = "cache" | "queue";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }

  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      db.createObjectStore("cache", { keyPath: "key" });
      db.createObjectStore("queue", { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

async function run<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  action: (objectStore: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const request = action(db.transaction(store, mode).objectStore(store));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const idbGet = <T>(store: StoreName, key: string) =>
  run<T | undefined>(store, "readonly", (s) => s.get(key));

export const idbPut = (
  store: StoreName,
  value: { key: string; [field: string]: unknown },
) => run(store, "readwrite", (s) => s.put(value));

export const idbDelete = (store: StoreName, key: string) =>
  run(store, "readwrite", (s) => s.delete(key));

export const idbAll = <T>(store: StoreName) =>
  run<T[]>(store, "readonly", (s) => s.getAll());

export const idbClear = (store: StoreName) =>
  run(store, "readwrite", (s) => s.clear());
