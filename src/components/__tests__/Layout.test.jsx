import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Layout from '../Layout';

// Mock NavigationBar
jest.mock('../NavigationBar', () => {
  return function MockNavigationBar({ user }) {
    return <div data-testid="navigation-bar">NavigationBar (user: {user ? 'yes' : 'no'})</div>;
  };
});

describe('Layout', () => {
  it('renders children', () => {
    render(
      <Layout user={null}>
        <div>Test Content</div>
      </Layout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders NavigationBar', () => {
    render(
      <Layout user={null}>
        <div>Content</div>
      </Layout>
    );

    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
  });

  it('passes user prop to NavigationBar', () => {
    const mockUser = { uid: 'user123' };
    render(
      <Layout user={mockUser}>
        <div>Content</div>
      </Layout>
    );

    expect(screen.getByText(/user: yes/)).toBeInTheDocument();
  });

  it('passes null user to NavigationBar when not authenticated', () => {
    render(
      <Layout user={null}>
        <div>Content</div>
      </Layout>
    );

    expect(screen.getByText(/user: no/)).toBeInTheDocument();
  });

  it('has proper layout structure', () => {
    const { container } = render(
      <Layout user={null}>
        <div>Content</div>
      </Layout>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('min-h-screen');
    expect(wrapper).toHaveClass('bg-gray-50');
  });
});
