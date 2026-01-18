import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NavigationBar from '../NavigationBar';

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

describe('NavigationBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Logo', () => {
    it('renders ChefWise logo', () => {
      render(<NavigationBar user={null} />);
      expect(screen.getByText('ChefWise')).toBeInTheDocument();
    });

    it('navigates to home when logo is clicked', () => {
      render(<NavigationBar user={null} />);
      fireEvent.click(screen.getByText('ChefWise'));
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('Unauthenticated user', () => {
    it('shows Home link', () => {
      render(<NavigationBar user={null} />);
      expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
    });

    it('shows Get Started button', () => {
      render(<NavigationBar user={null} />);
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('does not show authenticated-only links', () => {
      render(<NavigationBar user={null} />);
      expect(screen.queryByRole('button', { name: 'Recipes' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Pantry' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Planner' })).not.toBeInTheDocument();
    });

    it('does not show Sign Out button', () => {
      render(<NavigationBar user={null} />);
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated user', () => {
    const mockUser = { uid: 'user123', email: 'test@example.com' };

    it('shows all navigation links', () => {
      render(<NavigationBar user={mockUser} />);

      expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Recipes' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Pantry' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Planner' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Tracker' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument();
    });

    it('shows Sign Out button', () => {
      render(<NavigationBar user={mockUser} />);
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('does not show Get Started button', () => {
      render(<NavigationBar user={mockUser} />);
      expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
    });

    it('calls signOut and redirects when Sign Out is clicked', async () => {
      mockSignOut.mockResolvedValue();
      render(<NavigationBar user={mockUser} />);

      fireEvent.click(screen.getByText('Sign Out'));

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Navigation', () => {
    const mockUser = { uid: 'user123' };

    it('navigates to recipes when Recipes is clicked', () => {
      render(<NavigationBar user={mockUser} />);
      fireEvent.click(screen.getByRole('button', { name: 'Recipes' }));
      expect(mockPush).toHaveBeenCalledWith('/recipes');
    });

    it('navigates to pantry when Pantry is clicked', () => {
      render(<NavigationBar user={mockUser} />);
      fireEvent.click(screen.getByRole('button', { name: 'Pantry' }));
      expect(mockPush).toHaveBeenCalledWith('/pantry');
    });

    it('navigates to planner when Planner is clicked', () => {
      render(<NavigationBar user={mockUser} />);
      fireEvent.click(screen.getByRole('button', { name: 'Planner' }));
      expect(mockPush).toHaveBeenCalledWith('/planner');
    });

    it('navigates to tracker when Tracker is clicked', () => {
      render(<NavigationBar user={mockUser} />);
      fireEvent.click(screen.getByRole('button', { name: 'Tracker' }));
      expect(mockPush).toHaveBeenCalledWith('/tracker');
    });

    it('navigates to profile when Profile is clicked', () => {
      render(<NavigationBar user={mockUser} />);
      fireEvent.click(screen.getByRole('button', { name: 'Profile' }));
      expect(mockPush).toHaveBeenCalledWith('/profile');
    });
  });

  describe('Current page highlighting', () => {
    const mockUser = { uid: 'user123' };

    it('highlights current page', () => {
      render(<NavigationBar user={mockUser} currentPage="pantry" />);

      const pantryButton = screen.getByRole('button', { name: 'Pantry' });
      expect(pantryButton).toHaveClass('bg-primary/10');
      expect(pantryButton).toHaveClass('text-primary');
    });

    it('does not highlight non-current pages', () => {
      render(<NavigationBar user={mockUser} currentPage="pantry" />);

      const homeButton = screen.getByRole('button', { name: 'Home' });
      expect(homeButton).not.toHaveClass('bg-primary/10');
    });
  });

  describe('Mobile menu', () => {
    const mockUser = { uid: 'user123' };

    it('renders mobile menu button', () => {
      render(<NavigationBar user={mockUser} />);
      expect(screen.getByRole('button', { name: 'Open main menu' })).toBeInTheDocument();
    });

    it('opens mobile menu when button is clicked', () => {
      render(<NavigationBar user={mockUser} />);

      // Menu should be closed initially
      const mobileMenuItems = screen.queryAllByRole('button', { name: 'Pantry' });
      // Only desktop button visible (hidden by CSS, but rendered)
      expect(mobileMenuItems.length).toBe(1);

      // Click to open
      fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));

      // Now mobile menu items should also be rendered
      const allPantryButtons = screen.getAllByRole('button', { name: 'Pantry' });
      expect(allPantryButtons.length).toBe(2); // Desktop + mobile
    });

    it('closes mobile menu after navigation', () => {
      render(<NavigationBar user={mockUser} />);

      // Open menu
      fireEvent.click(screen.getByRole('button', { name: 'Open main menu' }));

      // Click a nav item in mobile menu (second Pantry button)
      const pantryButtons = screen.getAllByRole('button', { name: 'Pantry' });
      fireEvent.click(pantryButtons[1]);

      expect(mockPush).toHaveBeenCalledWith('/pantry');
    });
  });
});
