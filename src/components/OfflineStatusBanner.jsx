/**
 * Offline Status Banner
 * Shows network status and sync progress at the top of the app
 */

import React from 'react';
import { useNetworkStatus } from '@/contexts/NetworkStatusContext';

export default function OfflineStatusBanner() {
  const {
    isOnline,
    pendingSyncCount,
    isSyncing,
    syncError,
    manualSync,
    clearSyncError,
  } = useNetworkStatus();

  // Don't show anything if online with no pending items and no errors
  if (isOnline && pendingSyncCount === 0 && !syncError && !isSyncing) {
    return null;
  }

  // Syncing state - yellow banner
  if (isSyncing) {
    return (
      <div className="bg-yellow-500 text-white px-4 py-2 text-center text-sm" role="status" aria-live="polite">
        <div className="flex items-center justify-center gap-2">
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>Syncing changes...</span>
        </div>
      </div>
    );
  }

  // Error state - red banner with retry
  if (syncError) {
    return (
      <div className="bg-red-500 text-white px-4 py-2 text-sm" role="alert">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Sync error: {syncError}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={manualSync}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
            >
              Retry
            </button>
            <button
              onClick={clearSyncError}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Dismiss"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Offline state - red banner
  if (!isOnline) {
    return (
      <div className="bg-red-600 text-white px-4 py-2 text-sm" role="alert">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a5 5 0 01-7.072-7.072m0 0l2.829 2.829M3 3l2.829 2.829m0 0a5 5 0 017.072 0"
              />
            </svg>
            <span>
              You're offline
              {pendingSyncCount > 0 && (
                <span className="ml-1">
                  ({pendingSyncCount} pending{' '}
                  {pendingSyncCount === 1 ? 'change' : 'changes'})
                </span>
              )}
            </span>
          </div>
          <span className="text-xs opacity-80">Changes will sync when online</span>
        </div>
      </div>
    );
  }

  // Online with pending items - amber banner
  if (pendingSyncCount > 0) {
    return (
      <div className="bg-amber-500 text-white px-4 py-2 text-sm" role="status" aria-live="polite">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              {pendingSyncCount} pending{' '}
              {pendingSyncCount === 1 ? 'change' : 'changes'} to sync
            </span>
          </div>
          <button
            onClick={manualSync}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
          >
            Sync Now
          </button>
        </div>
      </div>
    );
  }

  return null;
}
