import { useRouter } from 'next/router';
import { useSubscription } from '@/contexts/SubscriptionContext';

/**
 * PremiumFeature Component - Gates content behind premium subscription
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to show for premium users
 * @param {React.ReactNode} props.fallback - Content to show for free users (optional)
 * @param {string} props.message - Custom message for free users
 */
export default function PremiumFeature({ children, fallback, message }) {
  const router = useRouter();
  const subscription = useSubscription();

  if (subscription.loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (subscription.isPremium) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-6 text-white text-center">
      <svg
        className="w-12 h-12 mx-auto mb-3 opacity-80"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      <h3 className="text-xl font-bold mb-2">Premium Feature</h3>
      <p className="text-white/90 mb-4">
        {message || 'This feature is available for Premium users only'}
      </p>
      <button
        onClick={() => router.push('/upgrade')}
        className="bg-white text-primary px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
      >
        Upgrade to Premium
      </button>
    </div>
  );
}

/**
 * PremiumBadge Component - Shows a premium badge
 */
export function PremiumBadge({ className = '' }) {
  return (
    <span className={`bg-gradient-to-r from-primary to-secondary text-white text-xs font-semibold px-2 py-1 rounded ${className}`}>
      PREMIUM
    </span>
  );
}

/**
 * FeatureLock Component - Shows a lock icon for premium features
 */
export function FeatureLock({ className = '' }) {
  return (
    <svg
      className={`w-4 h-4 text-primary ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}
