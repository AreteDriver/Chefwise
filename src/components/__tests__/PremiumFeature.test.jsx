import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PremiumFeature, { PremiumBadge, FeatureLock } from '../PremiumFeature';

// Mock next/router
const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock subscription context
const mockSubscription = {
  loading: false,
  isPremium: false,
};

jest.mock('@/contexts/SubscriptionContext', () => ({
  useSubscription: () => mockSubscription,
}));

describe('PremiumFeature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscription.loading = false;
    mockSubscription.isPremium = false;
  });

  describe('Loading state', () => {
    it('shows loading spinner when subscription is loading', () => {
      mockSubscription.loading = true;

      const { container } = render(
        <PremiumFeature>
          <div>Premium Content</div>
        </PremiumFeature>
      );

      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
      expect(screen.queryByText('Premium Content')).not.toBeInTheDocument();
    });
  });

  describe('Premium user', () => {
    it('renders children for premium users', () => {
      mockSubscription.isPremium = true;

      render(
        <PremiumFeature>
          <div>Premium Content</div>
        </PremiumFeature>
      );

      expect(screen.getByText('Premium Content')).toBeInTheDocument();
    });

    it('does not show upgrade prompt for premium users', () => {
      mockSubscription.isPremium = true;

      render(
        <PremiumFeature>
          <div>Premium Content</div>
        </PremiumFeature>
      );

      expect(screen.queryByText('Upgrade to Premium')).not.toBeInTheDocument();
    });
  });

  describe('Free user with fallback', () => {
    it('renders fallback for free users when provided', () => {
      render(
        <PremiumFeature fallback={<div>Free Content</div>}>
          <div>Premium Content</div>
        </PremiumFeature>
      );

      expect(screen.getByText('Free Content')).toBeInTheDocument();
      expect(screen.queryByText('Premium Content')).not.toBeInTheDocument();
    });
  });

  describe('Free user without fallback', () => {
    it('shows premium feature prompt', () => {
      render(
        <PremiumFeature>
          <div>Premium Content</div>
        </PremiumFeature>
      );

      expect(screen.getByText('Premium Feature')).toBeInTheDocument();
    });

    it('shows default message', () => {
      render(
        <PremiumFeature>
          <div>Premium Content</div>
        </PremiumFeature>
      );

      expect(
        screen.getByText('This feature is available for Premium users only')
      ).toBeInTheDocument();
    });

    it('shows custom message when provided', () => {
      render(
        <PremiumFeature message="Custom upgrade message">
          <div>Premium Content</div>
        </PremiumFeature>
      );

      expect(screen.getByText('Custom upgrade message')).toBeInTheDocument();
    });

    it('shows upgrade button', () => {
      render(
        <PremiumFeature>
          <div>Premium Content</div>
        </PremiumFeature>
      );

      expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument();
    });

    it('navigates to upgrade page when button is clicked', () => {
      render(
        <PremiumFeature>
          <div>Premium Content</div>
        </PremiumFeature>
      );

      fireEvent.click(screen.getByText('Upgrade to Premium'));

      expect(mockPush).toHaveBeenCalledWith('/upgrade');
    });

    it('has gradient background', () => {
      const { container } = render(
        <PremiumFeature>
          <div>Premium Content</div>
        </PremiumFeature>
      );

      expect(container.firstChild).toHaveClass('bg-gradient-to-r');
    });
  });
});

describe('PremiumBadge', () => {
  it('renders PREMIUM text', () => {
    render(<PremiumBadge />);
    expect(screen.getByText('PREMIUM')).toBeInTheDocument();
  });

  it('has gradient background', () => {
    render(<PremiumBadge />);
    expect(screen.getByText('PREMIUM')).toHaveClass('bg-gradient-to-r');
  });

  it('accepts custom className', () => {
    render(<PremiumBadge className="custom-class" />);
    expect(screen.getByText('PREMIUM')).toHaveClass('custom-class');
  });
});

describe('FeatureLock', () => {
  it('renders lock icon', () => {
    const { container } = render(<FeatureLock />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('has primary color', () => {
    const { container } = render(<FeatureLock />);
    expect(container.querySelector('svg')).toHaveClass('text-primary');
  });

  it('accepts custom className', () => {
    const { container } = render(<FeatureLock className="custom-class" />);
    expect(container.querySelector('svg')).toHaveClass('custom-class');
  });
});
