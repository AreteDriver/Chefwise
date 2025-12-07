/**
 * AI Response Caching Utility
 * Implements multi-layer caching for AI API responses to improve performance
 */

/**
 * Generate a cache key from request parameters
 * @param {Object} params - Request parameters
 * @returns {string} Hash-based cache key
 */
export const generateCacheKey = (params) => {
  const normalized = JSON.stringify(params, Object.keys(params).sort());
  return hashString(normalized);
};

/**
 * Simple string hash function
 * @param {string} str - String to hash
 * @returns {string} Hash value
 */
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
};

/**
 * IndexedDB-based cache manager
 */
class CacheManager {
  constructor(dbName = 'chefwise-cache', storeName = 'ai-responses') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
    this.TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached value or null if not found/expired
   */
  async get(key) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        
        if (!result) {
          resolve(null);
          return;
        }

        // Check if expired
        const now = Date.now();
        if (now - result.timestamp > this.TTL) {
          // Expired, delete it asynchronously
          this.delete(key).catch(err => console.error('Cache cleanup error:', err));
          resolve(null);
          return;
        }

        resolve(result.value);
      };
    });
  }

  /**
   * Set cached value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @returns {Promise<void>}
   */
  async set(key, value) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({
        key,
        value,
        timestamp: Date.now(),
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Delete cached value
   * @param {string} key - Cache key
   * @returns {Promise<void>}
   */
  async delete(key) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Clear all cached values
   * @returns {Promise<void>}
   */
  async clear() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache stats
   */
  async getStats() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const all = request.result;
        const now = Date.now();
        const valid = all.filter(item => now - item.timestamp <= this.TTL);
        
        resolve({
          total: all.length,
          valid: valid.length,
          expired: all.length - valid.length,
          size: JSON.stringify(all).length,
        });
      };
    });
  }
}

// Create singleton instance
export const aiCache = new CacheManager();

/**
 * Memory-based cache for fallback (when IndexedDB is not available)
 */
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.TTL = 24 * 60 * 60 * 1000;
  }

  async get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  async delete(key) {
    this.cache.delete(key);
  }

  async clear() {
    this.cache.clear();
  }

  async getStats() {
    const all = Array.from(this.cache.values());
    const now = Date.now();
    const valid = all.filter(item => now - item.timestamp <= this.TTL);

    return {
      total: all.length,
      valid: valid.length,
      expired: all.length - valid.length,
      size: JSON.stringify(all).length,
    };
  }
}

export const memoryCache = new MemoryCache();

/**
 * Get appropriate cache based on browser support
 * @returns {CacheManager|MemoryCache}
 */
export const getCache = () => {
  if (typeof window !== 'undefined' && window.indexedDB) {
    return aiCache;
  }
  return memoryCache;
};
