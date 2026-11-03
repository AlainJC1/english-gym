// Minimal IndexedDB wrapper. Everything stays on the device.
const NAME = 'english-gym';
const VERSION = 1;
const STORES = ['log', 'cards', 'phrases', 'mistakes', 'tests', 'recordings'];
let dbp = null;

export function openDB() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(NAME, VERSION);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv', { keyPath: 'key' });
      STORES.forEach(s => { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' }); });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

function run(store, mode, fn) {
  return openDB().then(d => new Promise((resolve, reject) => {
    const t = d.transaction(store, mode);
    const os = t.objectStore(store);
    let out;
    const r = fn(os);
    if (r && 'onsuccess' in r) r.onsuccess = () => { out = r.result; };
    t.oncomplete = () => resolve(out);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

export const dbGet = (s, k) => run(s, 'readonly', os => os.get(k));
export const dbAll = s => run(s, 'readonly', os => os.getAll());
export const dbPut = (s, v) => run(s, 'readwrite', os => os.put(v));
export const dbDel = (s, k) => run(s, 'readwrite', os => os.delete(k));
export const dbClear = s => run(s, 'readwrite', os => os.clear());
export const dbPutMany = (s, arr) => run(s, 'readwrite', os => { arr.forEach(v => os.put(v)); return null; });
export const ALL_STORES = ['kv'].concat(STORES);
