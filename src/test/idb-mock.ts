/**
 * Minimal IndexedDB mock for testing.
 * Backed by Map<string, Map<string, unknown>> (store -> key -> value).
 * Supports enough of the IDB API for the persistence engine tests.
 */

type StoreData = Map<string, unknown>;

interface MockIndex {
  name: string;
  keyPath: string | string[];
  unique: boolean;
}

class MockIDBRequest<T> implements Partial<IDBRequest<T>> {
  result: T;
  error: DOMException | null = null;
  onsuccess: ((ev: Event) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;

  constructor(result: T) {
    this.result = result;
    queueMicrotask(() => {
      if (this.onsuccess) this.onsuccess(new Event('success'));
    });
  }
}

class MockIDBIndex {
  private store: MockIDBObjectStore;
  private indexDef: MockIndex;

  constructor(store: MockIDBObjectStore, indexDef: MockIndex) {
    this.store = store;
    this.indexDef = indexDef;
  }

  getAll(query?: IDBValidKey | IDBKeyRange): IDBRequest<unknown[]> {
    const results: unknown[] = [];
    for (const val of this.store.data.values()) {
      const record = val as Record<string, unknown>;
      const kp = this.indexDef.keyPath;
      const indexValue = Array.isArray(kp)
        ? kp.map((k) => record[k])
        : record[kp as string];
      if (query !== undefined) {
        const match = Array.isArray(indexValue)
          ? JSON.stringify(indexValue) === JSON.stringify(query)
          : indexValue === query;
        if (match) results.push(val);
      } else {
        results.push(val);
      }
    }
    return new MockIDBRequest(results) as unknown as IDBRequest<unknown[]>;
  }

  count(query?: IDBValidKey | IDBKeyRange): IDBRequest<number> {
    const all = this.getAll(query) as unknown as MockIDBRequest<unknown[]>;
    return new MockIDBRequest(all.result.length) as unknown as IDBRequest<number>;
  }
}

class MockIDBObjectStore {
  name: string;
  keyPath: string;
  data: StoreData;
  private indexes: Map<string, MockIndex> = new Map();

  constructor(name: string, keyPath: string, data: StoreData) {
    this.name = name;
    this.keyPath = keyPath;
    this.data = data;
  }

  createIndex(name: string, keyPath: string | string[], options?: { unique?: boolean }): IDBIndex {
    this.indexes.set(name, { name, keyPath, unique: options?.unique ?? false });
    return this.index(name);
  }

  index(name: string): IDBIndex {
    const def = this.indexes.get(name);
    if (!def) throw new DOMException(`Index "${name}" not found`, 'NotFoundError');
    return new MockIDBIndex(this, def) as unknown as IDBIndex;
  }

  put(value: unknown): IDBRequest<IDBValidKey> {
    const record = value as Record<string, unknown>;
    const key = String(record[this.keyPath]);
    this.data.set(key, value);
    return new MockIDBRequest(key) as unknown as IDBRequest<IDBValidKey>;
  }

  get(key: IDBValidKey): IDBRequest<unknown> {
    return new MockIDBRequest(this.data.get(String(key))) as unknown as IDBRequest<unknown>;
  }

  getAll(): IDBRequest<unknown[]> {
    return new MockIDBRequest([...this.data.values()]) as unknown as IDBRequest<unknown[]>;
  }

  delete(key: IDBValidKey): IDBRequest<undefined> {
    this.data.delete(String(key));
    return new MockIDBRequest(undefined) as unknown as IDBRequest<undefined>;
  }

  clear(): IDBRequest<undefined> {
    this.data.clear();
    return new MockIDBRequest(undefined) as unknown as IDBRequest<undefined>;
  }

  count(): IDBRequest<number> {
    return new MockIDBRequest(this.data.size) as unknown as IDBRequest<number>;
  }
}

class MockIDBTransaction {
  private stores: Map<string, MockIDBObjectStore>;
  oncomplete: ((ev: Event) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onabort: ((ev: Event) => void) | null = null;
  error: DOMException | null = null;

  constructor(stores: Map<string, MockIDBObjectStore>) {
    this.stores = stores;
    // setTimeout(0) fires after all pending microtasks drain.
    // This is critical: multi-step operations like patch() do
    // get → put → txDone within a single transaction, each step
    // using microtasks. setTimeout ensures oncomplete fires after
    // all inner microtasks have resolved.
    setTimeout(() => {
      if (this.oncomplete) this.oncomplete(new Event('complete'));
    }, 0);
  }

  objectStore(name: string): IDBObjectStore {
    const store = this.stores.get(name);
    if (!store) throw new DOMException(`Store "${name}" not found`, 'NotFoundError');
    return store as unknown as IDBObjectStore;
  }
}

class MockIDBDatabase {
  private stores = new Map<string, MockIDBObjectStore>();
  private storeData = new Map<string, StoreData>();
  objectStoreNames: DOMStringList;

  constructor() {
    this.objectStoreNames = [] as unknown as DOMStringList;
    (this.objectStoreNames as unknown as { contains: (name: string) => boolean }).contains =
      (name: string) => this.stores.has(name);
  }

  createObjectStore(name: string, options?: { keyPath?: string }): IDBObjectStore {
    const data: StoreData = new Map();
    this.storeData.set(name, data);
    const store = new MockIDBObjectStore(name, options?.keyPath ?? 'id', data);
    this.stores.set(name, store);
    return store as unknown as IDBObjectStore;
  }

  transaction(
    storeNames: string | string[],
    _mode?: IDBTransactionMode,
  ): IDBTransaction {
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    const txStores = new Map<string, MockIDBObjectStore>();
    for (const n of names) {
      const s = this.stores.get(n);
      if (s) txStores.set(n, s);
    }
    return new MockIDBTransaction(txStores) as unknown as IDBTransaction;
  }
}

class MockIDBFactory {
  private dbs = new Map<string, MockIDBDatabase>();

  open(name: string, _version?: number): IDBOpenDBRequest {
    let db = this.dbs.get(name);
    const isNew = !db;
    if (!db) {
      db = new MockIDBDatabase();
      this.dbs.set(name, db);
    }
    const req = new MockIDBRequest(db) as unknown as IDBOpenDBRequest;
    queueMicrotask(() => {
      if (isNew && req.onupgradeneeded) {
        req.onupgradeneeded(new Event('upgradeneeded') as IDBVersionChangeEvent);
      }
      if (req.onsuccess) req.onsuccess(new Event('success'));
    });
    return req;
  }

  deleteDatabase(name: string): IDBOpenDBRequest {
    this.dbs.delete(name);
    return new MockIDBRequest(undefined) as unknown as IDBOpenDBRequest;
  }
}

export function createMockIndexedDB(): IDBFactory {
  return new MockIDBFactory() as unknown as IDBFactory;
}
