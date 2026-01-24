import { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import {
  PLAN_TIERS,
  PLAN_LIMITS,
  normalizePlanTier,
  isPaidTier,
  getTierDisplayName,
} from '@/utils/SubscriptionGate';

const SubscriptionContext = createContext();

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}

export function SubscriptionProvider({ children, user }) {
  const [subscription, setSubscription] = useState({
    planTier: PLAN_TIERS.FREE,
    status: 'inactive',
    loading: true,
    // Convenience flags
    isPaid: false,
    isPro: false,
    isChef: false,
    isFree: true,
    // Legacy compatibility
    isPremium: false,
  });

  useEffect(() => {
    if (!user) {
      setSubscription({
        planTier: PLAN_TIERS.FREE,
        status: 'inactive',
        loading: false,
        isPaid: false,
        isPro: false,
        isChef: false,
        isFree: true,
        isPremium: false,
        limits: PLAN_LIMITS[PLAN_TIERS.FREE],
        tierName: 'Free',
      });
      return;
    }

    // Subscribe to user document for real-time updates
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const normalizedTier = normalizePlanTier(data.planTier);
          const limits = PLAN_LIMITS[normalizedTier];

          setSubscription({
            planTier: normalizedTier,
            status: data.subscriptionStatus || 'inactive',
            stripeCustomerId: data.stripeCustomerId,
            stripeSubscriptionId: data.stripeSubscriptionId,
            subscriptionPeriodEnd: data.subscriptionPeriodEnd?.toDate(),
            billingPeriod: data.billingPeriod || 'monthly',
            loading: false,
            // Convenience flags
            isPaid: isPaidTier(normalizedTier),
            isPro: normalizedTier === PLAN_TIERS.PRO,
            isChef: normalizedTier === PLAN_TIERS.CHEF,
            isFree: normalizedTier === PLAN_TIERS.FREE,
            // Legacy compatibility
            isPremium: isPaidTier(normalizedTier),
            // Plan limits for easy access
            limits,
            tierName: getTierDisplayName(normalizedTier),
          });
        } else {
          setSubscription({
            planTier: PLAN_TIERS.FREE,
            status: 'inactive',
            loading: false,
            isPaid: false,
            isPro: false,
            isChef: false,
            isFree: true,
            isPremium: false,
            limits: PLAN_LIMITS[PLAN_TIERS.FREE],
            tierName: 'Free',
          });
        }
      },
      (error) => {
        console.error('Error listening to subscription:', error);
        setSubscription({
          planTier: PLAN_TIERS.FREE,
          status: 'inactive',
          loading: false,
          isPaid: false,
          isPro: false,
          isChef: false,
          isFree: true,
          isPremium: false,
          limits: PLAN_LIMITS[PLAN_TIERS.FREE],
          tierName: 'Free',
        });
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Helper methods
  const canUseFeature = (feature) => {
    const limits = subscription.limits || PLAN_LIMITS[PLAN_TIERS.FREE];
    return limits[feature] === true || limits[feature] === Infinity;
  };

  const getFeatureLimit = (feature) => {
    const limits = subscription.limits || PLAN_LIMITS[PLAN_TIERS.FREE];
    return limits[feature];
  };

  const value = {
    ...subscription,
    canUseFeature,
    getFeatureLimit,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}
