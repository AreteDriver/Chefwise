import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UpdateAvailableToast from '../UpdateAvailableToast';

describe('UpdateAvailableToast', () => {
  let mockServiceWorker;
  let mockRegistration;
  let mockWaitingWorker;

  beforeEach(() => {
    jest.clearAllMocks();

    mockWaitingWorker = {
      postMessage: jest.fn(),
    };

    mockRegistration = {
      waiting: null,
      installing: null,
      addEventListener: jest.fn(),
    };

    mockServiceWorker = {
      ready: Promise.resolve(mockRegistration),
      controller: {},
      addEventListener: jest.fn(),
    };

    Object.defineProperty(global.navigator, 'serviceWorker', {
      value: mockServiceWorker,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    delete global.navigator.serviceWorker;
  });

  describe('Hidden state', () => {
    it('renders nothing initially', () => {
      const { container } = render(<UpdateAvailableToast />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('When update is available', () => {
    it('shows update toast when there is a waiting worker', async () => {
      mockRegistration.waiting = mockWaitingWorker;

      render(<UpdateAvailableToast />);

      // Wait for useEffect to run
      await screen.findByText('Update Available');
    });

    it('shows update description', async () => {
      mockRegistration.waiting = mockWaitingWorker;

      render(<UpdateAvailableToast />);

      await screen.findByText(/A new version of ChefWise is ready/);
    });

    it('shows Refresh Now button', async () => {
      mockRegistration.waiting = mockWaitingWorker;

      render(<UpdateAvailableToast />);

      await screen.findByText('Refresh Now');
    });

    it('shows Later button', async () => {
      mockRegistration.waiting = mockWaitingWorker;

      render(<UpdateAvailableToast />);

      await screen.findByText('Later');
    });

    it('shows dismiss button', async () => {
      mockRegistration.waiting = mockWaitingWorker;

      render(<UpdateAvailableToast />);

      await screen.findByRole('button', { name: 'Dismiss' });
    });
  });

  describe('User interactions', () => {
    it('sends SKIP_WAITING message when Refresh Now is clicked', async () => {
      mockRegistration.waiting = mockWaitingWorker;

      render(<UpdateAvailableToast />);

      const refreshButton = await screen.findByText('Refresh Now');
      fireEvent.click(refreshButton);

      expect(mockWaitingWorker.postMessage).toHaveBeenCalledWith({
        type: 'SKIP_WAITING',
      });
    });

    it('hides toast when Later is clicked', async () => {
      mockRegistration.waiting = mockWaitingWorker;

      render(<UpdateAvailableToast />);

      const laterButton = await screen.findByText('Later');
      fireEvent.click(laterButton);

      expect(screen.queryByText('Update Available')).not.toBeInTheDocument();
    });

    it('hides toast when dismiss button is clicked', async () => {
      mockRegistration.waiting = mockWaitingWorker;

      render(<UpdateAvailableToast />);

      const dismissButton = await screen.findByRole('button', { name: 'Dismiss' });
      fireEvent.click(dismissButton);

      expect(screen.queryByText('Update Available')).not.toBeInTheDocument();
    });
  });

  describe('No service worker support', () => {
    it('renders nothing when service worker is not supported', () => {
      delete global.navigator.serviceWorker;

      const { container } = render(<UpdateAvailableToast />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Service worker setup', () => {
    it('listens for updatefound and controllerchange events', async () => {
      mockRegistration.waiting = mockWaitingWorker;

      render(<UpdateAvailableToast />);

      // Wait for component to set up listeners
      await screen.findByText('Update Available');

      // Verify registration addEventListener was called for updatefound
      expect(mockRegistration.addEventListener).toHaveBeenCalledWith(
        'updatefound',
        expect.any(Function)
      );

      // Verify serviceWorker addEventListener was called for controllerchange
      expect(mockServiceWorker.addEventListener).toHaveBeenCalledWith(
        'controllerchange',
        expect.any(Function)
      );
    });
  });
});
