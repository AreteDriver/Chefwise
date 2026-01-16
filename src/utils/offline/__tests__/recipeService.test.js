/**
 * Tests for recipeService
 */

import 'fake-indexeddb/auto';
import { offlineDB, STORES } from '../offlineDB';
import {
  saveRecipe,
  getRecipe,
  getUserRecipes,
  deleteRecipe,
  searchRecipes,
  clearUserRecipes,
  getRecipeCount,
} from '../recipeService';

describe('recipeService', () => {
  const userId = 'test-user-1';

  beforeEach(async () => {
    await offlineDB.clear(STORES.RECIPES);
  });

  afterAll(() => {
    offlineDB.closeDB();
  });

  describe('saveRecipe', () => {
    it('should save a recipe with generated ID', async () => {
      const recipe = {
        title: 'Test Recipe',
        description: 'A delicious test recipe',
        ingredients: ['flour', 'sugar', 'eggs'],
        tags: ['dessert', 'easy'],
      };

      const saved = await saveRecipe(userId, recipe);

      expect(saved.id).toBeDefined();
      expect(saved.id).toMatch(/^recipe_/);
      expect(saved.userId).toBe(userId);
      expect(saved.title).toBe('Test Recipe');
      expect(saved.savedAt).toBeDefined();
    });

    it('should use provided ID if available', async () => {
      const recipe = {
        id: 'custom-recipe-id',
        title: 'Custom ID Recipe',
      };

      const saved = await saveRecipe(userId, recipe);

      expect(saved.id).toBe('custom-recipe-id');
    });
  });

  describe('getRecipe', () => {
    it('should retrieve a saved recipe by ID', async () => {
      const saved = await saveRecipe(userId, { title: 'Findable Recipe' });

      const retrieved = await getRecipe(saved.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.title).toBe('Findable Recipe');
    });

    it('should return null for non-existent recipe', async () => {
      const result = await getRecipe('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getUserRecipes', () => {
    it('should return all recipes for a user', async () => {
      await saveRecipe(userId, { title: 'Recipe 1' });
      await saveRecipe(userId, { title: 'Recipe 2' });
      await saveRecipe('other-user', { title: 'Other User Recipe' });

      const recipes = await getUserRecipes(userId);

      expect(recipes).toHaveLength(2);
      expect(recipes.every((r) => r.userId === userId)).toBe(true);
    });

    it('should return recipes sorted by savedAt descending', async () => {
      await saveRecipe(userId, { title: 'First' });
      await new Promise((r) => setTimeout(r, 10)); // Small delay
      await saveRecipe(userId, { title: 'Second' });

      const recipes = await getUserRecipes(userId);

      expect(recipes[0].title).toBe('Second');
      expect(recipes[1].title).toBe('First');
    });

    it('should return empty array for user with no recipes', async () => {
      const recipes = await getUserRecipes('no-recipes-user');
      expect(recipes).toEqual([]);
    });
  });

  describe('deleteRecipe', () => {
    it('should delete a recipe by ID', async () => {
      const saved = await saveRecipe(userId, { title: 'To Delete' });

      await deleteRecipe(saved.id);

      const result = await getRecipe(saved.id);
      expect(result).toBeNull();
    });
  });

  describe('searchRecipes', () => {
    beforeEach(async () => {
      await saveRecipe(userId, {
        title: 'Chocolate Cake',
        tags: ['dessert', 'chocolate'],
        ingredients: ['flour', 'cocoa', 'sugar'],
      });
      await saveRecipe(userId, {
        title: 'Chicken Stir Fry',
        tags: ['dinner', 'asian'],
        ingredients: ['chicken', 'vegetables', 'soy sauce'],
      });
      await saveRecipe(userId, {
        title: 'Chocolate Chip Cookies',
        tags: ['dessert', 'cookies'],
        ingredients: ['flour', 'chocolate chips', 'butter'],
      });
    });

    it('should find recipes by title', async () => {
      const results = await searchRecipes(userId, 'chocolate');

      expect(results).toHaveLength(2);
      expect(results.some((r) => r.title === 'Chocolate Cake')).toBe(true);
      expect(results.some((r) => r.title === 'Chocolate Chip Cookies')).toBe(true);
    });

    it('should find recipes by tag', async () => {
      const results = await searchRecipes(userId, 'dessert');

      expect(results).toHaveLength(2);
    });

    it('should find recipes by ingredient', async () => {
      const results = await searchRecipes(userId, 'flour');

      expect(results).toHaveLength(2);
    });

    it('should be case insensitive', async () => {
      const results = await searchRecipes(userId, 'CHICKEN');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Chicken Stir Fry');
    });

    it('should return empty array for no matches', async () => {
      const results = await searchRecipes(userId, 'pizza');
      expect(results).toEqual([]);
    });
  });

  describe('clearUserRecipes', () => {
    it('should delete all recipes for a user', async () => {
      await saveRecipe(userId, { title: 'Recipe 1' });
      await saveRecipe(userId, { title: 'Recipe 2' });
      await saveRecipe('other-user', { title: 'Other Recipe' });

      await clearUserRecipes(userId);

      const userRecipes = await getUserRecipes(userId);
      const otherRecipes = await getUserRecipes('other-user');

      expect(userRecipes).toHaveLength(0);
      expect(otherRecipes).toHaveLength(1);
    });
  });

  describe('getRecipeCount', () => {
    it('should return correct count of user recipes', async () => {
      await saveRecipe(userId, { title: 'Recipe 1' });
      await saveRecipe(userId, { title: 'Recipe 2' });
      await saveRecipe(userId, { title: 'Recipe 3' });

      const count = await getRecipeCount(userId);

      expect(count).toBe(3);
    });

    it('should return 0 for user with no recipes', async () => {
      const count = await getRecipeCount('empty-user');
      expect(count).toBe(0);
    });
  });
});
