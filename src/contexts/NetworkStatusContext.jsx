/**
 * Network Status Context
 * Provides network status, sync state, and manual sync controls throughout the app
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { syncQueue } from '@/utils/offline/syncQueue';

const NetworkStatusContext = createContext(null);

export function NetworkStatusProvider({ children }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncError, setSyncError] = useState(null);

  // Ref to hold latest sync function to avoid stale closures in event handlers
  const syncRef = useRef(null);

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      syncRef.current?.();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update pending count periodically
  useEffect(() => {
    const updatePendingCount = async () => {
      try {
        const count = await syncQueue.getPendingCount();
        setPendingSyncCount(count);
      } catch (error) {
        console.error('[NetworkStatus] Failed to get pending count:', error);
      }
    };

    // Initial check
    updatePendingCount();

    // Poll every 5 seconds
    const interval = setInterval(updatePendingCount, 5000);

    return () => clearInterval(interval);
  }, []);

  // Listen for service worker sync messages
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event) => {
        if (event.data?.type === 'PROCESS_SYNC_QUEUE') {
          syncRef.current?.();
        }
        if (event.data?.type === 'SYNC_STARTED') {
          setIsSyncing(true);
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  // Manual sync function
  const manualSync = useCallback(async () => {
    if (!isOnline || isSyncing) {
      return { success: 0, failed: 0 };
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const result = await syncQueue.processQueue((synced, total) => {
        // Optional: Update progress
        console.log(`[NetworkStatus] Synced ${synced}/${total}`);
      });

      // Update pending count
      const newCount = await syncQueue.getPendingCount();
      setPendingSyncCount(newCount);

      setLastSyncTime(Date.now());

      if (result.failed > 0) {
        setSyncError(`${result.failed} item(s) failed to sync`);
      }

      return result;
    } catch (error) {
      console.error('[NetworkStatus] Sync failed:', error);
      setSyncError(error.message);
      return { success: 0, failed: 0 };
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  // Keep syncRef updated with latest manualSync
  useEffect(() => {
    syncRef.current = manualSync;
  }, [manualSync]);

  // Clear sync error
  const clearSyncError = useCallback(() => {
    setSyncError(null);
  }, []);

  // Increment pending count (called when adding offline operations)
  const incrementPendingCount = useCallback(() => {
    setPendingSyncCount((prev) => prev + 1);
  }, []);

  // Decrement pending count
  const decrementPendingCount = useCallback(() => {
    setPendingSyncCount((prev) => Math.max(0, prev - 1));
  }, []);

  const value = {
    isOnline,
    pendingSyncCount,
    isSyncing,
    lastSyncTime,
    syncError,
    manualSync,
    clearSyncError,
    incrementPendingCount,
    decrementPendingCount,
  };

  return (
    <NetworkStatusContext.Provider value={value}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

/**
 * Hook to access network status
 * @returns {Object} Network status and sync controls
 */
export function useNetworkStatus() {
  const context = useContext(NetworkStatusContext);
  if (!context) {
    throw new Error(
      'useNetworkStatus must be used within a NetworkStatusProvider'
    );
  }
  return context;
}

export default NetworkStatusContext;
