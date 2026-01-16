/**
 * Tests for syncQueue manager
 */

import 'fake-indexeddb/auto';
import { offlineDB, STORES } from '../offlineDB';
import {
  queueOperation,
  getPendingCount,
  getPendingOperations,
  clearAll,
  OPERATION_TYPES,
  SYNC_STATUS,
} from '../syncQueue';

// Mock navigator.serviceWorker
const mockServiceWorker = {
  ready: Promise.resolve({
    sync: {
      register: jest.fn().mockResolvedValue(undefined),
    },
  }),
};

Object.defineProperty(global.navigator, 'serviceWorker', {
  value: mockServiceWorker,
  writable: true,
});

Object.defineProperty(window, 'SyncManager', {
  value: class SyncManager {},
  writable: true,
});

describe('syncQueue', () => {
  beforeEach(async () => {
    await clearAll();
  });

  afterAll(() => {
    offlineDB.closeDB();
  });

  describe('queueOperation', () => {
    it('should add operation to sync queue', async () => {
      const operation = {
        type: OPERATION_TYPES.CREATE,
        collection: 'pantry',
        data: { name: 'Test Item', quantity: '2', unit: 'cups' },
        userId: 'user-1',
      };

      const id = await queueOperation(operation);

      expect(id).toBeDefined();

      const pending = await getPendingOperations();
      expect(pending).toHaveLength(1);
      expect(pending[0].type).toBe(OPERATION_TYPES.CREATE);
      expect(pending[0].status).toBe(SYNC_STATUS.PENDING);
    });

    it('should add timestamp to queued operation', async () => {
      const beforeTime = Date.now();

      await queueOperation({
        type: OPERATION_TYPES.CREATE,
        collection: 'pantry',
        data: { name: 'Test' },
        userId: 'user-1',
      });

      const afterTime = Date.now();
      const pending = await getPendingOperations();

      expect(pending[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(pending[0].timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should queue multiple operations in order', async () => {
      await queueOperation({
        type: OPERATION_TYPES.CREATE,
        collection: 'pantry',
        data: { name: 'First' },
        userId: 'user-1',
      });

      await queueOperation({
        type: OPERATION_TYPES.UPDATE,
        collection: 'pantry',
        docId: 'doc-1',
        data: { name: 'Second' },
        userId: 'user-1',
      });

      await queueOperation({
        type: OPERATION_TYPES.DELETE,
        collection: 'pantry',
        docId: 'doc-2',
        userId: 'user-1',
      });

      const pending = await getPendingOperations();

      expect(pending).toHaveLength(3);
      expect(pending[0].data.name).toBe('First');
      expect(pending[1].data.name).toBe('Second');
      expect(pending[2].type).toBe(OPERATION_TYPES.DELETE);
    });
  });

  describe('getPendingCount', () => {
    it('should return 0 when queue is empty', async () => {
      const count = await getPendingCount();
      expect(count).toBe(0);
    });

    it('should return correct count of pending operations', async () => {
      await queueOperation({
        type: OPERATION_TYPES.CREATE,
        collection: 'pantry',
        data: { name: 'Item 1' },
        userId: 'user-1',
      });

      await queueOperation({
        type: OPERATION_TYPES.CREATE,
        collection: 'pantry',
        data: { name: 'Item 2' },
        userId: 'user-1',
      });

      const count = await getPendingCount();
      expect(count).toBe(2);
    });

    it('should include failed operations in count', async () => {
      await queueOperation({
        type: OPERATION_TYPES.CREATE,
        collection: 'pantry',
        data: { name: 'Item 1' },
        userId: 'user-1',
      });

      // Manually mark one as failed
      const pending = await getPendingOperations();
      await offlineDB.put(STORES.SYNC_QUEUE, {
        ...pending[0],
        status: SYNC_STATUS.FAILED,
      });

      const count = await getPendingCount();
      expect(count).toBe(1);
    });
  });

  describe('getPendingOperations', () => {
    it('should return operations sorted by timestamp', async () => {
      // Add operations with explicit timestamps
      await offlineDB.put(STORES.SYNC_QUEUE, {
        id: 1,
        type: OPERATION_TYPES.CREATE,
        collection: 'pantry',
        data: { name: 'Later' },
        userId: 'user-1',
        timestamp: 2000,
        status: SYNC_STATUS.PENDING,
        retryCount: 0,
      });

      await offlineDB.put(STORES.SYNC_QUEUE, {
        id: 2,
        type: OPERATION_TYPES.CREATE,
        collection: 'pantry',
        data: { name: 'Earlier' },
        userId: 'user-1',
        timestamp: 1000,
        status: SYNC_STATUS.PENDING,
        retryCount: 0,
      });

      const pending = await getPendingOperations();

      expect(pending[0].data.name).toBe('Earlier');
      expect(pending[1].data.name).toBe('Later');
    });

    it('should exclude completed operations', async () => {
      await offlineDB.put(STORES.SYNC_QUEUE, {
        id: 1,
        type: OPERATION_TYPES.CREATE,
        collection: 'pantry',
        data: { name: 'Pending' },
        userId: 'user-1',
        timestamp: 1000,
        status: SYNC_STATUS.PENDING,
        retryCount: 0,
      });

      await offlineDB.put(STORES.SYNC_QUEUE, {
        id: 2,
        type: OPERATION_TYPES.CREATE,
        collection: 'pantry',
        data: { name: 'Completed' },
        userId: 'user-1',
        timestamp: 2000,
        status: SYNC_STATUS.COMPLETED,
        retryCount: 0,
      });

      const pending = await getPendingOperations();

      expect(pending).toHaveLength(1);
      expect(pending[0].data.name).toBe('Pending');
    });
  });

  describe('clearAll', () => {
    it('should remove all operations from queue', async () => {
      await queueOperation({
        type: OPERATION_TYPES.CREATE,
        collection: 'pantry',
        data: { name: 'Item 1' },
        userId: 'user-1',
      });

      await queueOperation({
        type: OPERATION_TYPES.CREATE,
        collection: 'pantry',
        data: { name: 'Item 2' },
        userId: 'user-1',
      });

      await clearAll();

      const count = await getPendingCount();
      expect(count).toBe(0);
    });
  });

  describe('OPERATION_TYPES', () => {
    it('should have correct operation type values', () => {
      expect(OPERATION_TYPES.CREATE).toBe('create');
      expect(OPERATION_TYPES.UPDATE).toBe('update');
      expect(OPERATION_TYPES.DELETE).toBe('delete');
    });
  });

  describe('SYNC_STATUS', () => {
    it('should have correct status values', () => {
      expect(SYNC_STATUS.PENDING).toBe('pending');
      expect(SYNC_STATUS.IN_PROGRESS).toBe('in_progress');
      expect(SYNC_STATUS.COMPLETED).toBe('completed');
      expect(SYNC_STATUS.FAILED).toBe('failed');
    });
  });
});
