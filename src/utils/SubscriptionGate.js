import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

/**
 * Plan tier definitions
 */
export const PLAN_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  CHEF: 'chef',
  // Legacy alias for backwards compatibility
  PREMIUM: 'pro',
};

/**
 * Plan tier hierarchy (higher index = higher tier)
 */
export const TIER_HIERARCHY = [PLAN_TIERS.FREE, PLAN_TIERS.PRO, PLAN_TIERS.CHEF];

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
    recipeChat: false,
    priorityAI: false,
    customBranding: false,
    shoppingListExport: false,
    apiAccess: false,
  },
  [PLAN_TIERS.PRO]: {
    recipesPerDay: Infinity,
    dietFilters: Infinity,
    mealPlanDays: 14,
    pantryItems: Infinity,
    savedRecipes: Infinity,
    recipeChat: false,
    priorityAI: false,
    customBranding: false,
    shoppingListExport: true,
    apiAccess: false,
  },
  [PLAN_TIERS.CHEF]: {
    recipesPerDay: Infinity,
    dietFilters: Infinity,
    mealPlanDays: 30,
    pantryItems: Infinity,
    savedRecipes: Infinity,
    recipeChat: true,
    priorityAI: true,
    customBranding: true,
    shoppingListExport: true,
    apiAccess: true,
  },
};

/**
 * Normalize plan tier (handle legacy 'premium' as 'pro')
 */
export const normalizePlanTier = (tier) => {
  if (tier === 'premium') return PLAN_TIERS.PRO;
  if (!tier || !PLAN_LIMITS[tier]) return PLAN_TIERS.FREE;
  return tier;
};

/**
 * Check if a tier has access to a feature
 */
export const tierHasFeature = (tier, feature) => {
  const normalizedTier = normalizePlanTier(tier);
  const limits = PLAN_LIMITS[normalizedTier];
  return limits[feature] === true || limits[feature] === Infinity;
};

/**
 * Get tier display name
 */
export const getTierDisplayName = (tier) => {
  const normalizedTier = normalizePlanTier(tier);
  switch (normalizedTier) {
    case PLAN_TIERS.CHEF:
      return 'Chef';
    case PLAN_TIERS.PRO:
      return 'Pro';
    default:
      return 'Free';
  }
};

/**
 * Check if tier is paid
 */
export const isPaidTier = (tier) => {
  const normalizedTier = normalizePlanTier(tier);
  return normalizedTier === PLAN_TIERS.PRO || normalizedTier === PLAN_TIERS.CHEF;
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
    const planTier = normalizePlanTier(userData.planTier);
    const limits = PLAN_LIMITS[planTier];

    // Check daily recipe limit
    if (feature === 'generateRecipe') {
      const today = new Date().toISOString().split('T')[0];
      const usageToday = userData.dailyUsage?.[today] || 0;

      if (usageToday >= limits.recipesPerDay) {
        return {
          allowed: false,
          reason: `Daily limit reached. Upgrade to Pro for unlimited recipes.`,
          upgradeRequired: true,
          suggestedTier: PLAN_TIERS.PRO,
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
          upgradeRequired: true,
          suggestedTier: PLAN_TIERS.PRO,
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

    // Check recipe chat
    if (feature === 'recipeChat') {
      if (!limits.recipeChat) {
        return {
          allowed: false,
          reason: 'Recipe chat is a Chef-exclusive feature.',
          upgradeRequired: true,
          suggestedTier: PLAN_TIERS.CHEF,
        };
      }
      return { allowed: true };
    }

    // Check priority AI
    if (feature === 'priorityAI') {
      return {
        allowed: limits.priorityAI,
        usePriorityModel: limits.priorityAI,
      };
    }

    // Check custom branding
    if (feature === 'customBranding') {
      if (!limits.customBranding) {
        return {
          allowed: false,
          reason: 'Custom branding is a Chef-exclusive feature.',
          upgradeRequired: true,
          suggestedTier: PLAN_TIERS.CHEF,
        };
      }
      return { allowed: true };
    }

    // Check shopping list export
    if (feature === 'shoppingListExport') {
      if (!limits.shoppingListExport) {
        return {
          allowed: false,
          reason: 'Shopping list export requires a Pro or Chef plan.',
          upgradeRequired: true,
          suggestedTier: PLAN_TIERS.PRO,
        };
      }
      return { allowed: true };
    }

    // Check API access
    if (feature === 'apiAccess') {
      if (!limits.apiAccess) {
        return {
          allowed: false,
          reason: 'API access is a Chef-exclusive feature.',
          upgradeRequired: true,
          suggestedTier: PLAN_TIERS.CHEF,
        };
      }
      return { allowed: true };
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
    const tier = userDoc.exists() ? userDoc.data().planTier : PLAN_TIERS.FREE;
    return normalizePlanTier(tier);
  } catch (error) {
    console.error('Error getting plan tier:', error);
    return PLAN_TIERS.FREE;
  }
};

/**
 * Check if user has paid access (Pro or Chef)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export const isPaidUser = async (userId) => {
  const planTier = await getUserPlanTier(userId);
  return isPaidTier(planTier);
};

/**
 * Check if user has Pro access (Pro or higher)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export const isProUser = async (userId) => {
  const planTier = await getUserPlanTier(userId);
  return planTier === PLAN_TIERS.PRO || planTier === PLAN_TIERS.CHEF;
};

/**
 * Check if user has Chef access
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export const isChefUser = async (userId) => {
  const planTier = await getUserPlanTier(userId);
  return planTier === PLAN_TIERS.CHEF;
};

/**
 * Legacy: Check if user has premium access (now maps to Pro or higher)
 * @deprecated Use isProUser or isChefUser instead
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export const isPremiumUser = async (userId) => {
  return isPaidUser(userId);
};
