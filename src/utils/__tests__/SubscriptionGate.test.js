import {
  PLAN_TIERS,
  PLAN_LIMITS,
  checkPlanTier,
  getUserPlanTier,
  isPremiumUser,
} from '../SubscriptionGate';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  increment: jest.fn((val) => ({ _increment: val })),
}));

jest.mock('../../firebase/firebaseConfig', () => ({
  db: {},
}));

import { doc, getDoc, updateDoc } from 'firebase/firestore';

describe('SubscriptionGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PLAN_TIERS', () => {
    it('should define FREE tier', () => {
      expect(PLAN_TIERS.FREE).toBe('free');
    });

    it('should define PRO tier', () => {
      expect(PLAN_TIERS.PRO).toBe('pro');
    });

    it('should define CHEF tier', () => {
      expect(PLAN_TIERS.CHEF).toBe('chef');
    });

    it('should alias PREMIUM to pro', () => {
      expect(PLAN_TIERS.PREMIUM).toBe('pro');
    });
  });

  describe('PLAN_LIMITS', () => {
    it('should define free tier limits', () => {
      const freeLimits = PLAN_LIMITS[PLAN_TIERS.FREE];

      expect(freeLimits.recipesPerDay).toBe(2);
      expect(freeLimits.dietFilters).toBe(1);
      expect(freeLimits.mealPlanDays).toBe(3);
      expect(freeLimits.pantryItems).toBe(20);
      expect(freeLimits.savedRecipes).toBe(10);
    });

    it('should define pro tier limits', () => {
      const proLimits = PLAN_LIMITS[PLAN_TIERS.PRO];

      expect(proLimits.recipesPerDay).toBe(Infinity);
      expect(proLimits.dietFilters).toBe(Infinity);
      expect(proLimits.mealPlanDays).toBe(14);
      expect(proLimits.pantryItems).toBe(Infinity);
      expect(proLimits.savedRecipes).toBe(Infinity);
    });

    it('should define chef tier limits', () => {
      const chefLimits = PLAN_LIMITS[PLAN_TIERS.CHEF];

      expect(chefLimits.recipesPerDay).toBe(Infinity);
      expect(chefLimits.dietFilters).toBe(Infinity);
      expect(chefLimits.mealPlanDays).toBe(30);
      expect(chefLimits.pantryItems).toBe(Infinity);
      expect(chefLimits.savedRecipes).toBe(Infinity);
    });
  });

  describe('checkPlanTier', () => {
    const mockUserDoc = (data, exists = true) => ({
      exists: () => exists,
      data: () => data,
    });

    describe('user not found', () => {
      it('should return not allowed when user does not exist', async () => {
        getDoc.mockResolvedValue(mockUserDoc(null, false));

        const result = await checkPlanTier('user123', 'generateRecipe');

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('User not found');
      });
    });

    describe('generateRecipe feature', () => {
      it('should allow free user under daily limit', async () => {
        const today = new Date().toISOString().split('T')[0];
        getDoc.mockResolvedValue(
          mockUserDoc({
            planTier: PLAN_TIERS.FREE,
            dailyUsage: { [today]: 1 },
          })
        );
        updateDoc.mockResolvedValue();

        const result = await checkPlanTier('user123', 'generateRecipe');

        expect(result.allowed).toBe(true);
        expect(updateDoc).toHaveBeenCalled();
      });

      it('should deny free user at daily limit', async () => {
        const today = new Date().toISOString().split('T')[0];
        getDoc.mockResolvedValue(
          mockUserDoc({
            planTier: PLAN_TIERS.FREE,
            dailyUsage: { [today]: 2 },
          })
        );

        const result = await checkPlanTier('user123', 'generateRecipe');

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Daily limit reached');
        expect(updateDoc).not.toHaveBeenCalled();
      });

      it('should deny free user over daily limit', async () => {
        const today = new Date().toISOString().split('T')[0];
        getDoc.mockResolvedValue(
          mockUserDoc({
            planTier: PLAN_TIERS.FREE,
            dailyUsage: { [today]: 5 },
          })
        );

        const result = await checkPlanTier('user123', 'generateRecipe');

        expect(result.allowed).toBe(false);
      });

      it('should allow premium user with unlimited recipes', async () => {
        const today = new Date().toISOString().split('T')[0];
        getDoc.mockResolvedValue(
          mockUserDoc({
            planTier: PLAN_TIERS.PREMIUM,
            dailyUsage: { [today]: 100 },
          })
        );
        updateDoc.mockResolvedValue();

        const result = await checkPlanTier('user123', 'generateRecipe');

        expect(result.allowed).toBe(true);
      });

      it('should allow user with no usage today', async () => {
        getDoc.mockResolvedValue(
          mockUserDoc({
            planTier: PLAN_TIERS.FREE,
            dailyUsage: {},
          })
        );
        updateDoc.mockResolvedValue();

        const result = await checkPlanTier('user123', 'generateRecipe');

        expect(result.allowed).toBe(true);
      });

      it('should default to free tier when planTier is missing', async () => {
        const today = new Date().toISOString().split('T')[0];
        getDoc.mockResolvedValue(
          mockUserDoc({
            dailyUsage: { [today]: 2 },
          })
        );

        const result = await checkPlanTier('user123', 'generateRecipe');

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Daily limit reached');
      });
    });

    describe('dietFilters feature', () => {
      it('should allow free user with no active filters', async () => {
        getDoc.mockResolvedValue(
          mockUserDoc({
            planTier: PLAN_TIERS.FREE,
            activeDietFilters: [],
          })
        );

        const result = await checkPlanTier('user123', 'dietFilters');

        expect(result.allowed).toBe(true);
      });

      it('should deny free user at filter limit', async () => {
        getDoc.mockResolvedValue(
          mockUserDoc({
            planTier: PLAN_TIERS.FREE,
            activeDietFilters: ['vegetarian'],
          })
        );

        const result = await checkPlanTier('user123', 'dietFilters');

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('1 diet filter');
      });

      it('should allow premium user with multiple filters', async () => {
        getDoc.mockResolvedValue(
          mockUserDoc({
            planTier: PLAN_TIERS.PREMIUM,
            activeDietFilters: ['vegetarian', 'gluten-free', 'dairy-free'],
          })
        );

        const result = await checkPlanTier('user123', 'dietFilters');

        expect(result.allowed).toBe(true);
      });
    });

    describe('mealPlan feature', () => {
      it('should return max days for free user', async () => {
        getDoc.mockResolvedValue(
          mockUserDoc({
            planTier: PLAN_TIERS.FREE,
          })
        );

        const result = await checkPlanTier('user123', 'mealPlan');

        expect(result.allowed).toBe(true);
        expect(result.maxDays).toBe(3);
      });

      it('should return max days for pro user', async () => {
        getDoc.mockResolvedValue(
          mockUserDoc({
            planTier: PLAN_TIERS.PRO,
          })
        );

        const result = await checkPlanTier('user123', 'mealPlan');

        expect(result.allowed).toBe(true);
        expect(result.maxDays).toBe(14);
      });

      it('should return max days for chef user', async () => {
        getDoc.mockResolvedValue(
          mockUserDoc({
            planTier: PLAN_TIERS.CHEF,
          })
        );

        const result = await checkPlanTier('user123', 'mealPlan');

        expect(result.allowed).toBe(true);
        expect(result.maxDays).toBe(30);
      });
    });

    describe('unknown feature', () => {
      it('should allow unknown features by default', async () => {
        getDoc.mockResolvedValue(
          mockUserDoc({
            planTier: PLAN_TIERS.FREE,
          })
        );

        const result = await checkPlanTier('user123', 'unknownFeature');

        expect(result.allowed).toBe(true);
      });
    });

    describe('error handling', () => {
      it('should return not allowed on Firebase error', async () => {
        getDoc.mockRejectedValue(new Error('Firebase error'));

        const result = await checkPlanTier('user123', 'generateRecipe');

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('Error checking subscription status');
      });
    });
  });

  describe('getUserPlanTier', () => {
    it('should return user plan tier', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ planTier: PLAN_TIERS.PREMIUM }),
      });

      const result = await getUserPlanTier('user123');

      expect(result).toBe(PLAN_TIERS.PREMIUM);
    });

    it('should return FREE when user has no planTier', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({}),
      });

      const result = await getUserPlanTier('user123');

      expect(result).toBe(PLAN_TIERS.FREE);
    });

    it('should return FREE when user does not exist', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await getUserPlanTier('user123');

      expect(result).toBe(PLAN_TIERS.FREE);
    });

    it('should return FREE on error', async () => {
      getDoc.mockRejectedValue(new Error('Firebase error'));

      const result = await getUserPlanTier('user123');

      expect(result).toBe(PLAN_TIERS.FREE);
    });
  });

  describe('isPremiumUser', () => {
    it('should return true for premium user', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ planTier: PLAN_TIERS.PREMIUM }),
      });

      const result = await isPremiumUser('user123');

      expect(result).toBe(true);
    });

    it('should return false for free user', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ planTier: PLAN_TIERS.FREE }),
      });

      const result = await isPremiumUser('user123');

      expect(result).toBe(false);
    });

    it('should return false when user does not exist', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await isPremiumUser('user123');

      expect(result).toBe(false);
    });
  });
});
