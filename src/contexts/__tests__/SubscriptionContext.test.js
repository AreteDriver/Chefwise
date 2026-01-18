import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SubscriptionProvider, useSubscription } from '../SubscriptionContext';
import { PLAN_TIERS } from '@/utils/SubscriptionGate';

// Mock Firestore
const mocks = {
  onSnapshot: jest.fn(),
  doc: jest.fn(),
};

jest.mock('firebase/firestore', () => ({
  doc: (...args) => mocks.doc(...args),
  getDoc: jest.fn(),
  onSnapshot: (...args) => mocks.onSnapshot(...args),
}));

jest.mock('@/firebase/firebaseConfig', () => ({
  db: {},
}));

// Test component to consume context
function TestConsumer() {
  const subscription = useSubscription();
  return (
    <div>
      <span data-testid="planTier">{subscription.planTier}</span>
      <span data-testid="status">{subscription.status}</span>
      <span data-testid="loading">{subscription.loading ? 'true' : 'false'}</span>
      <span data-testid="isPremium">{subscription.isPremium ? 'true' : 'false'}</span>
      {subscription.stripeCustomerId && (
        <span data-testid="stripeCustomerId">{subscription.stripeCustomerId}</span>
      )}
    </div>
  );
}

describe('SubscriptionContext', () => {
  let unsubscribeMock;

  beforeEach(() => {
    jest.clearAllMocks();
    unsubscribeMock = jest.fn();
    mocks.onSnapshot.mockReturnValue(unsubscribeMock);
    mocks.doc.mockReturnValue('mock-doc-ref');
  });

  describe('useSubscription hook', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useSubscription must be used within SubscriptionProvider');

      consoleSpy.mockRestore();
    });

    it('returns context value when inside provider', () => {
      mocks.onSnapshot.mockImplementation((ref, onNext) => {
        onNext({ exists: () => false });
        return unsubscribeMock;
      });

      render(
        <SubscriptionProvider user={{ uid: 'test123' }}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      expect(screen.getByTestId('planTier')).toBeInTheDocument();
    });
  });

  describe('SubscriptionProvider without user', () => {
    it('sets FREE tier when no user', () => {
      render(
        <SubscriptionProvider user={null}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      expect(screen.getByTestId('planTier')).toHaveTextContent(PLAN_TIERS.FREE);
    });

    it('sets inactive status when no user', () => {
      render(
        <SubscriptionProvider user={null}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      expect(screen.getByTestId('status')).toHaveTextContent('inactive');
    });

    it('sets loading to false when no user', () => {
      render(
        <SubscriptionProvider user={null}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    it('does not subscribe to Firestore when no user', () => {
      render(
        <SubscriptionProvider user={null}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      expect(mocks.onSnapshot).not.toHaveBeenCalled();
    });
  });

  describe('SubscriptionProvider with user', () => {
    const mockUser = { uid: 'user123' };

    it('subscribes to user document in Firestore', () => {
      mocks.onSnapshot.mockImplementation((ref, onNext) => {
        onNext({ exists: () => false });
        return unsubscribeMock;
      });

      render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      expect(mocks.doc).toHaveBeenCalledWith({}, 'users', 'user123');
      expect(mocks.onSnapshot).toHaveBeenCalled();
    });

    it('shows loading initially', () => {
      mocks.onSnapshot.mockReturnValue(unsubscribeMock);

      render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('true');
    });

    it('unsubscribes on unmount', () => {
      mocks.onSnapshot.mockImplementation((ref, onNext) => {
        onNext({ exists: () => false });
        return unsubscribeMock;
      });

      const { unmount } = render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe('Document exists', () => {
    const mockUser = { uid: 'user123' };

    it('sets planTier from document', async () => {
      mocks.onSnapshot.mockImplementation((ref, onNext) => {
        onNext({
          exists: () => true,
          data: () => ({
            planTier: PLAN_TIERS.PREMIUM,
            subscriptionStatus: 'active',
          }),
        });
        return unsubscribeMock;
      });

      render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('planTier')).toHaveTextContent(PLAN_TIERS.PREMIUM);
      });
    });

    it('sets status from document', async () => {
      mocks.onSnapshot.mockImplementation((ref, onNext) => {
        onNext({
          exists: () => true,
          data: () => ({
            planTier: PLAN_TIERS.PREMIUM,
            subscriptionStatus: 'active',
          }),
        });
        return unsubscribeMock;
      });

      render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('active');
      });
    });

    it('sets isPremium to true for premium users', async () => {
      mocks.onSnapshot.mockImplementation((ref, onNext) => {
        onNext({
          exists: () => true,
          data: () => ({
            planTier: PLAN_TIERS.PREMIUM,
            subscriptionStatus: 'active',
          }),
        });
        return unsubscribeMock;
      });

      render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isPremium')).toHaveTextContent('true');
      });
    });

    it('sets isPremium to false for free users', async () => {
      mocks.onSnapshot.mockImplementation((ref, onNext) => {
        onNext({
          exists: () => true,
          data: () => ({
            planTier: PLAN_TIERS.FREE,
            subscriptionStatus: 'inactive',
          }),
        });
        return unsubscribeMock;
      });

      render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isPremium')).toHaveTextContent('false');
      });
    });

    it('sets stripeCustomerId from document', async () => {
      mocks.onSnapshot.mockImplementation((ref, onNext) => {
        onNext({
          exists: () => true,
          data: () => ({
            planTier: PLAN_TIERS.PREMIUM,
            subscriptionStatus: 'active',
            stripeCustomerId: 'cus_test123',
          }),
        });
        return unsubscribeMock;
      });

      render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('stripeCustomerId')).toHaveTextContent('cus_test123');
      });
    });

    it('sets loading to false after data loads', async () => {
      mocks.onSnapshot.mockImplementation((ref, onNext) => {
        onNext({
          exists: () => true,
          data: () => ({
            planTier: PLAN_TIERS.FREE,
          }),
        });
        return unsubscribeMock;
      });

      render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });

    it('defaults to FREE tier if planTier missing', async () => {
      mocks.onSnapshot.mockImplementation((ref, onNext) => {
        onNext({
          exists: () => true,
          data: () => ({}),
        });
        return unsubscribeMock;
      });

      render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('planTier')).toHaveTextContent(PLAN_TIERS.FREE);
      });
    });

    it('defaults to inactive status if subscriptionStatus missing', async () => {
      mocks.onSnapshot.mockImplementation((ref, onNext) => {
        onNext({
          exists: () => true,
          data: () => ({}),
        });
        return unsubscribeMock;
      });

      render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('inactive');
      });
    });
  });

  describe('Document does not exist', () => {
    const mockUser = { uid: 'user123' };

    it('sets FREE tier when document does not exist', async () => {
      mocks.onSnapshot.mockImplementation((ref, onNext) => {
        onNext({ exists: () => false });
        return unsubscribeMock;
      });

      render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('planTier')).toHaveTextContent(PLAN_TIERS.FREE);
      });
    });

    it('sets inactive status when document does not exist', async () => {
      mocks.onSnapshot.mockImplementation((ref, onNext) => {
        onNext({ exists: () => false });
        return unsubscribeMock;
      });

      render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('inactive');
      });
    });

    it('sets isPremium to false when document does not exist', async () => {
      mocks.onSnapshot.mockImplementation((ref, onNext) => {
        onNext({ exists: () => false });
        return unsubscribeMock;
      });

      render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isPremium')).toHaveTextContent('false');
      });
    });

    it('sets loading to false when document does not exist', async () => {
      mocks.onSnapshot.mockImplementation((ref, onNext) => {
        onNext({ exists: () => false });
        return unsubscribeMock;
      });

      render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });
  });

  describe('Error handling', () => {
    const mockUser = { uid: 'user123' };

    it('sets FREE tier on error', async () => {
      mocks.onSnapshot.mockImplementation((ref, onNext, onError) => {
        onError(new Error('Firestore error'));
        return unsubscribeMock;
      });

      render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('planTier')).toHaveTextContent(PLAN_TIERS.FREE);
      });
    });

    it('sets inactive status on error', async () => {
      mocks.onSnapshot.mockImplementation((ref, onNext, onError) => {
        onError(new Error('Firestore error'));
        return unsubscribeMock;
      });

      render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('inactive');
      });
    });

    it('sets loading to false on error', async () => {
      mocks.onSnapshot.mockImplementation((ref, onNext, onError) => {
        onError(new Error('Firestore error'));
        return unsubscribeMock;
      });

      render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });

    it('sets isPremium to false on error', async () => {
      mocks.onSnapshot.mockImplementation((ref, onNext, onError) => {
        onError(new Error('Firestore error'));
        return unsubscribeMock;
      });

      render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isPremium')).toHaveTextContent('false');
      });
    });

    it('logs error to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Firestore error');

      mocks.onSnapshot.mockImplementation((ref, onNext, onError) => {
        onError(error);
        return unsubscribeMock;
      });

      render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error listening to subscription:',
          error
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('User change', () => {
    it('resubscribes when user changes', () => {
      mocks.onSnapshot.mockImplementation((ref, onNext) => {
        onNext({ exists: () => false });
        return unsubscribeMock;
      });

      const { rerender } = render(
        <SubscriptionProvider user={{ uid: 'user1' }}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      expect(mocks.onSnapshot).toHaveBeenCalledTimes(1);

      rerender(
        <SubscriptionProvider user={{ uid: 'user2' }}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      expect(unsubscribeMock).toHaveBeenCalled();
      expect(mocks.onSnapshot).toHaveBeenCalledTimes(2);
    });

    it('unsubscribes and resets when user logs out', async () => {
      mocks.onSnapshot.mockImplementation((ref, onNext) => {
        onNext({
          exists: () => true,
          data: () => ({
            planTier: PLAN_TIERS.PREMIUM,
            subscriptionStatus: 'active',
          }),
        });
        return unsubscribeMock;
      });

      const { rerender } = render(
        <SubscriptionProvider user={{ uid: 'user1' }}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('planTier')).toHaveTextContent(PLAN_TIERS.PREMIUM);
      });

      rerender(
        <SubscriptionProvider user={null}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      expect(unsubscribeMock).toHaveBeenCalled();
      expect(screen.getByTestId('planTier')).toHaveTextContent(PLAN_TIERS.FREE);
    });
  });

  describe('Real-time updates', () => {
    const mockUser = { uid: 'user123' };

    it('updates subscription when Firestore data changes', async () => {
      let snapshotCallback;
      mocks.onSnapshot.mockImplementation((ref, onNext) => {
        snapshotCallback = onNext;
        onNext({
          exists: () => true,
          data: () => ({
            planTier: PLAN_TIERS.FREE,
            subscriptionStatus: 'inactive',
          }),
        });
        return unsubscribeMock;
      });

      render(
        <SubscriptionProvider user={mockUser}>
          <TestConsumer />
        </SubscriptionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('planTier')).toHaveTextContent(PLAN_TIERS.FREE);
      });

      // Simulate real-time update
      snapshotCallback({
        exists: () => true,
        data: () => ({
          planTier: PLAN_TIERS.PREMIUM,
          subscriptionStatus: 'active',
        }),
      });

      await waitFor(() => {
        expect(screen.getByTestId('planTier')).toHaveTextContent(PLAN_TIERS.PREMIUM);
        expect(screen.getByTestId('status')).toHaveTextContent('active');
      });
    });
  });
});
