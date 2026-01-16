/**
 * Tests for mealPlanService
 */

import 'fake-indexeddb/auto';
import { offlineDB, STORES } from '../offlineDB';
import {
  saveMealPlan,
  getLatestMealPlan,
  getAllMealPlans,
  deleteMealPlan,
  clearUserMealPlans,
} from '../mealPlanService';

describe('mealPlanService', () => {
  const userId = 'test-user-1';

  const sampleMealPlan = {
    days: [
      {
        day: 1,
        date: '2024-01-15',
        meals: [
          {
            type: 'breakfast',
            title: 'Oatmeal',
            macros: { calories: 300, protein: 10, carbs: 50, fat: 8 },
          },
          {
            type: 'lunch',
            title: 'Salad',
            macros: { calories: 400, protein: 25, carbs: 30, fat: 15 },
          },
        ],
        dailyTotals: { calories: 700, protein: 35, carbs: 80, fat: 23 },
      },
    ],
    shoppingList: [
      { item: 'Oats', quantity: '1 cup' },
      { item: 'Lettuce', quantity: '1 head' },
    ],
  };

  beforeEach(async () => {
    await offlineDB.clear(STORES.MEAL_PLANS);
  });

  afterAll(() => {
    offlineDB.closeDB();
  });

  describe('saveMealPlan', () => {
    it('should save a meal plan with generated ID', async () => {
      const saved = await saveMealPlan(userId, sampleMealPlan);

      expect(saved.id).toBeDefined();
      expect(saved.id).toMatch(/^plan_/);
      expect(saved.userId).toBe(userId);
      expect(saved.days).toEqual(sampleMealPlan.days);
      expect(saved.savedAt).toBeDefined();
    });

    it('should include shopping list in saved plan', async () => {
      const saved = await saveMealPlan(userId, sampleMealPlan);

      expect(saved.shoppingList).toHaveLength(2);
      expect(saved.shoppingList[0].item).toBe('Oats');
    });
  });

  describe('getLatestMealPlan', () => {
    it('should return the most recent meal plan', async () => {
      await saveMealPlan(userId, { ...sampleMealPlan, name: 'Older Plan' });
      await new Promise((r) => setTimeout(r, 10)); // Small delay
      await saveMealPlan(userId, { ...sampleMealPlan, name: 'Newer Plan' });

      const latest = await getLatestMealPlan(userId);

      expect(latest.name).toBe('Newer Plan');
    });

    it('should return null if user has no meal plans', async () => {
      const result = await getLatestMealPlan('no-plans-user');
      expect(result).toBeNull();
    });

    it('should only return plans for specified user', async () => {
      await saveMealPlan(userId, { ...sampleMealPlan, name: 'My Plan' });
      await saveMealPlan('other-user', { ...sampleMealPlan, name: 'Other Plan' });

      const latest = await getLatestMealPlan(userId);

      expect(latest.name).toBe('My Plan');
    });
  });

  describe('getAllMealPlans', () => {
    it('should return all meal plans for a user', async () => {
      await saveMealPlan(userId, { ...sampleMealPlan, name: 'Plan 1' });
      await saveMealPlan(userId, { ...sampleMealPlan, name: 'Plan 2' });
      await saveMealPlan(userId, { ...sampleMealPlan, name: 'Plan 3' });

      const plans = await getAllMealPlans(userId);

      expect(plans).toHaveLength(3);
    });

    it('should return plans sorted by savedAt descending', async () => {
      await saveMealPlan(userId, { ...sampleMealPlan, name: 'First' });
      await new Promise((r) => setTimeout(r, 10));
      await saveMealPlan(userId, { ...sampleMealPlan, name: 'Second' });
      await new Promise((r) => setTimeout(r, 10));
      await saveMealPlan(userId, { ...sampleMealPlan, name: 'Third' });

      const plans = await getAllMealPlans(userId);

      expect(plans[0].name).toBe('Third');
      expect(plans[1].name).toBe('Second');
      expect(plans[2].name).toBe('First');
    });

    it('should return empty array for user with no plans', async () => {
      const plans = await getAllMealPlans('empty-user');
      expect(plans).toEqual([]);
    });
  });

  describe('deleteMealPlan', () => {
    it('should delete a meal plan by ID', async () => {
      const saved = await saveMealPlan(userId, sampleMealPlan);

      await deleteMealPlan(saved.id);

      const plans = await getAllMealPlans(userId);
      expect(plans).toHaveLength(0);
    });

    it('should only delete the specified plan', async () => {
      const plan1 = await saveMealPlan(userId, { ...sampleMealPlan, name: 'Keep' });
      const plan2 = await saveMealPlan(userId, { ...sampleMealPlan, name: 'Delete' });

      await deleteMealPlan(plan2.id);

      const plans = await getAllMealPlans(userId);
      expect(plans).toHaveLength(1);
      expect(plans[0].name).toBe('Keep');
    });
  });

  describe('clearUserMealPlans', () => {
    it('should delete all meal plans for a user', async () => {
      await saveMealPlan(userId, { ...sampleMealPlan, name: 'Plan 1' });
      await saveMealPlan(userId, { ...sampleMealPlan, name: 'Plan 2' });
      await saveMealPlan('other-user', { ...sampleMealPlan, name: 'Other Plan' });

      await clearUserMealPlans(userId);

      const userPlans = await getAllMealPlans(userId);
      const otherPlans = await getAllMealPlans('other-user');

      expect(userPlans).toHaveLength(0);
      expect(otherPlans).toHaveLength(1);
    });
  });
});
