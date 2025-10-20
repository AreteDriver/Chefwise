import React from 'react';

/**
 * SubscriptionBanner Component - Promote premium features
 * @param {Object} props
 * @param {boolean} props.isPremium - Whether user has premium
 * @param {Function} props.onUpgrade - Upgrade callback
 */
export default function SubscriptionBanner({ isPremium, onUpgrade }) {
  if (isPremium) return null;

  return (
    <div className="bg-gradient-to-r from-primary to-secondary rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="mb-4 md:mb-0 text-white">
          <h3 className="text-xl font-bold mb-2">Unlock Full ChefWise</h3>
          <p className="text-white/90 text-sm mb-2">
            Get unlimited AI-generated recipes, advanced meal planning, and more!
          </p>
          <ul className="text-sm space-y-1 text-white/80">
            <li>✓ Unlimited recipe generation</li>
            <li>✓ All diet filters</li>
            <li>✓ 30-day meal planning</li>
            <li>✓ Unlimited pantry items</li>
            <li>✓ Export shopping lists</li>
          </ul>
        </div>
        <button
          onClick={onUpgrade}
          className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );
}
