import { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { PLAN_TIERS } from '@/utils/SubscriptionGate';

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
  });

  useEffect(() => {
    if (!user) {
      setSubscription({
        planTier: PLAN_TIERS.FREE,
        status: 'inactive',
        loading: false,
      });
      return;
    }

    // Subscribe to user document for real-time updates
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSubscription({
            planTier: data.planTier || PLAN_TIERS.FREE,
            status: data.subscriptionStatus || 'inactive',
            stripeCustomerId: data.stripeCustomerId,
            stripeSubscriptionId: data.stripeSubscriptionId,
            subscriptionPeriodEnd: data.subscriptionPeriodEnd?.toDate(),
            loading: false,
            isPremium: data.planTier === PLAN_TIERS.PREMIUM,
          });
        } else {
          setSubscription({
            planTier: PLAN_TIERS.FREE,
            status: 'inactive',
            loading: false,
            isPremium: false,
          });
        }
      },
      (error) => {
        console.error('Error listening to subscription:', error);
        setSubscription({
          planTier: PLAN_TIERS.FREE,
          status: 'inactive',
          loading: false,
          isPremium: false,
        });
      }
    );

    return () => unsubscribe();
  }, [user]);

  return (
    <SubscriptionContext.Provider value={subscription}>
      {children}
    </SubscriptionContext.Provider>
  );
}
