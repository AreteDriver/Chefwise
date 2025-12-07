import { logEvent } from 'firebase/analytics';
import { analytics } from '@/firebase/firebaseConfig';

/**
 * Log subscription-related analytics events
 */

export const trackSubscriptionView = (planType) => {
  if (analytics) {
    logEvent(analytics, 'view_subscription_page', {
      plan_type: planType,
      timestamp: new Date().toISOString(),
    });
  }
};

export const trackUpgradeClick = (planName, planPrice) => {
  if (analytics) {
    logEvent(analytics, 'begin_checkout', {
      currency: 'USD',
      value: parseFloat(planPrice),
      items: [
        {
          item_name: planName,
          item_category: 'subscription',
        },
      ],
    });
  }
};

export const trackSubscriptionSuccess = (planName, planPrice) => {
  if (analytics) {
    logEvent(analytics, 'purchase', {
      currency: 'USD',
      value: parseFloat(planPrice),
      transaction_id: `sub_${Date.now()}`,
      items: [
        {
          item_name: planName,
          item_category: 'subscription',
          price: parseFloat(planPrice),
        },
      ],
    });
  }
};

export const trackSubscriptionCancellation = (planName) => {
  if (analytics) {
    logEvent(analytics, 'cancel_subscription', {
      plan_name: planName,
      timestamp: new Date().toISOString(),
    });
  }
};

export const trackPremiumFeatureAttempt = (featureName) => {
  if (analytics) {
    logEvent(analytics, 'premium_feature_attempt', {
      feature_name: featureName,
      timestamp: new Date().toISOString(),
    });
  }
};

export const trackFeatureUsage = (featureName, planTier) => {
  if (analytics) {
    logEvent(analytics, 'feature_usage', {
      feature_name: featureName,
      plan_tier: planTier,
      timestamp: new Date().toISOString(),
    });
  }
};

export const trackPortalAccess = () => {
  if (analytics) {
    logEvent(analytics, 'access_subscription_portal', {
      timestamp: new Date().toISOString(),
    });
  }
};
