import { SUBSCRIPTION_PLANS, PLAN_FEATURES } from '../subscriptionConstants';

describe('subscriptionConstants', () => {
  describe('SUBSCRIPTION_PLANS', () => {
    it('should define FREE plan', () => {
      expect(SUBSCRIPTION_PLANS.FREE).toEqual(
        expect.objectContaining({
          id: 'free',
          name: 'Free',
          price: { monthly: 0, yearly: 0 },
          displayPrice: { monthly: '$0', yearly: '$0' },
          period: 'forever',
        })
      );
    });

    it('should define PRO plan', () => {
      expect(SUBSCRIPTION_PLANS.PRO).toEqual(
        expect.objectContaining({
          id: 'pro',
          name: 'Pro',
          price: { monthly: 9, yearly: 79 },
          displayPrice: { monthly: '$9', yearly: '$79' },
          period: '/month',
        })
      );
    });

    it('should have numeric price values', () => {
      expect(typeof SUBSCRIPTION_PLANS.FREE.price.monthly).toBe('number');
      expect(typeof SUBSCRIPTION_PLANS.PRO.price.monthly).toBe('number');
    });
  });

  describe('PLAN_FEATURES', () => {
    it('should define FREE plan features', () => {
      expect(PLAN_FEATURES.FREE).toBeInstanceOf(Array);
      expect(PLAN_FEATURES.FREE.length).toBeGreaterThan(0);
    });

    it('should define PREMIUM plan features', () => {
      expect(PLAN_FEATURES.PREMIUM).toBeInstanceOf(Array);
      expect(PLAN_FEATURES.PREMIUM.length).toBeGreaterThan(0);
    });

    it('should have more pro features than free', () => {
      expect(PLAN_FEATURES.PRO.length).toBeGreaterThan(PLAN_FEATURES.FREE.length);
    });

    it('should include key free features', () => {
      const freeFeatures = PLAN_FEATURES.FREE.join(' ');
      expect(freeFeatures).toContain('2 AI recipes');
      expect(freeFeatures).toContain('1 diet filter');
      expect(freeFeatures).toContain('3-day meal plans');
    });

    it('should include key pro features', () => {
      const proFeatures = PLAN_FEATURES.PRO.join(' ');
      expect(proFeatures).toContain('Unlimited');
      expect(proFeatures).toContain('14-day meal plans');
      expect(proFeatures).toContain('No ads');
    });

    it('should include key chef features', () => {
      const chefFeatures = PLAN_FEATURES.CHEF.join(' ');
      expect(chefFeatures).toContain('30-day meal plans');
      expect(chefFeatures).toContain('Priority AI');
      expect(chefFeatures).toContain('API access');
    });
  });
});
