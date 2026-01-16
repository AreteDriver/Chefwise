/**
 * Offline-Aware Meal Plan Service
 * Caches generated meal plans for offline viewing
 */

import { offlineDB, STORES } from './offlineDB';

/**
 * Save a meal plan to offline storage
 * @param {string} userId - User ID
 * @param {Object} mealPlan - Generated meal plan
 * @returns {Promise<Object>} Saved meal plan with ID
 */
let mealPlanCounter = 0;

export async function saveMealPlan(userId, mealPlan) {
  mealPlanCounter++;
  const planId = `plan_${userId}_${Date.now()}_${mealPlanCounter}_${Math.random().toString(36).substr(2, 5)}`;
  const planData = {
    id: planId,
    userId,
    ...mealPlan,
    savedAt: new Date().toISOString(),
  };

  await offlineDB.put(STORES.MEAL_PLANS, planData);
  return planData;
}

/**
 * Get the most recent meal plan for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Most recent meal plan or null
 */
export async function getLatestMealPlan(userId) {
  const plans = await offlineDB.getByIndex(STORES.MEAL_PLANS, 'userId', userId);

  if (plans.length === 0) {
    return null;
  }

  // Sort by savedAt descending and return most recent
  plans.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  return plans[0];
}

/**
 * Get all cached meal plans for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object[]>} Array of meal plans
 */
export async function getAllMealPlans(userId) {
  const plans = await offlineDB.getByIndex(STORES.MEAL_PLANS, 'userId', userId);
  return plans.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
}

/**
 * Delete a meal plan from offline storage
 * @param {string} planId - Plan ID
 * @returns {Promise<void>}
 */
export async function deleteMealPlan(planId) {
  await offlineDB.remove(STORES.MEAL_PLANS, planId);
}

/**
 * Clear all meal plans for a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function clearUserMealPlans(userId) {
  const plans = await offlineDB.getByIndex(STORES.MEAL_PLANS, 'userId', userId);
  for (const plan of plans) {
    await offlineDB.remove(STORES.MEAL_PLANS, plan.id);
  }
}

export const mealPlanService = {
  saveMealPlan,
  getLatestMealPlan,
  getAllMealPlans,
  deleteMealPlan,
  clearUserMealPlans,
};

export default mealPlanService;
