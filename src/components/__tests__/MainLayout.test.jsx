import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MainLayout from '../MainLayout';

// Mock NavigationBar
jest.mock('../NavigationBar', () => {
  return function MockNavigationBar({ user, currentPage }) {
    return (
      <div data-testid="navigation-bar">
        NavigationBar (user: {user ? 'yes' : 'no'}, page: {currentPage || 'none'})
      </div>
    );
  };
});

// Mock OfflineStatusBanner
jest.mock('../OfflineStatusBanner', () => {
  return function MockOfflineStatusBanner() {
    return <div data-testid="offline-banner">OfflineStatusBanner</div>;
  };
});

describe('MainLayout', () => {
  it('renders children', () => {
    render(
      <MainLayout user={null}>
        <div>Test Content</div>
      </MainLayout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders NavigationBar', () => {
    render(
      <MainLayout user={null}>
        <div>Content</div>
      </MainLayout>
    );

    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
  });

  it('renders OfflineStatusBanner', () => {
    render(
      <MainLayout user={null}>
        <div>Content</div>
      </MainLayout>
    );

    expect(screen.getByTestId('offline-banner')).toBeInTheDocument();
  });

  it('passes user prop to NavigationBar', () => {
    const mockUser = { uid: 'user123' };
    render(
      <MainLayout user={mockUser}>
        <div>Content</div>
      </MainLayout>
    );

    expect(screen.getByText(/user: yes/)).toBeInTheDocument();
  });

  it('passes currentPage prop to NavigationBar', () => {
    render(
      <MainLayout user={null} currentPage="pantry">
        <div>Content</div>
      </MainLayout>
    );

    expect(screen.getByText(/page: pantry/)).toBeInTheDocument();
  });

  it('defaults currentPage to empty string', () => {
    render(
      <MainLayout user={null}>
        <div>Content</div>
      </MainLayout>
    );

    expect(screen.getByText(/page: none/)).toBeInTheDocument();
  });

  it('has proper layout structure', () => {
    const { container } = render(
      <MainLayout user={null}>
        <div>Content</div>
      </MainLayout>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('min-h-screen');
    expect(wrapper).toHaveClass('bg-gray-50');
  });

  it('wraps children in main element', () => {
    render(
      <MainLayout user={null}>
        <div data-testid="child-content">Content</div>
      </MainLayout>
    );

    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByTestId('child-content'));
  });
});
