/**
 * IndexedDB Wrapper for Offline Data Storage
 * Provides a unified API for storing pantry, recipes, meal plans, and sync queue
 */

const DB_NAME = 'chefwise-offline';
const DB_VERSION = 1;

// Store definitions
const STORES = {
  PANTRY: 'pantry',
  RECIPES: 'recipes',
  MEAL_PLANS: 'mealPlans',
  SYNC_QUEUE: 'syncQueue',
};

let dbInstance = null;

/**
 * Initialize and get the database instance
 * @returns {Promise<IDBDatabase>}
 */
async function getDB() {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[OfflineDB] Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;

      // Handle connection closing
      dbInstance.onclose = () => {
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Pantry store - keyed by item ID
      if (!db.objectStoreNames.contains(STORES.PANTRY)) {
        const pantryStore = db.createObjectStore(STORES.PANTRY, {
          keyPath: 'id',
        });
        pantryStore.createIndex('userId', 'userId', { unique: false });
        pantryStore.createIndex('syncStatus', 'syncStatus', { unique: false });
      }

      // Recipes store - keyed by recipe ID
      if (!db.objectStoreNames.contains(STORES.RECIPES)) {
        const recipesStore = db.createObjectStore(STORES.RECIPES, {
          keyPath: 'id',
        });
        recipesStore.createIndex('userId', 'userId', { unique: false });
      }

      // Meal Plans store - keyed by plan ID
      if (!db.objectStoreNames.contains(STORES.MEAL_PLANS)) {
        const mealPlansStore = db.createObjectStore(STORES.MEAL_PLANS, {
          keyPath: 'id',
        });
        mealPlansStore.createIndex('userId', 'userId', { unique: false });
      }

      // Sync Queue store - keyed by auto-incrementing ID
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('type', 'type', { unique: false });
        syncStore.createIndex('status', 'status', { unique: false });
      }
    };
  });
}

/**
 * Get a single item by key
 * @param {string} storeName - Store to query
 * @param {string} key - Item key
 * @returns {Promise<any>}
 */
async function get(storeName, key) {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

/**
 * Get all items from a store
 * @param {string} storeName - Store to query
 * @returns {Promise<any[]>}
 */
async function getAll(storeName) {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

/**
 * Get items by index
 * @param {string} storeName - Store to query
 * @param {string} indexName - Index name
 * @param {any} value - Index value to match
 * @returns {Promise<any[]>}
 */
async function getByIndex(storeName, indexName, value) {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

/**
 * Put (upsert) an item
 * @param {string} storeName - Store to modify
 * @param {any} item - Item to store (must have key property)
 * @returns {Promise<any>} - The key of the stored item
 */
async function put(storeName, item) {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Put multiple items in a single transaction
 * @param {string} storeName - Store to modify
 * @param {any[]} items - Items to store
 * @returns {Promise<void>}
 */
async function putMany(storeName, items) {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);

    items.forEach((item) => store.put(item));
  });
}

/**
 * Delete an item by key
 * @param {string} storeName - Store to modify
 * @param {string} key - Item key to delete
 * @returns {Promise<void>}
 */
async function remove(storeName, key) {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Clear all items from a store
 * @param {string} storeName - Store to clear
 * @returns {Promise<void>}
 */
async function clear(storeName) {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Count items in a store
 * @param {string} storeName - Store to count
 * @returns {Promise<number>}
 */
async function count(storeName) {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.count();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Close the database connection
 */
function closeDB() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// Export store names and functions
export { STORES };

export const offlineDB = {
  get,
  getAll,
  getByIndex,
  put,
  putMany,
  remove,
  clear,
  count,
  closeDB,
  STORES,
};

export default offlineDB;
