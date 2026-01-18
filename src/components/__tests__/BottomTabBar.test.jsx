import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BottomTabBar from '../BottomTabBar';

// Mock next/router
const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('BottomTabBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all four tabs', () => {
    render(<BottomTabBar activeTab="home" />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Pantry')).toBeInTheDocument();
    expect(screen.getByText('Planner')).toBeInTheDocument();
    expect(screen.getByText('Tracker')).toBeInTheDocument();
  });

  it('highlights active tab', () => {
    render(<BottomTabBar activeTab="pantry" />);

    const pantryButton = screen.getByText('Pantry').closest('button');
    expect(pantryButton).toHaveClass('text-primary');
  });

  it('navigates to home when Home tab is clicked', () => {
    render(<BottomTabBar activeTab="pantry" />);

    fireEvent.click(screen.getByText('Home'));
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('navigates to pantry when Pantry tab is clicked', () => {
    render(<BottomTabBar activeTab="home" />);

    fireEvent.click(screen.getByText('Pantry'));
    expect(mockPush).toHaveBeenCalledWith('/pantry');
  });

  it('navigates to planner when Planner tab is clicked', () => {
    render(<BottomTabBar activeTab="home" />);

    fireEvent.click(screen.getByText('Planner'));
    expect(mockPush).toHaveBeenCalledWith('/planner');
  });

  it('navigates to tracker when Tracker tab is clicked', () => {
    render(<BottomTabBar activeTab="home" />);

    fireEvent.click(screen.getByText('Tracker'));
    expect(mockPush).toHaveBeenCalledWith('/tracker');
  });

  it('renders tab icons', () => {
    render(<BottomTabBar activeTab="home" />);

    // Each tab should have an SVG icon
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);

    buttons.forEach((button) => {
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('applies scale effect to active tab icon', () => {
    render(<BottomTabBar activeTab="home" />);

    const homeButton = screen.getByText('Home').closest('button');
    const iconContainer = homeButton.querySelector('div');
    expect(iconContainer).toHaveClass('scale-110');
  });

  it('does not apply scale effect to inactive tabs', () => {
    render(<BottomTabBar activeTab="home" />);

    const pantryButton = screen.getByText('Pantry').closest('button');
    const iconContainer = pantryButton.querySelector('div');
    expect(iconContainer).not.toHaveClass('scale-110');
  });
});
