import { SUBSCRIPTION_PLANS, PLAN_FEATURES } from '../subscriptionConstants';

describe('subscriptionConstants', () => {
  describe('SUBSCRIPTION_PLANS', () => {
    it('should define FREE plan', () => {
      expect(SUBSCRIPTION_PLANS.FREE).toEqual({
        name: 'Free',
        price: 0,
        displayPrice: '$0',
        period: 'forever',
      });
    });

    it('should define PREMIUM plan', () => {
      expect(SUBSCRIPTION_PLANS.PREMIUM).toEqual({
        name: 'Premium',
        price: 9,
        displayPrice: '$9',
        period: '/month',
      });
    });

    it('should have numeric price values', () => {
      expect(typeof SUBSCRIPTION_PLANS.FREE.price).toBe('number');
      expect(typeof SUBSCRIPTION_PLANS.PREMIUM.price).toBe('number');
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

    it('should have more premium features than free', () => {
      expect(PLAN_FEATURES.PREMIUM.length).toBeGreaterThan(PLAN_FEATURES.FREE.length);
    });

    it('should include key free features', () => {
      const freeFeatures = PLAN_FEATURES.FREE.join(' ');
      expect(freeFeatures).toContain('2 AI recipes');
      expect(freeFeatures).toContain('1 diet filter');
      expect(freeFeatures).toContain('3-day meal plans');
    });

    it('should include key premium features', () => {
      const premiumFeatures = PLAN_FEATURES.PREMIUM.join(' ');
      expect(premiumFeatures).toContain('Unlimited');
      expect(premiumFeatures).toContain('30-day meal plans');
      expect(premiumFeatures).toContain('No ads');
    });
  });
});
