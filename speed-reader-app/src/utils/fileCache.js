const DB_NAME = 'speed-reader-cache';
const DB_VERSION = 1;
const STORE = 'files';
const MAX_CACHED_FILES = 5; // keep only the 5 most-recently-opened books

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'title' });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

/** Evict oldest entries so at most MAX_CACHED_FILES remain (excluding the one we just saved). */
async function evictOldEntries(db, currentTitle) {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const records = req.result;
      // Sort oldest-accessed first; exclude the entry we just saved
      const others = records
        .filter((r) => r.title !== currentTitle)
        .sort((a, b) => (a.accessedAt || 0) - (b.accessedAt || 0));

      // Remove entries that push us over the limit
      const toRemove = others.slice(0, Math.max(0, others.length - (MAX_CACHED_FILES - 1)));
      toRemove.forEach((r) => store.delete(r.title));
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve(); // eviction failure is non-fatal
    };
    req.onerror = () => resolve();
  });
}

/**
 * Cache a File in IndexedDB as an ArrayBuffer.
 * Silently skips if the file is unavailable or storage is full.
 */
export async function cacheFile(title, file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const db = await openDB();

    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({
        title,
        arrayBuffer,
        type: file.name.split('.').pop().toLowerCase(),
        name: file.name,
        accessedAt: Date.now(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Enforce the file limit after a successful write
    await evictOldEntries(db, title);
  } catch (err) {
    if (err && err.name === 'QuotaExceededError') {
      console.warn('[fileCache] Storage quota exceeded — file not cached.');
    } else {
      console.warn('[fileCache] Failed to cache file:', err);
    }
  }
}

/**
 * Retrieve a cached file by book title.
 * Returns { file: File, type: string } or null if not found.
 */
export async function getCachedFile(title) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite'); // readwrite so we can update accessedAt
      const store = tx.objectStore(STORE);
      const req = store.get(title);
      req.onsuccess = () => {
        const record = req.result;
        if (!record) { resolve(null); return; }
        // Bump accessedAt so this entry counts as recently used
        store.put({ ...record, accessedAt: Date.now() });
        const blob = new Blob([record.arrayBuffer]);
        const file = new File([blob], record.name, { type: 'application/octet-stream' });
        resolve({ file, type: record.type });
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('[fileCache] Failed to retrieve cached file:', err);
    return null;
  }
}

/**
 * Remove a single cached file (called when user deletes a history entry).
 */
export async function removeCachedFile(title) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(title);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('[fileCache] Failed to remove cached file:', err);
  }
}
