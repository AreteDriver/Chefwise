import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

/**
 * Plan tier definitions
 */
export const PLAN_TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
};

/**
 * Feature limits by plan
 */
export const PLAN_LIMITS = {
  [PLAN_TIERS.FREE]: {
    recipesPerDay: 2,
    dietFilters: 1,
    mealPlanDays: 3,
    pantryItems: 20,
    savedRecipes: 10,
  },
  [PLAN_TIERS.PREMIUM]: {
    recipesPerDay: Infinity,
    dietFilters: Infinity,
    mealPlanDays: 30,
    pantryItems: Infinity,
    savedRecipes: Infinity,
  },
};

/**
 * Check if user can perform an action based on their plan tier
 * @param {string} userId - User ID
 * @param {string} feature - Feature to check
 * @returns {Promise<{allowed: boolean, reason?: string}>}
 */
export const checkPlanTier = async (userId, feature) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return { allowed: false, reason: 'User not found' };
    }

    const userData = userDoc.data();
    const planTier = userData.planTier || PLAN_TIERS.FREE;
    const limits = PLAN_LIMITS[planTier];

    // Check daily recipe limit
    if (feature === 'generateRecipe') {
      const today = new Date().toISOString().split('T')[0];
      const usageToday = userData.dailyUsage?.[today] || 0;

      if (usageToday >= limits.recipesPerDay) {
        return {
          allowed: false,
          reason: `Daily limit reached. Upgrade to premium for unlimited recipes.`,
        };
      }

      // Increment usage counter
      await updateDoc(doc(db, 'users', userId), {
        [`dailyUsage.${today}`]: increment(1),
      });

      return { allowed: true };
    }

    // Check diet filters
    if (feature === 'dietFilters') {
      const activeFilters = userData.activeDietFilters?.length || 0;
      
      if (activeFilters >= limits.dietFilters) {
        return {
          allowed: false,
          reason: `You can only use ${limits.dietFilters} diet filter on the free plan.`,
        };
      }

      return { allowed: true };
    }

    // Check meal plan days
    if (feature === 'mealPlan') {
      return {
        allowed: true,
        maxDays: limits.mealPlanDays,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking plan tier:', error);
    return { allowed: false, reason: 'Error checking subscription status' };
  }
};

/**
 * Get user's current plan tier
 * @param {string} userId - User ID
 * @returns {Promise<string>}
 */
export const getUserPlanTier = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data().planTier || PLAN_TIERS.FREE : PLAN_TIERS.FREE;
  } catch (error) {
    console.error('Error getting plan tier:', error);
    return PLAN_TIERS.FREE;
  }
};

/**
 * Check if user has premium access
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export const isPremiumUser = async (userId) => {
  const planTier = await getUserPlanTier(userId);
  return planTier === PLAN_TIERS.PREMIUM;
};
