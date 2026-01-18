import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TabLayout from '../TabLayout';

// Mock next/router
const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Firebase auth
const mockSignOut = jest.fn();
jest.mock('firebase/auth', () => ({
  signOut: (...args) => mockSignOut(...args),
}));

jest.mock('@/firebase/firebaseConfig', () => ({
  auth: { currentUser: null },
}));

// Mock BottomTabBar
jest.mock('../BottomTabBar', () => {
  return function MockBottomTabBar({ activeTab }) {
    return <div data-testid="bottom-tab-bar">BottomTabBar (active: {activeTab})</div>;
  };
});

describe('TabLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('renders children', () => {
      render(
        <TabLayout user={null} activeTab="home">
          <div>Test Content</div>
        </TabLayout>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders ChefWise logo with emoji', () => {
      render(
        <TabLayout user={null} activeTab="home">
          <div>Content</div>
        </TabLayout>
      );

      expect(screen.getByText('ChefWise')).toBeInTheDocument();
    });

    it('navigates to home when logo is clicked', () => {
      render(
        <TabLayout user={null} activeTab="home">
          <div>Content</div>
        </TabLayout>
      );

      fireEvent.click(screen.getByText('ChefWise'));
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('Unauthenticated user', () => {
    it('shows "Not signed in" message', () => {
      render(
        <TabLayout user={null} activeTab="home">
          <div>Content</div>
        </TabLayout>
      );

      expect(screen.getByText('Not signed in')).toBeInTheDocument();
    });

    it('does not render navigation buttons', () => {
      render(
        <TabLayout user={null} activeTab="home">
          <div>Content</div>
        </TabLayout>
      );

      expect(screen.queryByRole('button', { name: 'Pantry' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Planner' })).not.toBeInTheDocument();
    });

    it('does not render BottomTabBar', () => {
      render(
        <TabLayout user={null} activeTab="home">
          <div>Content</div>
        </TabLayout>
      );

      expect(screen.queryByTestId('bottom-tab-bar')).not.toBeInTheDocument();
    });

    it('does not render Sign Out button', () => {
      render(
        <TabLayout user={null} activeTab="home">
          <div>Content</div>
        </TabLayout>
      );

      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated user', () => {
    const mockUser = { uid: 'user123', email: 'test@example.com' };

    it('renders all navigation buttons', () => {
      render(
        <TabLayout user={mockUser} activeTab="home">
          <div>Content</div>
        </TabLayout>
      );

      expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Pantry' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Planner' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Tracker' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument();
    });

    it('renders Sign Out button', () => {
      render(
        <TabLayout user={mockUser} activeTab="home">
          <div>Content</div>
        </TabLayout>
      );

      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('renders BottomTabBar', () => {
      render(
        <TabLayout user={mockUser} activeTab="home">
          <div>Content</div>
        </TabLayout>
      );

      expect(screen.getByTestId('bottom-tab-bar')).toBeInTheDocument();
    });

    it('passes activeTab to BottomTabBar', () => {
      render(
        <TabLayout user={mockUser} activeTab="pantry">
          <div>Content</div>
        </TabLayout>
      );

      expect(screen.getByText(/active: pantry/)).toBeInTheDocument();
    });

    it('does not show "Not signed in" message', () => {
      render(
        <TabLayout user={mockUser} activeTab="home">
          <div>Content</div>
        </TabLayout>
      );

      expect(screen.queryByText('Not signed in')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    const mockUser = { uid: 'user123' };

    it('navigates to home when Home is clicked', () => {
      render(
        <TabLayout user={mockUser} activeTab="pantry">
          <div>Content</div>
        </TabLayout>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Home' }));
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('navigates to pantry when Pantry is clicked', () => {
      render(
        <TabLayout user={mockUser} activeTab="home">
          <div>Content</div>
        </TabLayout>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Pantry' }));
      expect(mockPush).toHaveBeenCalledWith('/pantry');
    });

    it('navigates to planner when Planner is clicked', () => {
      render(
        <TabLayout user={mockUser} activeTab="home">
          <div>Content</div>
        </TabLayout>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Planner' }));
      expect(mockPush).toHaveBeenCalledWith('/planner');
    });

    it('navigates to tracker when Tracker is clicked', () => {
      render(
        <TabLayout user={mockUser} activeTab="home">
          <div>Content</div>
        </TabLayout>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Tracker' }));
      expect(mockPush).toHaveBeenCalledWith('/tracker');
    });

    it('navigates to profile when Profile is clicked', () => {
      render(
        <TabLayout user={mockUser} activeTab="home">
          <div>Content</div>
        </TabLayout>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Profile' }));
      expect(mockPush).toHaveBeenCalledWith('/profile');
    });
  });

  describe('Active tab highlighting', () => {
    const mockUser = { uid: 'user123' };

    it('highlights active tab', () => {
      render(
        <TabLayout user={mockUser} activeTab="pantry">
          <div>Content</div>
        </TabLayout>
      );

      const pantryButton = screen.getByRole('button', { name: 'Pantry' });
      expect(pantryButton).toHaveClass('text-primary');
      expect(pantryButton).toHaveClass('bg-primary/10');
    });

    it('does not highlight inactive tabs', () => {
      render(
        <TabLayout user={mockUser} activeTab="pantry">
          <div>Content</div>
        </TabLayout>
      );

      const homeButton = screen.getByRole('button', { name: 'Home' });
      expect(homeButton).not.toHaveClass('bg-primary/10');
    });
  });

  describe('Sign out', () => {
    const mockUser = { uid: 'user123' };

    it('calls signOut and redirects when Sign Out is clicked', async () => {
      mockSignOut.mockResolvedValue();
      render(
        <TabLayout user={mockUser} activeTab="home">
          <div>Content</div>
        </TabLayout>
      );

      fireEvent.click(screen.getByText('Sign Out'));

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Mobile profile button', () => {
    const mockUser = { uid: 'user123' };

    it('renders mobile profile button for authenticated user', () => {
      render(
        <TabLayout user={mockUser} activeTab="home">
          <div>Content</div>
        </TabLayout>
      );

      // Mobile profile button has an SVG icon (user icon)
      const mobileButtons = screen.getAllByRole('button');
      const profileButtons = mobileButtons.filter((btn) => {
        const svg = btn.querySelector('svg');
        return svg && btn.closest('.md\\:hidden');
      });

      expect(profileButtons.length).toBeGreaterThan(0);
    });
  });
});
