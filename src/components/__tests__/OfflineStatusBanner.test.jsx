import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import OfflineStatusBanner from '../OfflineStatusBanner';

// Mock network status context
const mockManualSync = jest.fn();
const mockClearSyncError = jest.fn();

const mockNetworkStatus = {
  isOnline: true,
  pendingSyncCount: 0,
  isSyncing: false,
  syncError: null,
  manualSync: mockManualSync,
  clearSyncError: mockClearSyncError,
};

jest.mock('@/contexts/NetworkStatusContext', () => ({
  useNetworkStatus: () => mockNetworkStatus,
}));

describe('OfflineStatusBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default state
    mockNetworkStatus.isOnline = true;
    mockNetworkStatus.pendingSyncCount = 0;
    mockNetworkStatus.isSyncing = false;
    mockNetworkStatus.syncError = null;
  });

  describe('Online with no pending items', () => {
    it('renders nothing when online with no pending items', () => {
      const { container } = render(<OfflineStatusBanner />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Syncing state', () => {
    it('shows syncing banner with spinner', () => {
      mockNetworkStatus.isSyncing = true;

      render(<OfflineStatusBanner />);

      expect(screen.getByText('Syncing changes...')).toBeInTheDocument();
    });

    it('has yellow background when syncing', () => {
      mockNetworkStatus.isSyncing = true;

      const { container } = render(<OfflineStatusBanner />);

      expect(container.firstChild).toHaveClass('bg-yellow-500');
    });
  });

  describe('Error state', () => {
    it('shows error message', () => {
      mockNetworkStatus.syncError = 'Network timeout';

      render(<OfflineStatusBanner />);

      expect(screen.getByText('Sync error: Network timeout')).toBeInTheDocument();
    });

    it('shows retry button', () => {
      mockNetworkStatus.syncError = 'Failed';

      render(<OfflineStatusBanner />);

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('calls manualSync when retry is clicked', () => {
      mockNetworkStatus.syncError = 'Failed';

      render(<OfflineStatusBanner />);
      fireEvent.click(screen.getByText('Retry'));

      expect(mockManualSync).toHaveBeenCalled();
    });

    it('shows dismiss button', () => {
      mockNetworkStatus.syncError = 'Failed';

      render(<OfflineStatusBanner />);

      expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    });

    it('calls clearSyncError when dismiss is clicked', () => {
      mockNetworkStatus.syncError = 'Failed';

      render(<OfflineStatusBanner />);
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

      expect(mockClearSyncError).toHaveBeenCalled();
    });

    it('has red background when error', () => {
      mockNetworkStatus.syncError = 'Failed';

      const { container } = render(<OfflineStatusBanner />);

      expect(container.firstChild).toHaveClass('bg-red-500');
    });
  });

  describe('Offline state', () => {
    it('shows offline message', () => {
      mockNetworkStatus.isOnline = false;

      render(<OfflineStatusBanner />);

      expect(screen.getByText(/You're offline/)).toBeInTheDocument();
    });

    it('shows pending count when offline with pending items', () => {
      mockNetworkStatus.isOnline = false;
      mockNetworkStatus.pendingSyncCount = 3;

      render(<OfflineStatusBanner />);

      expect(screen.getByText(/3 pending changes/)).toBeInTheDocument();
    });

    it('uses singular form for one pending change', () => {
      mockNetworkStatus.isOnline = false;
      mockNetworkStatus.pendingSyncCount = 1;

      render(<OfflineStatusBanner />);

      expect(screen.getByText(/1 pending change\)/)).toBeInTheDocument();
    });

    it('shows sync message', () => {
      mockNetworkStatus.isOnline = false;

      render(<OfflineStatusBanner />);

      expect(screen.getByText('Changes will sync when online')).toBeInTheDocument();
    });

    it('has red background when offline', () => {
      mockNetworkStatus.isOnline = false;

      const { container } = render(<OfflineStatusBanner />);

      expect(container.firstChild).toHaveClass('bg-red-600');
    });
  });

  describe('Online with pending items', () => {
    it('shows pending count', () => {
      mockNetworkStatus.pendingSyncCount = 5;

      render(<OfflineStatusBanner />);

      expect(screen.getByText(/5 pending changes to sync/)).toBeInTheDocument();
    });

    it('uses singular form for one pending change', () => {
      mockNetworkStatus.pendingSyncCount = 1;

      render(<OfflineStatusBanner />);

      expect(screen.getByText(/1 pending change to sync/)).toBeInTheDocument();
    });

    it('shows sync now button', () => {
      mockNetworkStatus.pendingSyncCount = 2;

      render(<OfflineStatusBanner />);

      expect(screen.getByText('Sync Now')).toBeInTheDocument();
    });

    it('calls manualSync when sync now is clicked', () => {
      mockNetworkStatus.pendingSyncCount = 2;

      render(<OfflineStatusBanner />);
      fireEvent.click(screen.getByText('Sync Now'));

      expect(mockManualSync).toHaveBeenCalled();
    });

    it('has amber background when pending', () => {
      mockNetworkStatus.pendingSyncCount = 2;

      const { container } = render(<OfflineStatusBanner />);

      expect(container.firstChild).toHaveClass('bg-amber-500');
    });
  });

  describe('Priority order', () => {
    it('shows syncing state over error state', () => {
      mockNetworkStatus.isSyncing = true;
      mockNetworkStatus.syncError = 'Error';

      render(<OfflineStatusBanner />);

      expect(screen.getByText('Syncing changes...')).toBeInTheDocument();
      expect(screen.queryByText(/Sync error/)).not.toBeInTheDocument();
    });

    it('shows error state over offline state', () => {
      mockNetworkStatus.isOnline = false;
      mockNetworkStatus.syncError = 'Error';

      render(<OfflineStatusBanner />);

      expect(screen.getByText(/Sync error/)).toBeInTheDocument();
      expect(screen.queryByText(/You're offline/)).not.toBeInTheDocument();
    });
  });
});
