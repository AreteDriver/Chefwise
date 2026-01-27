'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PLAN_LIMITS, PLAN_TIERS } from '@/utils/SubscriptionGate';
import { SUBSCRIPTION_PLANS, PLAN_FEATURES } from '@/utils/subscriptionConstants';
import {
  trackSubscriptionView,
  trackPortalAccess,
  trackSubscriptionSuccess,
} from '@/utils/analytics';
import { useAuth } from '@/app/providers';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const subscription = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const success = searchParams.get('success');
  const session_id = searchParams.get('session_id');

  useEffect(() => {
    if (!user) {
      router.push('/');
    } else {
      trackSubscriptionView(subscription.planTier);

      if (success) {
        const plan = subscription.isChef
          ? SUBSCRIPTION_PLANS.CHEF
          : SUBSCRIPTION_PLANS.PRO;
        trackSubscriptionSuccess(
          plan.name,
          plan.price[subscription.billingPeriod || 'monthly'].toString(),
          user.uid
        );
      }
    }
  }, [user, router, success, subscription.planTier, subscription.isChef, subscription.billingPeriod]);

  if (!user) {
    return null;
  }

  const handleManageSubscription = async () => {
    setLoading(true);
    setError(null);

    trackPortalAccess();

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: subscription.stripeCustomerId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create portal session');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to open subscription management portal');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/upgrade');
  };

  const limits = subscription.limits || PLAN_LIMITS[PLAN_TIERS.FREE];

  // Determine the current plan details
  const getCurrentPlanDetails = () => {
    if (subscription.isChef) {
      return {
        plan: SUBSCRIPTION_PLANS.CHEF,
        features: PLAN_FEATURES.CHEF,
        color: 'amber',
        gradient: 'from-amber-500 to-orange-500',
      };
    }
    if (subscription.isPro) {
      return {
        plan: SUBSCRIPTION_PLANS.PRO,
        features: PLAN_FEATURES.PRO,
        color: 'primary',
        gradient: 'from-primary to-secondary',
      };
    }
    return {
      plan: SUBSCRIPTION_PLANS.FREE,
      features: PLAN_FEATURES.FREE,
      color: 'gray',
      gradient: 'from-gray-400 to-gray-500',
    };
  };

  const { plan: currentPlan, features: currentFeatures, color, gradient } = getCurrentPlanDetails();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push('/')}
              className="text-2xl font-bold text-primary"
            >
              ChefWise
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="text-gray-700 hover:text-primary"
            >
              &larr; Back to Profile
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg
                className="w-6 h-6 text-green-600 mr-3"
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
              <div>
                <h3 className="text-green-800 font-semibold">
                  Subscription Updated Successfully!
                </h3>
                <p className="text-green-700 text-sm mt-1">
                  Welcome to ChefWise {subscription.tierName}! You now have access to all{' '}
                  {subscription.tierName} features.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Current Plan */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Your Subscription</h2>

          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold">{subscription.tierName} Plan</h3>
                {subscription.isPaid && (
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      subscription.isChef
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {subscription.billingPeriod === 'yearly' ? 'Annual' : 'Monthly'}
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-1">
                Status:{' '}
                <span className="capitalize font-medium">{subscription.status}</span>
              </p>
              {subscription.subscriptionPeriodEnd && (
                <p className="text-gray-600 text-sm mt-1">
                  {subscription.status === 'active' ? 'Renews' : 'Ends'} on:{' '}
                  {subscription.subscriptionPeriodEnd.toLocaleDateString()}
                </p>
              )}
            </div>
            {subscription.isPaid ? (
              <span
                className={`bg-gradient-to-r ${gradient} text-white px-6 py-3 rounded-lg font-semibold`}
              >
                {subscription.tierName} Active
              </span>
            ) : (
              <button
                onClick={handleUpgrade}
                className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Upgrade Now
              </button>
            )}
          </div>

          {/* Plan Features */}
          <div className="border-t pt-6">
            <h4 className="font-semibold mb-3">Your Plan Includes:</h4>
            <div className="grid md:grid-cols-2 gap-2">
              <div className="flex items-center text-gray-700">
                <CheckIcon color={color} />
                {limits.recipesPerDay === Infinity
                  ? 'Unlimited AI recipe generation'
                  : `${limits.recipesPerDay} AI recipes per day`}
              </div>
              <div className="flex items-center text-gray-700">
                <CheckIcon color={color} />
                {limits.dietFilters === Infinity
                  ? 'All 12 diet filters'
                  : `${limits.dietFilters} diet filter`}
              </div>
              <div className="flex items-center text-gray-700">
                <CheckIcon color={color} />
                Up to {limits.mealPlanDays}-day meal planning
              </div>
              <div className="flex items-center text-gray-700">
                <CheckIcon color={color} />
                {limits.pantryItems === Infinity
                  ? 'Unlimited pantry items'
                  : `Up to ${limits.pantryItems} pantry items`}
              </div>
              <div className="flex items-center text-gray-700">
                <CheckIcon color={color} />
                {limits.savedRecipes === Infinity
                  ? 'Unlimited saved recipes'
                  : `Up to ${limits.savedRecipes} saved recipes`}
              </div>
              {limits.shoppingListExport && (
                <div className="flex items-center text-gray-700">
                  <CheckIcon color={color} />
                  Shopping list export
                </div>
              )}
              {subscription.isChef && (
                <>
                  <div className="flex items-center text-gray-700">
                    <CheckIcon color={color} />
                    Recipe Chat AI assistant
                  </div>
                  <div className="flex items-center text-gray-700">
                    <CheckIcon color={color} />
                    Priority AI (GPT-4)
                  </div>
                  <div className="flex items-center text-gray-700">
                    <CheckIcon color={color} />
                    Custom meal plan branding
                  </div>
                  <div className="flex items-center text-gray-700">
                    <CheckIcon color={color} />
                    Priority support
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Upgrade/Downgrade Options */}
          {subscription.isPro && !subscription.isChef && (
            <div className="border-t mt-6 pt-6">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-amber-900">
                      Upgrade to Chef
                    </h4>
                    <p className="text-amber-700 text-sm mt-1">
                      Get Recipe Chat AI, priority support, and more exclusive features
                    </p>
                  </div>
                  <button
                    onClick={handleUpgrade}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all"
                  >
                    Upgrade to Chef
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manage Subscription */}
          {subscription.isPaid && subscription.stripeCustomerId && (
            <div className="border-t mt-6 pt-6">
              <button
                onClick={handleManageSubscription}
                disabled={loading}
                className="w-full bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Manage Subscription & Billing'}
              </button>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Update payment method, change plan, view invoices, or cancel subscription
              </p>
            </div>
          )}
        </div>

        {/* Upgrade CTA for Free Users */}
        {subscription.isFree && (
          <div className="bg-gradient-to-r from-primary to-secondary rounded-lg shadow-md p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Unlock Premium Features</h3>
            <p className="mb-6 text-white/90">
              Get unlimited access to all ChefWise features starting at just
              $9/month
            </p>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="font-semibold mb-2">Pro Plan - $9/mo</h4>
                <ul className="space-y-2 text-white/90 text-sm">
                  <li className="flex items-center">
                    <CheckIconWhite />
                    Unlimited AI recipes
                  </li>
                  <li className="flex items-center">
                    <CheckIconWhite />
                    14-day meal planning
                  </li>
                  <li className="flex items-center">
                    <CheckIconWhite />
                    All diet filters
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Chef Plan - $19/mo</h4>
                <ul className="space-y-2 text-white/90 text-sm">
                  <li className="flex items-center">
                    <CheckIconWhite />
                    Everything in Pro
                  </li>
                  <li className="flex items-center">
                    <CheckIconWhite />
                    Recipe Chat AI
                  </li>
                  <li className="flex items-center">
                    <CheckIconWhite />
                    Priority support
                  </li>
                </ul>
              </div>
            </div>
            <button
              onClick={handleUpgrade}
              className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              View Plans & Upgrade
            </button>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <FAQItem
              question="Can I change my plan at any time?"
              answer="Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect immediately for upgrades, or at the end of your billing period for downgrades."
            />
            <FAQItem
              question="What happens to my data if I downgrade?"
              answer="Your data is always safe. If you exceed limits after downgrading (e.g., too many saved recipes), you won't lose any data, but you'll need to remove some items before adding new ones."
            />
            <FAQItem
              question="Do you offer refunds?"
              answer="Yes, we offer a 30-day money-back guarantee. If you're not satisfied, contact support for a full refund."
            />
            <FAQItem
              question="How does annual billing work?"
              answer="Annual plans are billed once per year and save you up to 30% compared to monthly billing. You can switch between monthly and annual billing in the billing portal."
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function CheckIcon({ color = 'primary' }) {
  const colorClass = color === 'amber' ? 'text-amber-500' : 'text-primary';
  return (
    <svg
      className={`w-5 h-5 ${colorClass} mr-3 flex-shrink-0`}
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

function CheckIconWhite() {
  return (
    <svg
      className="w-5 h-5 mr-2 flex-shrink-0"
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

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left flex items-center justify-between"
      >
        <span className="font-medium text-gray-900">{question}</span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 pb-3 text-gray-600 text-sm">{answer}</div>
      )}
    </div>
  );
}
