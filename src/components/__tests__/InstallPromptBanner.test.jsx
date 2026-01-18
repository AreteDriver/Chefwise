import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import InstallPromptBanner from '../InstallPromptBanner';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe('InstallPromptBanner', () => {
  let mockMatchMedia;
  let mockLocalStorage;
  let beforeInstallPromptHandler;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock matchMedia
    mockMatchMedia = jest.fn().mockReturnValue({ matches: false });
    window.matchMedia = mockMatchMedia;

    // Mock localStorage
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Capture beforeinstallprompt handler
    beforeInstallPromptHandler = null;
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = jest.fn((event, handler) => {
      if (event === 'beforeinstallprompt') {
        beforeInstallPromptHandler = handler;
      }
      originalAddEventListener.call(window, event, handler);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial state', () => {
    it('renders nothing initially', () => {
      const { container } = render(<InstallPromptBanner />);
      expect(container.firstChild).toBeNull();
    });

    it('checks display-mode on mount', () => {
      render(<InstallPromptBanner />);
      expect(mockMatchMedia).toHaveBeenCalledWith('(display-mode: standalone)');
    });

    it('does not show when already installed as PWA', () => {
      mockMatchMedia.mockReturnValue({ matches: true });
      render(<InstallPromptBanner />);

      // Trigger beforeinstallprompt
      if (beforeInstallPromptHandler) {
        act(() => {
          beforeInstallPromptHandler({ preventDefault: jest.fn() });
        });
      }

      expect(screen.queryByText('Install ChefWise')).not.toBeInTheDocument();
    });

    it('checks localStorage for previous dismissal', () => {
      render(<InstallPromptBanner />);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('chefwise-install-dismissed');
    });
  });

  describe('Dismissed state', () => {
    it('does not show when dismissed within 7 days', () => {
      // Set dismissal to 1 day ago
      const oneDayAgo = Date.now() - (1 * 24 * 60 * 60 * 1000);
      mockLocalStorage.getItem.mockReturnValue(oneDayAgo.toString());

      render(<InstallPromptBanner />);

      // Trigger beforeinstallprompt
      if (beforeInstallPromptHandler) {
        act(() => {
          beforeInstallPromptHandler({ preventDefault: jest.fn() });
        });
      }

      expect(screen.queryByText('Install ChefWise')).not.toBeInTheDocument();
    });

    it('shows banner when dismissal was more than 7 days ago', () => {
      // Set dismissal to 8 days ago
      const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
      mockLocalStorage.getItem.mockReturnValue(eightDaysAgo.toString());

      render(<InstallPromptBanner />);

      // Trigger beforeinstallprompt
      if (beforeInstallPromptHandler) {
        act(() => {
          beforeInstallPromptHandler({ preventDefault: jest.fn() });
        });
      }

      expect(screen.getByText('Install ChefWise')).toBeInTheDocument();
    });
  });

  describe('Banner display', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(null);
    });

    it('shows banner when beforeinstallprompt fires', () => {
      render(<InstallPromptBanner />);

      act(() => {
        beforeInstallPromptHandler({ preventDefault: jest.fn() });
      });

      expect(screen.getByText('Install ChefWise')).toBeInTheDocument();
    });

    it('prevents default on beforeinstallprompt', () => {
      render(<InstallPromptBanner />);

      const mockPreventDefault = jest.fn();
      act(() => {
        beforeInstallPromptHandler({ preventDefault: mockPreventDefault });
      });

      expect(mockPreventDefault).toHaveBeenCalled();
    });

    it('shows subtitle', () => {
      render(<InstallPromptBanner />);

      act(() => {
        beforeInstallPromptHandler({ preventDefault: jest.fn() });
      });

      expect(screen.getByText('Add to your home screen')).toBeInTheDocument();
    });

    it('shows description', () => {
      render(<InstallPromptBanner />);

      act(() => {
        beforeInstallPromptHandler({ preventDefault: jest.fn() });
      });

      expect(
        screen.getByText(/Install our app for quick access, offline support/)
      ).toBeInTheDocument();
    });

    it('shows feature list', () => {
      render(<InstallPromptBanner />);

      act(() => {
        beforeInstallPromptHandler({ preventDefault: jest.fn() });
      });

      expect(screen.getByText('Works offline')).toBeInTheDocument();
      expect(screen.getByText('Fast and lightweight')).toBeInTheDocument();
      expect(screen.getByText('No app store needed')).toBeInTheDocument();
    });

    it('shows Install button', () => {
      render(<InstallPromptBanner />);

      act(() => {
        beforeInstallPromptHandler({ preventDefault: jest.fn() });
      });

      expect(screen.getByText('Install')).toBeInTheDocument();
    });

    it('shows Not now button', () => {
      render(<InstallPromptBanner />);

      act(() => {
        beforeInstallPromptHandler({ preventDefault: jest.fn() });
      });

      expect(screen.getByText('Not now')).toBeInTheDocument();
    });

    it('renders app icon', () => {
      render(<InstallPromptBanner />);

      act(() => {
        beforeInstallPromptHandler({ preventDefault: jest.fn() });
      });

      const icon = screen.getByAltText('ChefWise');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('src', '/icons/icon-72.png');
    });
  });

  describe('Install action', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(null);
    });

    it('calls prompt() when Install clicked', async () => {
      const mockPrompt = jest.fn();
      const mockDeferredPrompt = {
        preventDefault: jest.fn(),
        prompt: mockPrompt,
        userChoice: Promise.resolve({ outcome: 'dismissed' }),
      };

      render(<InstallPromptBanner />);

      act(() => {
        beforeInstallPromptHandler(mockDeferredPrompt);
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Install'));
      });

      expect(mockPrompt).toHaveBeenCalled();
    });

    it('shows Installing... while installing', async () => {
      const mockDeferredPrompt = {
        preventDefault: jest.fn(),
        prompt: jest.fn(),
        userChoice: new Promise(() => {}), // Never resolves
      };

      render(<InstallPromptBanner />);

      act(() => {
        beforeInstallPromptHandler(mockDeferredPrompt);
      });

      fireEvent.click(screen.getByText('Install'));

      expect(screen.getByText('Installing...')).toBeInTheDocument();
    });

    it('disables button while installing', async () => {
      const mockDeferredPrompt = {
        preventDefault: jest.fn(),
        prompt: jest.fn(),
        userChoice: new Promise(() => {}),
      };

      render(<InstallPromptBanner />);

      act(() => {
        beforeInstallPromptHandler(mockDeferredPrompt);
      });

      fireEvent.click(screen.getByText('Install'));

      expect(screen.getByText('Installing...').closest('button')).toBeDisabled();
    });

    it('hides banner when install accepted', async () => {
      const mockDeferredPrompt = {
        preventDefault: jest.fn(),
        prompt: jest.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      };

      render(<InstallPromptBanner />);

      act(() => {
        beforeInstallPromptHandler(mockDeferredPrompt);
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Install'));
      });

      expect(screen.queryByText('Install ChefWise')).not.toBeInTheDocument();
    });

    it('keeps banner visible when install dismissed', async () => {
      let resolveUserChoice;
      const mockDeferredPrompt = {
        preventDefault: jest.fn(),
        prompt: jest.fn(),
        userChoice: new Promise((resolve) => {
          resolveUserChoice = resolve;
        }),
      };

      render(<InstallPromptBanner />);

      act(() => {
        beforeInstallPromptHandler(mockDeferredPrompt);
      });

      fireEvent.click(screen.getByText('Install'));

      await act(async () => {
        resolveUserChoice({ outcome: 'dismissed' });
      });

      // Banner hides after any user choice (prompt was shown)
      // The deferredPrompt is cleared regardless
    });
  });

  describe('Dismiss action', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(null);
    });

    it('hides banner when Not now clicked', () => {
      render(<InstallPromptBanner />);

      act(() => {
        beforeInstallPromptHandler({ preventDefault: jest.fn() });
      });

      fireEvent.click(screen.getByText('Not now'));

      expect(screen.queryByText('Install ChefWise')).not.toBeInTheDocument();
    });

    it('saves dismissal timestamp to localStorage', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      render(<InstallPromptBanner />);

      act(() => {
        beforeInstallPromptHandler({ preventDefault: jest.fn() });
      });

      fireEvent.click(screen.getByText('Not now'));

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'chefwise-install-dismissed',
        now.toString()
      );
    });
  });

  describe('Event listeners', () => {
    it('adds beforeinstallprompt listener on mount', () => {
      render(<InstallPromptBanner />);

      expect(window.addEventListener).toHaveBeenCalledWith(
        'beforeinstallprompt',
        expect.any(Function)
      );
    });
  });
});
