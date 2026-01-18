import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomeTab from '../HomeTab';

// Mock next/router
const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Firebase
const mockGetDocs = jest.fn();
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: (...args) => mockGetDocs(...args),
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
}));

jest.mock('@/firebase/firebaseConfig', () => ({
  db: {},
}));

// Mock useOpenAI hook
const mockGenerateRecipe = jest.fn();
const mockOpenAI = {
  loading: false,
  error: null,
  result: null,
  generateRecipe: mockGenerateRecipe,
};

jest.mock('@/hooks/useOpenAI', () => ({
  __esModule: true,
  default: () => mockOpenAI,
}));

// Mock saveRecipe
const mockSaveRecipe = jest.fn();
jest.mock('@/utils/offline/recipeService', () => ({
  saveRecipe: (...args) => mockSaveRecipe(...args),
}));

// Mock RecipeCard
jest.mock('../RecipeCard', () => {
  return function MockRecipeCard({ recipe, onSave, onClick }) {
    return (
      <div data-testid="recipe-card">
        <span>{recipe.title}</span>
        {onSave && <button onClick={() => onSave(recipe)}>Save</button>}
        {onClick && <button onClick={onClick}>View</button>}
      </div>
    );
  };
});

describe('HomeTab', () => {
  const mockUser = {
    uid: 'user123',
    displayName: 'John Doe',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenAI.loading = false;
    mockOpenAI.error = null;
    mockOpenAI.result = null;
    mockGetDocs.mockResolvedValue({ docs: [] });
  });

  describe('Greeting section', () => {
    it('shows personalized greeting with first name', () => {
      render(<HomeTab user={mockUser} />);
      expect(screen.getByText(/Hey John/)).toBeInTheDocument();
    });

    it('shows generic greeting when no user', () => {
      render(<HomeTab user={null} />);
      expect(screen.getByText(/Hey there/)).toBeInTheDocument();
    });

    it('shows generic greeting when user has no displayName', () => {
      render(<HomeTab user={{ uid: 'user123' }} />);
      expect(screen.getByText(/Hey there/)).toBeInTheDocument();
    });

    it('displays dinner question', () => {
      render(<HomeTab user={mockUser} />);
      expect(screen.getByText(/what's for dinner tonight/)).toBeInTheDocument();
    });
  });

  describe('Pantry section', () => {
    it('shows pantry loading spinner while loading', async () => {
      mockGetDocs.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<HomeTab user={mockUser} />);

      expect(screen.getByText(/Loading pantry items/)).toBeInTheDocument();
    });

    it('shows "Add Pantry Items First" when no pantry items', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });
      render(<HomeTab user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText(/Add Pantry Items First/)).toBeInTheDocument();
      });
    });

    it('shows pantry item count when items exist', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { id: '1', data: () => ({ name: 'Chicken' }) },
          { id: '2', data: () => ({ name: 'Rice' }) },
          { id: '3', data: () => ({ name: 'Broccoli' }) },
        ],
      });

      render(<HomeTab user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText(/Use your 3 pantry items/)).toBeInTheDocument();
      });
    });

    it('displays pantry item chips', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { id: '1', data: () => ({ name: 'Chicken' }) },
          { id: '2', data: () => ({ name: 'Rice' }) },
        ],
      });

      render(<HomeTab user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('Chicken')).toBeInTheDocument();
        expect(screen.getByText('Rice')).toBeInTheDocument();
      });
    });

    it('shows "+X more" when more than 5 items', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { id: '1', data: () => ({ name: 'Item 1' }) },
          { id: '2', data: () => ({ name: 'Item 2' }) },
          { id: '3', data: () => ({ name: 'Item 3' }) },
          { id: '4', data: () => ({ name: 'Item 4' }) },
          { id: '5', data: () => ({ name: 'Item 5' }) },
          { id: '6', data: () => ({ name: 'Item 6' }) },
          { id: '7', data: () => ({ name: 'Item 7' }) },
        ],
      });

      render(<HomeTab user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText('+2 more')).toBeInTheDocument();
      });
    });

    it('does not load pantry when no user', () => {
      render(<HomeTab user={null} />);
      expect(mockGetDocs).not.toHaveBeenCalled();
    });
  });

  describe('Generate recipe button', () => {
    it('redirects to pantry page when no pantry items', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });
      render(<HomeTab user={mockUser} />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading pantry/)).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Add Pantry Items First/));
      expect(mockPush).toHaveBeenCalledWith('/pantry');
    });

    it('calls generateRecipe when pantry has items', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { id: '1', data: () => ({ name: 'Chicken' }) },
        ],
      });

      render(<HomeTab user={mockUser} />);

      await waitFor(() => {
        expect(screen.getByText(/Generate Recipe from My Pantry/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Generate Recipe from My Pantry/));

      expect(mockGenerateRecipe).toHaveBeenCalledWith({
        dietType: 'general',
        ingredients: ['Chicken'],
        preferences: {},
        userId: 'user123',
      });
    });

    it('shows alert when not logged in', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      mockGetDocs.mockResolvedValue({ docs: [] });
      render(<HomeTab user={null} />);

      fireEvent.click(screen.getByText(/Add Pantry Items First/));

      expect(alertSpy).toHaveBeenCalledWith('Please sign in to generate recipes');
      alertSpy.mockRestore();
    });

    it('shows loading state while generating', async () => {
      mockOpenAI.loading = true;
      mockGetDocs.mockResolvedValue({
        docs: [{ id: '1', data: () => ({ name: 'Test' }) }],
      });

      render(<HomeTab user={mockUser} />);

      expect(screen.getByText(/Generating Recipe/)).toBeInTheDocument();
    });

    it('disables button while loading', async () => {
      mockOpenAI.loading = true;
      mockGetDocs.mockResolvedValue({
        docs: [{ id: '1', data: () => ({ name: 'Test' }) }],
      });

      render(<HomeTab user={mockUser} />);

      const button = screen.getByText(/Generating Recipe/).closest('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Quick Picks', () => {
    const quickPickCategories = [
      { id: 'quick', title: 'Quick Meals' },
      { id: 'high-protein', title: 'High Protein' },
      { id: 'low-carb', title: 'Low Carb' },
      { id: 'vegetarian', title: 'Vegetarian' },
      { id: 'comfort-food', title: 'Comfort Food' },
      { id: 'healthy', title: 'Healthy Balance' },
    ];

    it('renders all quick pick categories', () => {
      render(<HomeTab user={mockUser} />);

      quickPickCategories.forEach(({ title }) => {
        expect(screen.getByText(title)).toBeInTheDocument();
      });
    });

    it('calls generateRecipe with quick diet type', async () => {
      render(<HomeTab user={mockUser} />);

      fireEvent.click(screen.getByText('Quick Meals'));

      expect(mockGenerateRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          dietType: 'general',
          userId: 'user123',
        })
      );
    });

    it('calls generateRecipe with high-protein diet type', async () => {
      render(<HomeTab user={mockUser} />);

      fireEvent.click(screen.getByText('High Protein'));

      expect(mockGenerateRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          dietType: 'high-protein',
        })
      );
    });

    it('calls generateRecipe with keto diet type for low-carb', async () => {
      render(<HomeTab user={mockUser} />);

      fireEvent.click(screen.getByText('Low Carb'));

      expect(mockGenerateRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          dietType: 'keto',
        })
      );
    });

    it('calls generateRecipe with vegetarian diet type', async () => {
      render(<HomeTab user={mockUser} />);

      fireEvent.click(screen.getByText('Vegetarian'));

      expect(mockGenerateRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          dietType: 'vegetarian',
        })
      );
    });

    it('shows alert for quick pick when not logged in', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      render(<HomeTab user={null} />);

      fireEvent.click(screen.getByText('Quick Meals'));

      expect(alertSpy).toHaveBeenCalledWith('Please sign in to generate recipes');
      alertSpy.mockRestore();
    });

    it('disables quick picks while loading', () => {
      mockOpenAI.loading = true;
      render(<HomeTab user={mockUser} />);

      const quickMealsButton = screen.getByText('Quick Meals').closest('button');
      expect(quickMealsButton).toBeDisabled();
    });
  });

  describe('Recipe result', () => {
    it('displays recipe card when result exists', () => {
      mockOpenAI.result = {
        title: 'Chicken Stir Fry',
        ingredients: ['chicken', 'vegetables'],
        instructions: ['Cook chicken', 'Add vegetables'],
      };

      render(<HomeTab user={mockUser} />);

      expect(screen.getByTestId('recipe-card')).toBeInTheDocument();
      expect(screen.getByText('Chicken Stir Fry')).toBeInTheDocument();
    });

    it('shows "Your Recipe" heading when result exists', () => {
      mockOpenAI.result = { title: 'Test Recipe' };

      render(<HomeTab user={mockUser} />);

      expect(screen.getByText('Your Recipe')).toBeInTheDocument();
    });

    it('does not show recipe section when no result', () => {
      render(<HomeTab user={mockUser} />);

      expect(screen.queryByText('Your Recipe')).not.toBeInTheDocument();
    });
  });

  describe('Error display', () => {
    it('shows error message when error exists', () => {
      mockOpenAI.error = 'Failed to generate recipe';

      render(<HomeTab user={mockUser} />);

      expect(screen.getByText('Failed to generate recipe')).toBeInTheDocument();
    });

    it('does not show error section when no error', () => {
      render(<HomeTab user={mockUser} />);

      expect(screen.queryByText(/Failed/)).not.toBeInTheDocument();
    });
  });

  describe('Save recipe', () => {
    it('calls saveRecipe when save button clicked', async () => {
      const recipe = { title: 'Test Recipe' };
      mockOpenAI.result = recipe;
      mockSaveRecipe.mockResolvedValue({ id: 'saved123', ...recipe });

      render(<HomeTab user={mockUser} />);

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockSaveRecipe).toHaveBeenCalledWith('user123', recipe);
      });
    });
  });

  describe('View recipe', () => {
    it('navigates to recipe page when view clicked and recipe saved', async () => {
      const recipe = { id: 'recipe123', title: 'Test Recipe' };
      mockOpenAI.result = recipe;
      mockSaveRecipe.mockResolvedValue(recipe);

      render(<HomeTab user={mockUser} />);

      // Save first
      fireEvent.click(screen.getByText('Save'));
      await waitFor(() => {
        expect(mockSaveRecipe).toHaveBeenCalled();
      });

      // Then view
      fireEvent.click(screen.getByText('View'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/recipe/recipe123');
      });
    });
  });

  describe('Section headers', () => {
    it('renders Quick Picks section header', () => {
      render(<HomeTab user={mockUser} />);

      expect(screen.getByText('Quick Picks')).toBeInTheDocument();
    });

    it('renders Quick Picks description', () => {
      render(<HomeTab user={mockUser} />);

      expect(
        screen.getByText(/Browse by category and get instant recipe suggestions/)
      ).toBeInTheDocument();
    });

    it('renders Find Recipes section header', () => {
      render(<HomeTab user={mockUser} />);

      expect(screen.getByText('Find Recipes Based on Your Pantry')).toBeInTheDocument();
    });
  });
});
