import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { trackUpgradeClick } from '@/utils/analytics';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function UpgradePage({ user }) {
  const router = useRouter();
  const subscription = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) {
    router.push('/');
    return null;
  }

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        '2 AI recipes per day',
        '1 diet filter',
        '3-day meal plans',
        '20 pantry items',
        '10 saved recipes',
        'Basic nutrition tracking',
      ],
      cta: 'Current Plan',
      current: !subscription.isPremium,
    },
    {
      name: 'Premium',
      price: '$9',
      period: '/month',
      features: [
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
      cta: subscription.isPremium ? 'Current Plan' : 'Upgrade Now',
      highlighted: true,
      current: subscription.isPremium,
    },
  ];

  const handleUpgrade = async (plan) => {
    if (plan.current || loading) return;
    
    // Track upgrade click
    trackUpgradeClick(plan.name, '9');
    
    setLoading(true);
    setError(null);

    try {
      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to start checkout process');
    } finally {
      setLoading(false);
    }
  };

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
              onClick={() => router.push('/')}
              className="text-gray-700 hover:text-primary"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Unlock the full power of AI-driven cooking
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-md mx-auto mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-center">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                plan.highlighted ? 'ring-2 ring-primary transform scale-105' : ''
              }`}
            >
              {plan.highlighted && (
                <div className="bg-primary text-white text-center py-2 text-sm font-semibold">
                  MOST POPULAR
                </div>
              )}
              
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0"
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
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={plan.current || loading}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    plan.current
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : plan.highlighted
                      ? 'bg-primary text-white hover:bg-primary/90 disabled:opacity-50'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {loading && !plan.current ? 'Processing...' : plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            All plans include access to our AI recipe generator and nutrition tracking
          </p>
          <p className="text-sm text-gray-500">
            Cancel anytime. No hidden fees. 30-day money-back guarantee.
          </p>
        </div>
      </main>
    </div>
  );
}
