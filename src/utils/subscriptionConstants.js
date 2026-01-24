/**
 * Subscription plan constants for Chefwise
 * Tiered pricing: Free, Pro, Chef
 */

/**
 * Stripe Price IDs - Set these in your environment variables
 * Create products and prices in Stripe Dashboard
 */
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
  PRO_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY,
  CHEF_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_CHEF_MONTHLY,
  CHEF_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_CHEF_YEARLY,
};

/**
 * Billing periods
 */
export const BILLING_PERIODS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};

/**
 * Subscription plan definitions
 */
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    description: 'Get started with AI cooking',
    price: {
      monthly: 0,
      yearly: 0,
    },
    displayPrice: {
      monthly: '$0',
      yearly: '$0',
    },
    period: 'forever',
    stripePriceId: null,
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    description: 'Unlock unlimited recipes & meal planning',
    price: {
      monthly: 9,
      yearly: 79,
    },
    displayPrice: {
      monthly: '$9',
      yearly: '$79',
    },
    yearlySavings: '$29',
    yearlySavingsPercent: '27%',
    period: '/month',
    stripePriceId: {
      monthly: STRIPE_PRICES.PRO_MONTHLY,
      yearly: STRIPE_PRICES.PRO_YEARLY,
    },
  },
  CHEF: {
    id: 'chef',
    name: 'Chef',
    description: 'Premium AI power & exclusive features',
    price: {
      monthly: 19,
      yearly: 159,
    },
    displayPrice: {
      monthly: '$19',
      yearly: '$159',
    },
    yearlySavings: '$69',
    yearlySavingsPercent: '30%',
    period: '/month',
    stripePriceId: {
      monthly: STRIPE_PRICES.CHEF_MONTHLY,
      yearly: STRIPE_PRICES.CHEF_YEARLY,
    },
  },
  // Legacy alias for backwards compatibility
  PREMIUM: {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 9, yearly: 79 },
    displayPrice: { monthly: '$9', yearly: '$79' },
    period: '/month',
  },
};

/**
 * Feature lists for each plan (used on pricing page)
 */
export const PLAN_FEATURES = {
  FREE: [
    '2 AI recipes per day',
    '1 diet filter',
    '3-day meal plans',
    '20 pantry items',
    '10 saved recipes',
    'Basic nutrition tracking',
  ],
  PRO: [
    'Unlimited AI recipes',
    'All 12 diet filters',
    '14-day meal plans',
    'Unlimited pantry items',
    'Unlimited saved recipes',
    'Advanced macro tracking',
    'Shopping list export',
    'Email support',
    'No ads',
  ],
  CHEF: [
    'Everything in Pro, plus:',
    '30-day meal plans',
    'Priority AI (GPT-4)',
    'Recipe Chat assistant',
    'Custom meal plan branding',
    'PDF & print export',
    'Priority support',
    'Early access to features',
    'API access',
  ],
  // Legacy
  PREMIUM: [
    'Unlimited AI recipes',
    'All diet filters',
    '14-day meal plans',
    'Unlimited pantry items',
    'Unlimited saved recipes',
    'Shopping list export',
  ],
};

/**
 * Feature comparison matrix for detailed pricing table
 */
export const FEATURE_COMPARISON = [
  {
    category: 'Recipe Generation',
    features: [
      { name: 'AI recipes per day', free: '2', pro: 'Unlimited', chef: 'Unlimited' },
      { name: 'Diet filters', free: '1', pro: 'All 12', chef: 'All 12' },
      { name: 'Recipe Chat AI', free: false, pro: false, chef: true },
      { name: 'Priority AI model', free: false, pro: false, chef: true },
    ],
  },
  {
    category: 'Meal Planning',
    features: [
      { name: 'Meal plan duration', free: '3 days', pro: '14 days', chef: '30 days' },
      { name: 'Shopping list', free: true, pro: true, chef: true },
      { name: 'Shopping list export', free: false, pro: true, chef: true },
      { name: 'Custom branding', free: false, pro: false, chef: true },
      { name: 'PDF export', free: false, pro: false, chef: true },
    ],
  },
  {
    category: 'Storage & Tracking',
    features: [
      { name: 'Pantry items', free: '20', pro: 'Unlimited', chef: 'Unlimited' },
      { name: 'Saved recipes', free: '10', pro: 'Unlimited', chef: 'Unlimited' },
      { name: 'Macro tracking', free: 'Basic', pro: 'Advanced', chef: 'Advanced' },
    ],
  },
  {
    category: 'Support & Extras',
    features: [
      { name: 'Support', free: 'Community', pro: 'Email', chef: 'Priority' },
      { name: 'Ad-free experience', free: false, pro: true, chef: true },
      { name: 'Early feature access', free: false, pro: false, chef: true },
      { name: 'API access', free: false, pro: false, chef: true },
    ],
  },
];

/**
 * Get plan by ID
 */
export const getPlanById = (planId) => {
  const normalizedId = planId === 'premium' ? 'pro' : planId;
  return Object.values(SUBSCRIPTION_PLANS).find((plan) => plan.id === normalizedId);
};

/**
 * Get Stripe price ID for a plan and billing period
 */
export const getStripePriceId = (planId, billingPeriod = BILLING_PERIODS.MONTHLY) => {
  const plan = getPlanById(planId);
  if (!plan || !plan.stripePriceId) return null;
  return plan.stripePriceId[billingPeriod];
};

/**
 * Calculate yearly savings
 */
export const calculateYearlySavings = (plan) => {
  if (!plan.price.yearly) return null;
  const monthlyTotal = plan.price.monthly * 12;
  return monthlyTotal - plan.price.yearly;
};
