/**
 * Tests for offlineDB IndexedDB wrapper
 */

import 'fake-indexeddb/auto';
import { offlineDB, STORES } from '../offlineDB';

describe('offlineDB', () => {
  beforeEach(async () => {
    // Clear all stores before each test
    await offlineDB.clear(STORES.PANTRY);
    await offlineDB.clear(STORES.RECIPES);
    await offlineDB.clear(STORES.MEAL_PLANS);
    await offlineDB.clear(STORES.SYNC_QUEUE);
  });

  afterAll(() => {
    offlineDB.closeDB();
  });

  describe('put and get', () => {
    it('should store and retrieve an item', async () => {
      const item = { id: 'test-1', name: 'Test Item', userId: 'user-1' };

      await offlineDB.put(STORES.PANTRY, item);
      const retrieved = await offlineDB.get(STORES.PANTRY, 'test-1');

      expect(retrieved).toEqual(item);
    });

    it('should return null for non-existent item', async () => {
      const result = await offlineDB.get(STORES.PANTRY, 'non-existent');
      expect(result).toBeNull();
    });

    it('should update existing item with same key', async () => {
      const item1 = { id: 'test-1', name: 'Original', userId: 'user-1' };
      const item2 = { id: 'test-1', name: 'Updated', userId: 'user-1' };

      await offlineDB.put(STORES.PANTRY, item1);
      await offlineDB.put(STORES.PANTRY, item2);

      const retrieved = await offlineDB.get(STORES.PANTRY, 'test-1');
      expect(retrieved.name).toBe('Updated');
    });
  });

  describe('getAll', () => {
    it('should return all items from a store', async () => {
      const items = [
        { id: 'item-1', name: 'Item 1', userId: 'user-1' },
        { id: 'item-2', name: 'Item 2', userId: 'user-1' },
        { id: 'item-3', name: 'Item 3', userId: 'user-2' },
      ];

      for (const item of items) {
        await offlineDB.put(STORES.PANTRY, item);
      }

      const result = await offlineDB.getAll(STORES.PANTRY);
      expect(result).toHaveLength(3);
    });

    it('should return empty array for empty store', async () => {
      const result = await offlineDB.getAll(STORES.PANTRY);
      expect(result).toEqual([]);
    });
  });

  describe('getByIndex', () => {
    it('should return items matching index value', async () => {
      const items = [
        { id: 'item-1', name: 'Item 1', userId: 'user-1' },
        { id: 'item-2', name: 'Item 2', userId: 'user-1' },
        { id: 'item-3', name: 'Item 3', userId: 'user-2' },
      ];

      for (const item of items) {
        await offlineDB.put(STORES.PANTRY, item);
      }

      const result = await offlineDB.getByIndex(STORES.PANTRY, 'userId', 'user-1');
      expect(result).toHaveLength(2);
      expect(result.every((item) => item.userId === 'user-1')).toBe(true);
    });

    it('should return empty array when no matches', async () => {
      await offlineDB.put(STORES.PANTRY, { id: 'item-1', name: 'Item 1', userId: 'user-1' });

      const result = await offlineDB.getByIndex(STORES.PANTRY, 'userId', 'user-999');
      expect(result).toEqual([]);
    });
  });

  describe('putMany', () => {
    it('should store multiple items in a single transaction', async () => {
      const items = [
        { id: 'item-1', name: 'Item 1', userId: 'user-1' },
        { id: 'item-2', name: 'Item 2', userId: 'user-1' },
        { id: 'item-3', name: 'Item 3', userId: 'user-1' },
      ];

      await offlineDB.putMany(STORES.PANTRY, items);

      const result = await offlineDB.getAll(STORES.PANTRY);
      expect(result).toHaveLength(3);
    });
  });

  describe('remove', () => {
    it('should remove an item by key', async () => {
      await offlineDB.put(STORES.PANTRY, { id: 'test-1', name: 'Test', userId: 'user-1' });

      await offlineDB.remove(STORES.PANTRY, 'test-1');

      const result = await offlineDB.get(STORES.PANTRY, 'test-1');
      expect(result).toBeNull();
    });

    it('should not error when removing non-existent item', async () => {
      await expect(offlineDB.remove(STORES.PANTRY, 'non-existent')).resolves.toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should remove all items from a store', async () => {
      const items = [
        { id: 'item-1', name: 'Item 1', userId: 'user-1' },
        { id: 'item-2', name: 'Item 2', userId: 'user-1' },
      ];

      for (const item of items) {
        await offlineDB.put(STORES.PANTRY, item);
      }

      await offlineDB.clear(STORES.PANTRY);

      const result = await offlineDB.getAll(STORES.PANTRY);
      expect(result).toEqual([]);
    });
  });

  describe('count', () => {
    it('should return the number of items in a store', async () => {
      const items = [
        { id: 'item-1', name: 'Item 1', userId: 'user-1' },
        { id: 'item-2', name: 'Item 2', userId: 'user-1' },
        { id: 'item-3', name: 'Item 3', userId: 'user-1' },
      ];

      for (const item of items) {
        await offlineDB.put(STORES.PANTRY, item);
      }

      const count = await offlineDB.count(STORES.PANTRY);
      expect(count).toBe(3);
    });

    it('should return 0 for empty store', async () => {
      const count = await offlineDB.count(STORES.PANTRY);
      expect(count).toBe(0);
    });
  });
});
