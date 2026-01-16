/**
 * Offline-Aware Pantry Service
 * Provides pantry operations that work offline and sync when online
 */

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { offlineDB, STORES } from './offlineDB';
import { syncQueue, OPERATION_TYPES } from './syncQueue';

// Sync status for local items
export const LOCAL_STATUS = {
  SYNCED: 'synced',
  PENDING_CREATE: 'pending_create',
  PENDING_DELETE: 'pending_delete',
};

/**
 * Generate a temporary ID for offline items
 */
function generateTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Subscribe to pantry items with offline support
 * Returns cached data immediately, then updates from Firestore
 *
 * @param {string} userId - User ID
 * @param {Function} onUpdate - Callback with updated items
 * @param {Function} onOfflineStatus - Callback for offline status changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeToPantry(userId, onUpdate, onOfflineStatus) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  let firestoreUnsubscribe = null;
  let isOnline = navigator.onLine;

  // Initial load from IndexedDB cache
  loadCachedPantry(userId).then((cachedItems) => {
    if (cachedItems.length > 0) {
      onUpdate(cachedItems, true); // true = from cache
    }
  });

  // Set up Firestore listener if online
  const setupFirestoreListener = () => {
    if (firestoreUnsubscribe) {
      firestoreUnsubscribe();
    }

    try {
      const q = query(
        collection(db, 'pantryItems'),
        where('userId', '==', userId)
      );

      firestoreUnsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          const firestoreItems = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            syncStatus: LOCAL_STATUS.SYNCED,
          }));

          // Merge with any pending local changes
          const mergedItems = await mergeWithLocalChanges(
            userId,
            firestoreItems
          );

          // Update cache
          await cachePantryItems(userId, firestoreItems);

          onUpdate(mergedItems, false); // false = from network
          if (onOfflineStatus) onOfflineStatus(true);
        },
        (error) => {
          console.error('[PantryService] Firestore error:', error);
          if (onOfflineStatus) onOfflineStatus(false);
        }
      );
    } catch (error) {
      console.error('[PantryService] Failed to set up listener:', error);
      if (onOfflineStatus) onOfflineStatus(false);
    }
  };

  // Handle online/offline transitions
  const handleOnline = () => {
    isOnline = true;
    if (onOfflineStatus) onOfflineStatus(true);
    setupFirestoreListener();
  };

  const handleOffline = () => {
    isOnline = false;
    if (onOfflineStatus) onOfflineStatus(false);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Start listening if online
  if (isOnline) {
    setupFirestoreListener();
  }

  // Return unsubscribe function
  return () => {
    if (firestoreUnsubscribe) {
      firestoreUnsubscribe();
    }
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Add a pantry item (works offline)
 *
 * @param {Object} item - Item to add
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Added item with ID
 */
export async function addPantryItem(item, userId) {
  const isOnline = navigator.onLine;
  const itemData = {
    ...item,
    userId,
    addedAt: new Date().toISOString(),
  };

  if (isOnline) {
    // Try to add directly to Firestore
    try {
      const docRef = await addDoc(collection(db, 'pantryItems'), itemData);
      const newItem = {
        id: docRef.id,
        ...itemData,
        syncStatus: LOCAL_STATUS.SYNCED,
      };

      // Cache it
      await offlineDB.put(STORES.PANTRY, newItem);

      return newItem;
    } catch (error) {
      console.error('[PantryService] Online add failed, queuing:', error);
      // Fall through to offline handling
    }
  }

  // Offline: Save locally and queue for sync
  const tempId = generateTempId();
  const localItem = {
    id: tempId,
    ...itemData,
    syncStatus: LOCAL_STATUS.PENDING_CREATE,
  };

  // Save to IndexedDB
  await offlineDB.put(STORES.PANTRY, localItem);

  // Queue for sync
  await syncQueue.queueOperation({
    type: OPERATION_TYPES.CREATE,
    collection: 'pantry',
    data: itemData,
    userId,
  });

  return localItem;
}

/**
 * Delete a pantry item (works offline)
 *
 * @param {string} itemId - Item ID to delete
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function deletePantryItem(itemId, userId) {
  const isOnline = navigator.onLine;

  // Check if this is a temp item that hasn't been synced yet
  if (itemId.startsWith('temp_')) {
    // Just remove from local storage and queue
    await offlineDB.remove(STORES.PANTRY, itemId);
    return;
  }

  if (isOnline) {
    // Try to delete from Firestore
    try {
      await deleteDoc(doc(db, 'pantryItems', itemId));
      await offlineDB.remove(STORES.PANTRY, itemId);
      return;
    } catch (error) {
      console.error('[PantryService] Online delete failed, queuing:', error);
      // Fall through to offline handling
    }
  }

  // Offline: Mark as pending delete and queue
  const existingItem = await offlineDB.get(STORES.PANTRY, itemId);
  if (existingItem) {
    await offlineDB.put(STORES.PANTRY, {
      ...existingItem,
      syncStatus: LOCAL_STATUS.PENDING_DELETE,
    });
  }

  await syncQueue.queueOperation({
    type: OPERATION_TYPES.DELETE,
    collection: 'pantry',
    docId: itemId,
    userId,
  });
}

/**
 * Load cached pantry items from IndexedDB
 */
async function loadCachedPantry(userId) {
  try {
    const items = await offlineDB.getByIndex(STORES.PANTRY, 'userId', userId);
    // Filter out items marked for deletion
    return items.filter(
      (item) => item.syncStatus !== LOCAL_STATUS.PENDING_DELETE
    );
  } catch (error) {
    console.error('[PantryService] Failed to load cache:', error);
    return [];
  }
}

/**
 * Cache pantry items in IndexedDB
 */
async function cachePantryItems(userId, items) {
  try {
    // Clear old cached items for this user (keep pending items)
    const existing = await offlineDB.getByIndex(STORES.PANTRY, 'userId', userId);
    const pendingIds = new Set(
      existing
        .filter((item) => item.syncStatus !== LOCAL_STATUS.SYNCED)
        .map((item) => item.id)
    );

    // Remove old synced items
    for (const item of existing) {
      if (!pendingIds.has(item.id)) {
        await offlineDB.remove(STORES.PANTRY, item.id);
      }
    }

    // Add new items
    await offlineDB.putMany(STORES.PANTRY, items);
  } catch (error) {
    console.error('[PantryService] Failed to cache items:', error);
  }
}

/**
 * Merge Firestore items with local pending changes
 */
async function mergeWithLocalChanges(userId, firestoreItems) {
  try {
    const localItems = await offlineDB.getByIndex(
      STORES.PANTRY,
      'userId',
      userId
    );

    // Get pending creates (temp IDs)
    const pendingCreates = localItems.filter(
      (item) => item.syncStatus === LOCAL_STATUS.PENDING_CREATE
    );

    // Get pending deletes
    const pendingDeleteIds = new Set(
      localItems
        .filter((item) => item.syncStatus === LOCAL_STATUS.PENDING_DELETE)
        .map((item) => item.id)
    );

    // Filter out items pending deletion from Firestore items
    const filteredFirestoreItems = firestoreItems.filter(
      (item) => !pendingDeleteIds.has(item.id)
    );

    // Combine Firestore items with pending creates
    return [...filteredFirestoreItems, ...pendingCreates];
  } catch (error) {
    console.error('[PantryService] Failed to merge changes:', error);
    return firestoreItems;
  }
}

/**
 * Get all items with pending sync status
 */
export async function getPendingItems(userId) {
  const items = await offlineDB.getByIndex(STORES.PANTRY, 'userId', userId);
  return items.filter((item) => item.syncStatus !== LOCAL_STATUS.SYNCED);
}

/**
 * Check if an item has pending sync
 */
export function isPendingSync(item) {
  return (
    item.syncStatus === LOCAL_STATUS.PENDING_CREATE ||
    item.syncStatus === LOCAL_STATUS.PENDING_DELETE
  );
}

export const pantryService = {
  subscribeToPantry,
  addPantryItem,
  deletePantryItem,
  getPendingItems,
  isPendingSync,
  LOCAL_STATUS,
};

export default pantryService;
