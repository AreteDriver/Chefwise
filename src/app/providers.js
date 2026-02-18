'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';
import { PageStateProvider } from '@/contexts/PageStateContext';
import { NetworkStatusProvider } from '@/contexts/NetworkStatusContext';
import UpdateAvailableToast from '@/components/UpdateAvailableToast';
import InstallPromptBanner from '@/components/InstallPromptBanner';

const UserContext = createContext(null);

export function useAuth() {
  return useContext(UserContext);
}

export default function Providers({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let authUnsubscribe = null;

    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    try {
      authUnsubscribe = onAuthStateChanged(auth, (user) => {
        clearTimeout(timeout);
        setUser(user);
        setLoading(false);
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      clearTimeout(timeout);
      setLoading(false);
    }

    return () => {
      clearTimeout(timeout);
      if (authUnsubscribe) authUnsubscribe();
    };
  }, []);

  // Register service worker for PWA functionality
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user }}>
      <NetworkStatusProvider>
        <PageStateProvider>
          {children}
          <UpdateAvailableToast />
          <InstallPromptBanner />
        </PageStateProvider>
      </NetworkStatusProvider>
    </UserContext.Provider>
  );
}
