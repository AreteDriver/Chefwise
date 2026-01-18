import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PantryInventory from '../PantryInventory';

// Mock the pantry service
jest.mock('@/utils/offline/pantryService', () => ({
  subscribeToPantry: jest.fn((userId, callback) => {
    // Use setTimeout to call after useEffect has run
    setTimeout(() => callback([], false), 0);
    return jest.fn(); // unsubscribe function
  }),
  addPantryItem: jest.fn(),
  deletePantryItem: jest.fn(),
  isPendingSync: jest.fn(() => false),
  LOCAL_STATUS: {
    PENDING_CREATE: 'pending_create',
    PENDING_DELETE: 'pending_delete',
  },
}));

// Mock the network status context
jest.mock('@/contexts/NetworkStatusContext', () => ({
  useNetworkStatus: () => ({
    isOnline: true,
    incrementPendingCount: jest.fn(),
  }),
}));

import {
  subscribeToPantry,
  addPantryItem,
  deletePantryItem,
  isPendingSync,
} from '@/utils/offline/pantryService';

describe('PantryInventory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('shows loading state initially', () => {
      // Don't call the callback immediately
      subscribeToPantry.mockImplementation(() => jest.fn());

      render(<PantryInventory userId="user123" />);
      expect(screen.getByText('Loading pantry...')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    beforeEach(() => {
      subscribeToPantry.mockImplementation((userId, callback) => {
        setTimeout(() => callback([], false), 0);
        return jest.fn();
      });
    });

    it('renders empty state when no items', async () => {
      render(<PantryInventory userId="user123" />);
      await waitFor(() => {
        expect(screen.getByText('Your pantry is empty')).toBeInTheDocument();
      });
      expect(screen.getByText('Add ingredients to get started')).toBeInTheDocument();
    });

    it('renders empty state when userId is not provided', async () => {
      render(<PantryInventory userId={null} />);
      // When userId is null, loading is set to false and empty state shows
      await waitFor(() => {
        expect(screen.getByText('Your pantry is empty')).toBeInTheDocument();
      });
    });
  });

  describe('With items', () => {
    const mockItems = [
      { id: '1', name: 'Chicken', quantity: '2', unit: 'lbs', category: 'Protein' },
      { id: '2', name: 'Rice', quantity: '1', unit: 'kg', category: 'Grains' },
    ];

    beforeEach(() => {
      subscribeToPantry.mockImplementation((userId, callback) => {
        setTimeout(() => callback(mockItems, false), 0);
        return jest.fn();
      });
    });

    it('renders pantry items', async () => {
      render(<PantryInventory userId="user123" />);
      await waitFor(() => {
        expect(screen.getByText('Chicken')).toBeInTheDocument();
      });
      expect(screen.getByText('Rice')).toBeInTheDocument();
    });

    it('displays item count', async () => {
      render(<PantryInventory userId="user123" />);
      await waitFor(() => {
        expect(screen.getByText('2 items in pantry')).toBeInTheDocument();
      });
    });

    it('displays quantity and unit', async () => {
      render(<PantryInventory userId="user123" />);
      await waitFor(() => {
        expect(screen.getByText('2 lbs')).toBeInTheDocument();
      });
      expect(screen.getByText('1 kg')).toBeInTheDocument();
    });

    it('displays category badges', async () => {
      render(<PantryInventory userId="user123" />);
      await waitFor(() => {
        // Use getAllByText since categories appear in both dropdown and badges
        const proteinElements = screen.getAllByText('Protein');
        // At least 2 - one in dropdown, one in badge
        expect(proteinElements.length).toBeGreaterThanOrEqual(2);
      });
      const grainsElements = screen.getAllByText('Grains');
      expect(grainsElements.length).toBeGreaterThanOrEqual(2);
    });

    it('calls onSuggestRecipes when suggest button is clicked', async () => {
      const handleSuggest = jest.fn();
      render(<PantryInventory userId="user123" onSuggestRecipes={handleSuggest} />);

      await waitFor(() => {
        expect(screen.getByText('Suggest Recipes')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Suggest Recipes'));
      expect(handleSuggest).toHaveBeenCalledWith(mockItems);
    });
  });

  describe('Adding items', () => {
    it('renders add item form', () => {
      render(<PantryInventory userId="user123" />);
      expect(screen.getByPlaceholderText('Item name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Quantity')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Unit (oz, cups, etc)')).toBeInTheDocument();
      expect(screen.getByText('Add to Pantry')).toBeInTheDocument();
    });

    it('calls addPantryItem when form is submitted', async () => {
      addPantryItem.mockResolvedValue({ id: 'new-item' });
      render(<PantryInventory userId="user123" />);

      fireEvent.change(screen.getByPlaceholderText('Item name'), {
        target: { value: 'Tomatoes' },
      });
      fireEvent.change(screen.getByPlaceholderText('Quantity'), {
        target: { value: '5' },
      });
      fireEvent.click(screen.getByText('Add to Pantry'));

      await waitFor(() => {
        expect(addPantryItem).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Tomatoes', quantity: '5' }),
          'user123'
        );
      });
    });

    it('clears form after successful submission', async () => {
      addPantryItem.mockResolvedValue({ id: 'new-item' });
      render(<PantryInventory userId="user123" />);

      const nameInput = screen.getByPlaceholderText('Item name');
      fireEvent.change(nameInput, { target: { value: 'Tomatoes' } });
      fireEvent.click(screen.getByText('Add to Pantry'));

      await waitFor(() => {
        expect(nameInput.value).toBe('');
      });
    });

    it('does not submit when item name is empty', () => {
      render(<PantryInventory userId="user123" />);
      fireEvent.click(screen.getByText('Add to Pantry'));
      expect(addPantryItem).not.toHaveBeenCalled();
    });
  });

  describe('Deleting items', () => {
    const mockItems = [
      { id: '1', name: 'Chicken', quantity: '2', unit: 'lbs', category: 'Protein' },
    ];

    beforeEach(() => {
      subscribeToPantry.mockImplementation((userId, callback) => {
        callback(mockItems, false);
        return jest.fn();
      });
    });

    it('calls deletePantryItem when delete button is clicked', async () => {
      deletePantryItem.mockResolvedValue(undefined);
      render(<PantryInventory userId="user123" />);

      fireEvent.click(screen.getByLabelText('Delete item'));

      await waitFor(() => {
        expect(deletePantryItem).toHaveBeenCalledWith('1', 'user123');
      });
    });
  });

  describe('Cache indicator', () => {
    it('shows cached data indicator when data is from cache', () => {
      subscribeToPantry.mockImplementation((userId, callback) => {
        callback([], true); // fromCache = true
        return jest.fn();
      });

      render(<PantryInventory userId="user123" />);
      expect(screen.getByText('Cached data')).toBeInTheDocument();
    });

    it('does not show cached indicator when data is live', () => {
      subscribeToPantry.mockImplementation((userId, callback) => {
        callback([], false); // fromCache = false
        return jest.fn();
      });

      render(<PantryInventory userId="user123" />);
      expect(screen.queryByText('Cached data')).not.toBeInTheDocument();
    });
  });

  describe('Pending sync indicator', () => {
    it('shows pending sync badge for items awaiting sync', () => {
      const mockItems = [
        { id: 'temp_1', name: 'New Item', syncStatus: 'pending_create' },
      ];

      subscribeToPantry.mockImplementation((userId, callback) => {
        callback(mockItems, false);
        return jest.fn();
      });

      isPendingSync.mockReturnValue(true);

      render(<PantryInventory userId="user123" />);
      expect(screen.getByText('Pending sync')).toBeInTheDocument();
    });
  });

  describe('Category dropdown', () => {
    it('renders all category options in the add item form', () => {
      render(<PantryInventory userId="user123" />);

      // There are multiple comboboxes - one in the add form, one for filtering
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(1);

      const categories = ['Protein', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Spices', 'Other'];
      categories.forEach((cat) => {
        // Each category appears in at least the add form dropdown
        expect(screen.getAllByRole('option', { name: cat }).length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
