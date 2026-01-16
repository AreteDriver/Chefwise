/**
 * Offline-Aware Recipe Service
 * Caches generated and saved recipes for offline viewing
 */

import { offlineDB, STORES } from './offlineDB';

/**
 * Save a recipe to offline storage
 * @param {string} userId - User ID
 * @param {Object} recipe - Recipe data
 * @returns {Promise<Object>} Saved recipe with ID
 */
let recipeCounter = 0;

export async function saveRecipe(userId, recipe) {
  recipeCounter++;
  const recipeId = recipe.id || `recipe_${userId}_${Date.now()}_${recipeCounter}_${Math.random().toString(36).substr(2, 5)}`;
  const recipeData = {
    id: recipeId,
    userId,
    ...recipe,
    savedAt: new Date().toISOString(),
  };

  await offlineDB.put(STORES.RECIPES, recipeData);
  return recipeData;
}

/**
 * Get a specific recipe by ID
 * @param {string} recipeId - Recipe ID
 * @returns {Promise<Object|null>} Recipe or null
 */
export async function getRecipe(recipeId) {
  return offlineDB.get(STORES.RECIPES, recipeId);
}

/**
 * Get all cached recipes for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object[]>} Array of recipes
 */
export async function getUserRecipes(userId) {
  const recipes = await offlineDB.getByIndex(STORES.RECIPES, 'userId', userId);
  return recipes.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
}

/**
 * Delete a recipe from offline storage
 * @param {string} recipeId - Recipe ID
 * @returns {Promise<void>}
 */
export async function deleteRecipe(recipeId) {
  await offlineDB.remove(STORES.RECIPES, recipeId);
}

/**
 * Search recipes by title or tags
 * @param {string} userId - User ID
 * @param {string} query - Search query
 * @returns {Promise<Object[]>} Matching recipes
 */
export async function searchRecipes(userId, query) {
  const recipes = await getUserRecipes(userId);
  const lowerQuery = query.toLowerCase();

  return recipes.filter((recipe) => {
    const titleMatch = recipe.title?.toLowerCase().includes(lowerQuery);
    const tagMatch = recipe.tags?.some((tag) =>
      tag.toLowerCase().includes(lowerQuery)
    );
    const ingredientMatch = recipe.ingredients?.some((ing) =>
      ing.toLowerCase().includes(lowerQuery)
    );

    return titleMatch || tagMatch || ingredientMatch;
  });
}

/**
 * Clear all recipes for a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function clearUserRecipes(userId) {
  const recipes = await offlineDB.getByIndex(STORES.RECIPES, 'userId', userId);
  for (const recipe of recipes) {
    await offlineDB.remove(STORES.RECIPES, recipe.id);
  }
}

/**
 * Get recipe count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>}
 */
export async function getRecipeCount(userId) {
  const recipes = await offlineDB.getByIndex(STORES.RECIPES, 'userId', userId);
  return recipes.length;
}

export const recipeService = {
  saveRecipe,
  getRecipe,
  getUserRecipes,
  deleteRecipe,
  searchRecipes,
  clearUserRecipes,
  getRecipeCount,
};

export default recipeService;
