import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubscriptionBanner from '../SubscriptionBanner';

describe('SubscriptionBanner', () => {
  describe('Premium user', () => {
    it('renders nothing for premium users', () => {
      const { container } = render(
        <SubscriptionBanner isPremium={true} onUpgrade={jest.fn()} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Free user', () => {
    it('renders banner for free users', () => {
      render(<SubscriptionBanner isPremium={false} onUpgrade={jest.fn()} />);

      expect(screen.getByText('Unlock Full ChefWise')).toBeInTheDocument();
    });

    it('shows upgrade description', () => {
      render(<SubscriptionBanner isPremium={false} onUpgrade={jest.fn()} />);

      expect(
        screen.getByText(/Get unlimited AI-generated recipes/)
      ).toBeInTheDocument();
    });

    it('lists premium features', () => {
      render(<SubscriptionBanner isPremium={false} onUpgrade={jest.fn()} />);

      expect(screen.getByText('✓ Unlimited recipe generation')).toBeInTheDocument();
      expect(screen.getByText('✓ All diet filters')).toBeInTheDocument();
      expect(screen.getByText('✓ 30-day meal planning')).toBeInTheDocument();
      expect(screen.getByText('✓ Unlimited pantry items')).toBeInTheDocument();
      expect(screen.getByText('✓ Export shopping lists')).toBeInTheDocument();
    });

    it('renders upgrade button', () => {
      render(<SubscriptionBanner isPremium={false} onUpgrade={jest.fn()} />);

      expect(screen.getByText('Upgrade Now')).toBeInTheDocument();
    });

    it('calls onUpgrade when button is clicked', () => {
      const handleUpgrade = jest.fn();
      render(<SubscriptionBanner isPremium={false} onUpgrade={handleUpgrade} />);

      fireEvent.click(screen.getByText('Upgrade Now'));

      expect(handleUpgrade).toHaveBeenCalledTimes(1);
    });

    it('has gradient background', () => {
      const { container } = render(
        <SubscriptionBanner isPremium={false} onUpgrade={jest.fn()} />
      );

      expect(container.firstChild).toHaveClass('bg-gradient-to-r');
    });
  });

  describe('Default prop behavior', () => {
    it('renders banner when isPremium is undefined', () => {
      render(<SubscriptionBanner onUpgrade={jest.fn()} />);

      expect(screen.getByText('Unlock Full ChefWise')).toBeInTheDocument();
    });

    it('renders banner when isPremium is false', () => {
      render(<SubscriptionBanner isPremium={false} onUpgrade={jest.fn()} />);

      expect(screen.getByText('Unlock Full ChefWise')).toBeInTheDocument();
    });
  });
});
