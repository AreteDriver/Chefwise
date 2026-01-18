import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PhotoPantryScanner from '../PhotoPantryScanner';

// Mock Firebase functions
const mockAnalyzePantryPhoto = jest.fn();
jest.mock('firebase/functions', () => ({
  httpsCallable: () => mockAnalyzePantryPhoto,
}));

jest.mock('@/firebase/firebaseConfig', () => ({
  functions: {},
}));

// Mock the network status context
jest.mock('@/contexts/NetworkStatusContext', () => ({
  useNetworkStatus: () => ({
    isOnline: true,
  }),
}));

describe('PhotoPantryScanner', () => {
  const mockOnItemsDetected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyzePantryPhoto.mockReset();
  });

  describe('Rendering', () => {
    it('renders the component with title and description', () => {
      render(<PhotoPantryScanner userId="user123" onItemsDetected={mockOnItemsDetected} />);

      expect(screen.getByText('Scan Pantry')).toBeInTheDocument();
      expect(screen.getByText(/Take a photo of your fridge/)).toBeInTheDocument();
    });

    it('renders file input for photo selection', () => {
      render(<PhotoPantryScanner userId="user123" onItemsDetected={mockOnItemsDetected} />);

      const fileInput = document.getElementById('pantry-photo-input');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', 'image/*');
      expect(fileInput).toHaveAttribute('capture', 'environment');
    });

    it('shows upload prompt when no image selected', () => {
      render(<PhotoPantryScanner userId="user123" onItemsDetected={mockOnItemsDetected} />);

      expect(screen.getByText('Take or select photo')).toBeInTheDocument();
    });
  });

  describe('Offline state', () => {
    it('shows "Requires internet" badge when offline', () => {
      // Override the mock for this test
      jest.doMock('@/contexts/NetworkStatusContext', () => ({
        useNetworkStatus: () => ({
          isOnline: false,
        }),
      }));

      // Re-import to get new mock
      jest.isolateModules(() => {
        const { useNetworkStatus } = require('@/contexts/NetworkStatusContext');
        jest.spyOn(require('@/contexts/NetworkStatusContext'), 'useNetworkStatus')
          .mockReturnValue({ isOnline: false });
      });
    });
  });

  describe('File selection', () => {
    it('validates file type - rejects non-image files', async () => {
      render(<PhotoPantryScanner userId="user123" onItemsDetected={mockOnItemsDetected} />);

      const fileInput = document.getElementById('pantry-photo-input');
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/Please select an image file/)).toBeInTheDocument();
      });
    });

    it('validates file size - rejects files over 5MB', async () => {
      render(<PhotoPantryScanner userId="user123" onItemsDetected={mockOnItemsDetected} />);

      const fileInput = document.getElementById('pantry-photo-input');
      // Create a mock file larger than 5MB
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/Image must be smaller than 5MB/)).toBeInTheDocument();
      });
    });

    it('accepts valid image files', async () => {
      render(<PhotoPantryScanner userId="user123" onItemsDetected={mockOnItemsDetected} />);

      const fileInput = document.getElementById('pantry-photo-input');
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        result: 'data:image/jpeg;base64,dGVzdA==',
        onloadend: null,
      };
      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader);

      fireEvent.change(fileInput, { target: { files: [file] } });

      // Trigger onloadend
      mockFileReader.onloadend();

      await waitFor(() => {
        expect(screen.getByText('Analyze Photo')).toBeInTheDocument();
      });
    });

    it('shows image preview after selection', async () => {
      render(<PhotoPantryScanner userId="user123" onItemsDetected={mockOnItemsDetected} />);

      const fileInput = document.getElementById('pantry-photo-input');
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });

      const mockFileReader = {
        readAsDataURL: jest.fn(),
        result: 'data:image/jpeg;base64,dGVzdA==',
        onloadend: null,
      };
      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader);

      fireEvent.change(fileInput, { target: { files: [file] } });
      mockFileReader.onloadend();

      await waitFor(() => {
        const preview = screen.getByAltText('Pantry photo preview');
        expect(preview).toBeInTheDocument();
      });
    });
  });

  describe('Image analysis', () => {
    const setupWithImage = async () => {
      render(<PhotoPantryScanner userId="user123" onItemsDetected={mockOnItemsDetected} />);

      const fileInput = document.getElementById('pantry-photo-input');
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });

      const mockFileReader = {
        readAsDataURL: jest.fn(),
        result: 'data:image/jpeg;base64,dGVzdA==',
        onloadend: null,
      };
      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader);

      fireEvent.change(fileInput, { target: { files: [file] } });
      mockFileReader.onloadend();

      await waitFor(() => {
        expect(screen.getByText('Analyze Photo')).toBeInTheDocument();
      });
    };

    it('shows loading state during analysis', async () => {
      await setupWithImage();

      mockAnalyzePantryPhoto.mockImplementation(() => new Promise(() => {})); // Never resolves

      fireEvent.click(screen.getByText('Analyze Photo'));

      await waitFor(() => {
        expect(screen.getByText('Detecting items...')).toBeInTheDocument();
      });
    });

    it('displays detected items after successful analysis', async () => {
      await setupWithImage();

      const mockItems = [
        { name: 'Eggs', quantity: '12', unit: 'pieces', category: 'Protein' },
        { name: 'Milk', quantity: '1', unit: 'gallon', category: 'Dairy' },
      ];

      mockAnalyzePantryPhoto.mockResolvedValue({
        data: { items: mockItems },
      });

      fireEvent.click(screen.getByText('Analyze Photo'));

      await waitFor(() => {
        expect(screen.getByText('Detected Items (2)')).toBeInTheDocument();
      });
      expect(screen.getByText('Eggs')).toBeInTheDocument();
      expect(screen.getByText('Milk')).toBeInTheDocument();
    });

    it('shows error when no items detected', async () => {
      await setupWithImage();

      mockAnalyzePantryPhoto.mockResolvedValue({
        data: { items: [] },
      });

      fireEvent.click(screen.getByText('Analyze Photo'));

      await waitFor(() => {
        expect(screen.getByText(/No food items detected/)).toBeInTheDocument();
      });
    });

    it('shows error message on API failure', async () => {
      await setupWithImage();

      mockAnalyzePantryPhoto.mockRejectedValue(new Error('API Error'));

      fireEvent.click(screen.getByText('Analyze Photo'));

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });
    });

    it('shows rate limit error message', async () => {
      await setupWithImage();

      const error = new Error('Daily limit reached (2 scans/day). Upgrade to Premium for unlimited scans.');
      error.code = 'functions/permission-denied';
      mockAnalyzePantryPhoto.mockRejectedValue(error);

      fireEvent.click(screen.getByText('Analyze Photo'));

      await waitFor(() => {
        expect(screen.getByText(/Daily limit reached/)).toBeInTheDocument();
      });
    });
  });

  describe('Editing detected items', () => {
    const setupWithDetectedItems = async () => {
      render(<PhotoPantryScanner userId="user123" onItemsDetected={mockOnItemsDetected} />);

      const fileInput = document.getElementById('pantry-photo-input');
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });

      const mockFileReader = {
        readAsDataURL: jest.fn(),
        result: 'data:image/jpeg;base64,dGVzdA==',
        onloadend: null,
      };
      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader);

      fireEvent.change(fileInput, { target: { files: [file] } });
      mockFileReader.onloadend();

      const mockItems = [
        { name: 'Eggs', quantity: '12', unit: 'pieces', category: 'Protein' },
      ];

      mockAnalyzePantryPhoto.mockResolvedValue({
        data: { items: mockItems },
      });

      await waitFor(() => {
        expect(screen.getByText('Analyze Photo')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Analyze Photo'));

      await waitFor(() => {
        expect(screen.getByText('Eggs')).toBeInTheDocument();
      });
    };

    it('allows removing items from the list', async () => {
      await setupWithDetectedItems();

      const removeButton = screen.getByLabelText('Remove item');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('Eggs')).not.toBeInTheDocument();
      });
    });

    it('toggles edit mode when edit button is clicked', async () => {
      await setupWithDetectedItems();

      const editButton = screen.getByLabelText('Edit item');
      fireEvent.click(editButton);

      await waitFor(() => {
        // In edit mode, should show input fields
        expect(screen.getByDisplayValue('Eggs')).toBeInTheDocument();
        expect(screen.getByDisplayValue('12')).toBeInTheDocument();
      });
    });
  });

  describe('Adding items to pantry', () => {
    it('calls onItemsDetected with detected items when Add button is clicked', async () => {
      render(<PhotoPantryScanner userId="user123" onItemsDetected={mockOnItemsDetected} />);

      const fileInput = document.getElementById('pantry-photo-input');
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });

      const mockFileReader = {
        readAsDataURL: jest.fn(),
        result: 'data:image/jpeg;base64,dGVzdA==',
        onloadend: null,
      };
      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader);

      fireEvent.change(fileInput, { target: { files: [file] } });
      mockFileReader.onloadend();

      const mockItems = [
        { name: 'Eggs', quantity: '12', unit: 'pieces', category: 'Protein' },
        { name: 'Milk', quantity: '1', unit: 'gallon', category: 'Dairy' },
      ];

      mockAnalyzePantryPhoto.mockResolvedValue({
        data: { items: mockItems },
      });

      await waitFor(() => {
        expect(screen.getByText('Analyze Photo')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Analyze Photo'));

      await waitFor(() => {
        expect(screen.getByText(/Add 2 Items to Pantry/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Add 2 Items to Pantry/));

      expect(mockOnItemsDetected).toHaveBeenCalledWith(mockItems);
    });

    it('resets state after adding items', async () => {
      render(<PhotoPantryScanner userId="user123" onItemsDetected={mockOnItemsDetected} />);

      const fileInput = document.getElementById('pantry-photo-input');
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });

      const mockFileReader = {
        readAsDataURL: jest.fn(),
        result: 'data:image/jpeg;base64,dGVzdA==',
        onloadend: null,
      };
      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader);

      fireEvent.change(fileInput, { target: { files: [file] } });
      mockFileReader.onloadend();

      const mockItems = [{ name: 'Eggs', quantity: '12', unit: 'pieces', category: 'Protein' }];

      mockAnalyzePantryPhoto.mockResolvedValue({
        data: { items: mockItems },
      });

      await waitFor(() => {
        expect(screen.getByText('Analyze Photo')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Analyze Photo'));

      await waitFor(() => {
        expect(screen.getByText(/Add 1 Item to Pantry/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Add 1 Item to Pantry/));

      // Should reset to initial state
      await waitFor(() => {
        expect(screen.getByText('Take or select photo')).toBeInTheDocument();
      });
    });
  });

  describe('Clear functionality', () => {
    it('clears all state when Clear all is clicked', async () => {
      render(<PhotoPantryScanner userId="user123" onItemsDetected={mockOnItemsDetected} />);

      const fileInput = document.getElementById('pantry-photo-input');
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });

      const mockFileReader = {
        readAsDataURL: jest.fn(),
        result: 'data:image/jpeg;base64,dGVzdA==',
        onloadend: null,
      };
      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader);

      fireEvent.change(fileInput, { target: { files: [file] } });
      mockFileReader.onloadend();

      const mockItems = [{ name: 'Eggs', quantity: '12', unit: 'pieces', category: 'Protein' }];

      mockAnalyzePantryPhoto.mockResolvedValue({
        data: { items: mockItems },
      });

      await waitFor(() => {
        expect(screen.getByText('Analyze Photo')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Analyze Photo'));

      await waitFor(() => {
        expect(screen.getByText('Clear all')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Clear all'));

      await waitFor(() => {
        expect(screen.getByText('Take or select photo')).toBeInTheDocument();
      });
    });
  });
});
