'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import MainLayout from '@/components/MainLayout';
import { useSubscription } from '@/contexts/SubscriptionContext';
import {
  SUBSCRIPTION_PLANS,
  PLAN_FEATURES,
  FEATURE_COMPARISON,
  BILLING_PERIODS,
} from '@/utils/subscriptionConstants';
import { trackUpgradeClick } from '@/utils/analytics';
import { useAuth } from '@/app/providers';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function UpgradePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const subscription = useSubscription();
  const [loading, setLoading] = useState(null); // Track which plan is loading
  const [error, setError] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState(BILLING_PERIODS.MONTHLY);
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const isYearly = billingPeriod === BILLING_PERIODS.YEARLY;

  const plans = [
    {
      ...SUBSCRIPTION_PLANS.FREE,
      features: PLAN_FEATURES.FREE,
      cta: subscription.isFree ? 'Current Plan' : 'Downgrade',
      current: subscription.isFree,
    },
    {
      ...SUBSCRIPTION_PLANS.PRO,
      features: PLAN_FEATURES.PRO,
      cta: subscription.isPro
        ? 'Current Plan'
        : subscription.isChef
        ? 'Downgrade'
        : 'Get Pro',
      highlighted: !subscription.isPaid,
      current: subscription.isPro,
      badge: 'Popular',
    },
    {
      ...SUBSCRIPTION_PLANS.CHEF,
      features: PLAN_FEATURES.CHEF,
      cta: subscription.isChef ? 'Current Plan' : 'Get Chef',
      highlighted: subscription.isPro,
      current: subscription.isChef,
      badge: 'Best Value',
    },
  ];

  const handleUpgrade = async (plan) => {
    if (plan.current || loading) return;

    // If downgrading or going to free, redirect to subscription management
    if (plan.id === 'free' || (subscription.isChef && plan.id === 'pro')) {
      router.push('/subscription');
      return;
    }

    // Track upgrade click
    trackUpgradeClick(plan.name, plan.price[billingPeriod].toString());

    setLoading(plan.id);
    setError(null);

    try {
      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          planId: plan.id,
          billingPeriod,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });
        if (error) throw error;
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to start checkout process');
    } finally {
      setLoading(null);
    }
  };

  return (
    <MainLayout user={user} currentPage="upgrade">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock the full power of AI-driven cooking. Start with Pro or go all
            in with Chef.
          </p>
        </div>

        {/* Canceled Message */}
        {canceled && (
          <div className="max-w-md mx-auto mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-center">
              Checkout was canceled. Feel free to try again when you're ready!
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="max-w-md mx-auto mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-center">{error}</p>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setBillingPeriod(BILLING_PERIODS.MONTHLY)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                !isYearly
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod(BILLING_PERIODS.YEARLY)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                isYearly
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Save up to 30%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-[1.02] ${
                plan.highlighted
                  ? 'ring-2 ring-primary shadow-xl'
                  : 'border border-gray-200'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  className={`absolute top-0 right-0 px-3 py-1 text-xs font-semibold rounded-bl-lg ${
                    plan.id === 'chef'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      : 'bg-primary text-white'
                  }`}
                >
                  {plan.badge}
                </div>
              )}

              <div className="p-6">
                {/* Plan Name */}
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {plan.name}
                </h3>
                <p className="text-gray-500 text-sm mb-4">{plan.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">
                      {isYearly
                        ? plan.displayPrice.yearly
                        : plan.displayPrice.monthly}
                    </span>
                    <span className="text-gray-500 ml-2">
                      {plan.id === 'free'
                        ? 'forever'
                        : isYearly
                        ? '/year'
                        : '/month'}
                    </span>
                  </div>
                  {isYearly && plan.yearlySavings && (
                    <p className="text-green-600 text-sm mt-1">
                      Save {plan.yearlySavings}/year ({plan.yearlySavingsPercent}{' '}
                      off)
                    </p>
                  )}
                  {isYearly && plan.id !== 'free' && (
                    <p className="text-gray-400 text-xs mt-1">
                      ${(plan.price.yearly / 12).toFixed(2)}/month billed
                      annually
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={plan.current || loading === plan.id}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    plan.current
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : plan.highlighted
                      ? 'bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl disabled:opacity-50'
                      : plan.id === 'chef'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl disabled:opacity-50'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    plan.cta
                  )}
                </button>

                {/* Features */}
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${
                          plan.id === 'chef'
                            ? 'text-amber-500'
                            : 'text-primary'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Compare All Features
          </h2>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-4 bg-gray-50 border-b">
              <div className="p-4 font-semibold text-gray-900">Feature</div>
              <div className="p-4 font-semibold text-gray-900 text-center">
                Free
              </div>
              <div className="p-4 font-semibold text-primary text-center">
                Pro
              </div>
              <div className="p-4 font-semibold text-amber-600 text-center">
                Chef
              </div>
            </div>

            {/* Feature Categories */}
            {FEATURE_COMPARISON.map((category, catIndex) => (
              <div key={catIndex}>
                {/* Category Header */}
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    {category.category}
                  </span>
                </div>

                {/* Features */}
                {category.features.map((feature, featIndex) => (
                  <div
                    key={featIndex}
                    className="grid grid-cols-4 border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="p-4 text-gray-700">{feature.name}</div>
                    <div className="p-4 text-center">
                      <FeatureValue value={feature.free} />
                    </div>
                    <div className="p-4 text-center">
                      <FeatureValue value={feature.pro} highlight />
                    </div>
                    <div className="p-4 text-center">
                      <FeatureValue value={feature.chef} premium />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <div className="flex justify-center space-x-8 mb-6">
            <div className="flex items-center text-gray-600">
              <svg
                className="w-5 h-5 mr-2 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Secure checkout
            </div>
            <div className="flex items-center text-gray-600">
              <svg
                className="w-5 h-5 mr-2 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Cancel anytime
            </div>
            <div className="flex items-center text-gray-600">
              <svg
                className="w-5 h-5 mr-2 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              30-day money-back guarantee
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Questions? Email us at support@chefwise.app
          </p>
        </div>
      </div>
    </MainLayout>
  );
}

// Helper component for feature comparison values
function FeatureValue({ value, highlight, premium }) {
  if (value === true) {
    return (
      <svg
        className={`w-5 h-5 mx-auto ${
          premium ? 'text-amber-500' : highlight ? 'text-primary' : 'text-green-500'
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    );
  }

  if (value === false) {
    return (
      <svg
        className="w-5 h-5 mx-auto text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    );
  }

  return (
    <span
      className={`text-sm ${
        premium
          ? 'text-amber-600 font-medium'
          : highlight
          ? 'text-primary font-medium'
          : 'text-gray-600'
      }`}
    >
      {value}
    </span>
  );
}
