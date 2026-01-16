/**
 * Sync Queue Manager
 * Handles offline write operations and syncs them when online
 */

import { offlineDB, STORES } from './offlineDB';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

// Operation types
export const OPERATION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
};

// Sync status
export const SYNC_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

// Collections mapping
const COLLECTIONS = {
  pantry: 'pantryItems',
  recipes: 'recipes',
  mealPlans: 'mealPlans',
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Add an operation to the sync queue
 * @param {Object} operation - Operation to queue
 * @param {string} operation.type - Operation type (create/update/delete)
 * @param {string} operation.collection - Target collection (pantry/recipes/mealPlans)
 * @param {string} operation.docId - Document ID (optional for create)
 * @param {Object} operation.data - Document data
 * @param {string} operation.userId - User ID
 * @returns {Promise<number>} - Queue entry ID
 */
export async function queueOperation(operation) {
  const queueEntry = {
    ...operation,
    timestamp: Date.now(),
    status: SYNC_STATUS.PENDING,
    retryCount: 0,
    error: null,
  };

  const id = await offlineDB.put(STORES.SYNC_QUEUE, queueEntry);
  console.log('[SyncQueue] Queued operation:', operation.type, operation.collection);

  // Try to register for background sync if available
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-pantry');
    } catch (error) {
      console.log('[SyncQueue] Background sync not available:', error.message);
    }
  }

  return id;
}

/**
 * Get the count of pending sync operations
 * @returns {Promise<number>}
 */
export async function getPendingCount() {
  const allItems = await offlineDB.getAll(STORES.SYNC_QUEUE);
  return allItems.filter(
    (item) =>
      item.status === SYNC_STATUS.PENDING ||
      item.status === SYNC_STATUS.FAILED
  ).length;
}

/**
 * Get all pending operations
 * @returns {Promise<Object[]>}
 */
export async function getPendingOperations() {
  const allItems = await offlineDB.getAll(STORES.SYNC_QUEUE);
  return allItems
    .filter(
      (item) =>
        item.status === SYNC_STATUS.PENDING ||
        item.status === SYNC_STATUS.FAILED
    )
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Process the sync queue - sync all pending operations
 * @param {Function} onProgress - Progress callback (synced, total)
 * @returns {Promise<{success: number, failed: number}>}
 */
export async function processQueue(onProgress) {
  const pending = await getPendingOperations();

  if (pending.length === 0) {
    return { success: 0, failed: 0 };
  }

  console.log('[SyncQueue] Processing', pending.length, 'pending operations');

  let success = 0;
  let failed = 0;

  for (let i = 0; i < pending.length; i++) {
    const operation = pending[i];

    try {
      // Mark as in progress
      await offlineDB.put(STORES.SYNC_QUEUE, {
        ...operation,
        status: SYNC_STATUS.IN_PROGRESS,
      });

      // Execute the operation
      await executeOperation(operation);

      // Remove from queue on success
      await offlineDB.remove(STORES.SYNC_QUEUE, operation.id);
      success++;

      console.log('[SyncQueue] Synced:', operation.type, operation.collection);
    } catch (error) {
      console.error('[SyncQueue] Failed to sync:', error);

      // Update retry count and status
      const retryCount = operation.retryCount + 1;
      const newStatus =
        retryCount >= MAX_RETRIES ? SYNC_STATUS.FAILED : SYNC_STATUS.PENDING;

      await offlineDB.put(STORES.SYNC_QUEUE, {
        ...operation,
        status: newStatus,
        retryCount,
        error: error.message,
      });

      failed++;
    }

    // Report progress
    if (onProgress) {
      onProgress(i + 1, pending.length);
    }
  }

  return { success, failed };
}

/**
 * Execute a single sync operation against Firestore
 * @param {Object} operation - Operation to execute
 */
async function executeOperation(operation) {
  const collectionName = COLLECTIONS[operation.collection];

  if (!collectionName) {
    throw new Error(`Unknown collection: ${operation.collection}`);
  }

  switch (operation.type) {
    case OPERATION_TYPES.CREATE: {
      const docRef = await addDoc(collection(db, collectionName), {
        ...operation.data,
        createdAt: new Date().toISOString(),
      });
      console.log('[SyncQueue] Created document:', docRef.id);
      break;
    }

    case OPERATION_TYPES.UPDATE: {
      if (!operation.docId) {
        throw new Error('Document ID required for update operation');
      }
      const docRef = doc(db, collectionName, operation.docId);
      await updateDoc(docRef, {
        ...operation.data,
        updatedAt: new Date().toISOString(),
      });
      break;
    }

    case OPERATION_TYPES.DELETE: {
      if (!operation.docId) {
        throw new Error('Document ID required for delete operation');
      }
      const docRef = doc(db, collectionName, operation.docId);
      await deleteDoc(docRef);
      break;
    }

    default:
      throw new Error(`Unknown operation type: ${operation.type}`);
  }
}

/**
 * Retry failed operations with exponential backoff
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<{success: number, failed: number}>}
 */
export async function retryFailed(onProgress) {
  const allItems = await offlineDB.getAll(STORES.SYNC_QUEUE);
  const failedOps = allItems.filter(
    (item) => item.status === SYNC_STATUS.FAILED && item.retryCount < MAX_RETRIES
  );

  // Reset status to pending for retry
  for (const op of failedOps) {
    await offlineDB.put(STORES.SYNC_QUEUE, {
      ...op,
      status: SYNC_STATUS.PENDING,
    });
  }

  return processQueue(onProgress);
}

/**
 * Clear completed operations from the queue
 * @returns {Promise<void>}
 */
export async function clearCompleted() {
  const allItems = await offlineDB.getAll(STORES.SYNC_QUEUE);
  const completed = allItems.filter(
    (item) => item.status === SYNC_STATUS.COMPLETED
  );

  for (const item of completed) {
    await offlineDB.remove(STORES.SYNC_QUEUE, item.id);
  }
}

/**
 * Clear all operations from the queue (use with caution)
 * @returns {Promise<void>}
 */
export async function clearAll() {
  await offlineDB.clear(STORES.SYNC_QUEUE);
}

export const syncQueue = {
  queueOperation,
  getPendingCount,
  getPendingOperations,
  processQueue,
  retryFailed,
  clearCompleted,
  clearAll,
  OPERATION_TYPES,
  SYNC_STATUS,
};

export default syncQueue;
