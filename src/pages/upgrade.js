import { useRouter } from 'next/router';

export default function UpgradePage({ user }) {
  const router = useRouter();

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
      current: true,
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
      cta: 'Upgrade Now',
      highlighted: true,
    },
  ];

  const handleUpgrade = (plan) => {
    if (plan.current) return;
    
    // TODO: Integrate Stripe payment
    alert(`Upgrade to ${plan.name} - Payment integration coming soon!`);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Unlock the full power of AI-driven cooking
          </p>
        </div>

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
                  disabled={plan.current}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    plan.current
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : plan.highlighted
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
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
  );
}
