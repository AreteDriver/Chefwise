import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { PLAN_LIMITS, PLAN_TIERS } from '@/utils/SubscriptionGate';
import { SUBSCRIPTION_PLANS } from '@/utils/subscriptionConstants';
import { trackSubscriptionView, trackPortalAccess, trackSubscriptionSuccess } from '@/utils/analytics';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function SubscriptionPage({ user }) {
  const router = useRouter();
  const subscription = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { success, session_id } = router.query;

  useEffect(() => {
    if (!user) {
      router.push('/');
    } else {
      // Track page view
      trackSubscriptionView(subscription.planTier);
      
      // Track successful subscription
      if (success) {
        trackSubscriptionSuccess(
          SUBSCRIPTION_PLANS.PREMIUM.name,
          SUBSCRIPTION_PLANS.PREMIUM.price.toString(),
          user.uid
        );
      }
    }
  }, [user, router, success, subscription.planTier]);

  if (!user) {
    return null;
  }

  const handleManageSubscription = async () => {
    setLoading(true);
    setError(null);
    
    // Track portal access
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

  const isPremium = subscription.isPremium;
  const currentPlan = isPremium ? PLAN_TIERS.PREMIUM : PLAN_TIERS.FREE;
  const limits = PLAN_LIMITS[currentPlan];

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
              ← Back to Profile
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
                  Welcome to ChefWise Premium! You now have access to all premium features.
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
              <h3 className="text-xl font-semibold capitalize">
                {currentPlan} Plan
              </h3>
              <p className="text-gray-600 mt-1">
                Status: <span className="capitalize font-medium">{subscription.status}</span>
              </p>
              {subscription.subscriptionPeriodEnd && (
                <p className="text-gray-600 text-sm mt-1">
                  Renews on: {subscription.subscriptionPeriodEnd.toLocaleDateString()}
                </p>
              )}
            </div>
            {isPremium ? (
              <span className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg font-semibold">
                Premium Active
              </span>
            ) : (
              <button
                onClick={handleUpgrade}
                className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Upgrade to Premium
              </button>
            )}
          </div>

          {/* Plan Features */}
          <div className="border-t pt-6">
            <h4 className="font-semibold mb-3">Your Plan Includes:</h4>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-700">
                <svg
                  className="w-5 h-5 text-primary mr-3"
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
                {limits.recipesPerDay === Infinity
                  ? 'Unlimited AI recipe generation'
                  : `${limits.recipesPerDay} AI recipes per day`}
              </li>
              <li className="flex items-center text-gray-700">
                <svg
                  className="w-5 h-5 text-primary mr-3"
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
                {limits.dietFilters === Infinity
                  ? 'All diet filters'
                  : `${limits.dietFilters} diet filter`}
              </li>
              <li className="flex items-center text-gray-700">
                <svg
                  className="w-5 h-5 text-primary mr-3"
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
                Up to {limits.mealPlanDays}-day meal planning
              </li>
              <li className="flex items-center text-gray-700">
                <svg
                  className="w-5 h-5 text-primary mr-3"
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
                {limits.pantryItems === Infinity
                  ? 'Unlimited pantry items'
                  : `Up to ${limits.pantryItems} pantry items`}
              </li>
              <li className="flex items-center text-gray-700">
                <svg
                  className="w-5 h-5 text-primary mr-3"
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
                {limits.savedRecipes === Infinity
                  ? 'Unlimited saved recipes'
                  : `Up to ${limits.savedRecipes} saved recipes`}
              </li>
              {isPremium && (
                <>
                  <li className="flex items-center text-gray-700">
                    <svg
                      className="w-5 h-5 text-primary mr-3"
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
                    Shopping list export
                  </li>
                  <li className="flex items-center text-gray-700">
                    <svg
                      className="w-5 h-5 text-primary mr-3"
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
                    Priority support
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Manage Subscription */}
          {isPremium && subscription.stripeCustomerId && (
            <div className="border-t mt-6 pt-6">
              <button
                onClick={handleManageSubscription}
                disabled={loading}
                className="w-full bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Manage Subscription & Billing'}
              </button>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Update payment method, view invoices, or cancel subscription
              </p>
            </div>
          )}
        </div>

        {/* Benefits Section */}
        {!isPremium && (
          <div className="bg-gradient-to-r from-primary to-secondary rounded-lg shadow-md p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Unlock Premium Features
            </h3>
            <p className="mb-6 text-white/90">
              Get unlimited access to all ChefWise features for just $9/month
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center">
                <svg
                  className="w-6 h-6 mr-3"
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
                Unlimited AI-generated recipes
              </li>
              <li className="flex items-center">
                <svg
                  className="w-6 h-6 mr-3"
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
                Advanced 30-day meal planning
              </li>
              <li className="flex items-center">
                <svg
                  className="w-6 h-6 mr-3"
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
                All diet filters and preferences
              </li>
              <li className="flex items-center">
                <svg
                  className="w-6 h-6 mr-3"
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
                Priority customer support
              </li>
            </ul>
            <button
              onClick={handleUpgrade}
              className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
