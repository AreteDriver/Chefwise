/**
 * Offline Utilities Index
 * Re-exports all offline-related utilities for easier imports
 */

export { offlineDB, STORES } from './offlineDB';
export {
  syncQueue,
  queueOperation,
  getPendingCount,
  getPendingOperations,
  processQueue,
  OPERATION_TYPES,
  SYNC_STATUS,
} from './syncQueue';
export {
  pantryService,
  subscribeToPantry,
  addPantryItem,
  deletePantryItem,
  getPendingItems,
  isPendingSync,
  LOCAL_STATUS,
} from './pantryService';
export {
  mealPlanService,
  saveMealPlan,
  getLatestMealPlan,
  getAllMealPlans,
  deleteMealPlan,
} from './mealPlanService';
export {
  recipeService,
  saveRecipe,
  getRecipe,
  getUserRecipes,
  deleteRecipe,
  searchRecipes,
} from './recipeService';
