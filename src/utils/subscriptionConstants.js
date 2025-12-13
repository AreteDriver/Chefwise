/**
 * Subscription plan constants
 */

export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    displayPrice: '$0',
    period: 'forever',
  },
  PREMIUM: {
    name: 'Premium',
    price: 9,
    displayPrice: '$9',
    period: '/month',
  },
};

export const PLAN_FEATURES = {
  FREE: [
    '2 AI recipes per day',
    '1 diet filter',
    '3-day meal plans',
    '20 pantry items',
    '10 saved recipes',
    'Basic nutrition tracking',
  ],
  PREMIUM: [
    'Unlimited AI recipes',
    'All diet filters',
    '30-day meal plans',
    'Unlimited pantry items',
    'Unlimited saved recipes',
    'Advanced macro tracking',
    'Shopping list export',
    'Priority support',
    'No ads',
  ],
};
