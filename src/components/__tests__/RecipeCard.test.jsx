import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RecipeCard from '../RecipeCard';

describe('RecipeCard', () => {
  const mockRecipe = {
    title: 'Grilled Chicken Salad',
    description: 'A healthy and delicious salad',
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    macros: {
      calories: 350,
      protein: 30,
      carbs: 15,
      fat: 18,
    },
    tags: ['healthy', 'low-carb', 'high-protein'],
  };

  it('renders nothing when recipe is null', () => {
    const { container } = render(<RecipeCard recipe={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders recipe title', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText('Grilled Chicken Salad')).toBeInTheDocument();
  });

  it('renders recipe description', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText('A healthy and delicious salad')).toBeInTheDocument();
  });

  it('calculates and displays total time', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });

  it('displays servings', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText('4 servings')).toBeInTheDocument();
  });

  it('displays macro information', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText('350')).toBeInTheDocument();
    expect(screen.getByText('30g')).toBeInTheDocument();
    expect(screen.getByText('15g')).toBeInTheDocument();
    expect(screen.getByText('18g')).toBeInTheDocument();
  });

  it('displays tags (max 3)', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.getByText('healthy')).toBeInTheDocument();
    expect(screen.getByText('low-carb')).toBeInTheDocument();
    expect(screen.getByText('high-protein')).toBeInTheDocument();
  });

  it('limits displayed tags to 3', () => {
    const recipeWithManyTags = {
      ...mockRecipe,
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
    };
    render(<RecipeCard recipe={recipeWithManyTags} />);
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('tag3')).toBeInTheDocument();
    expect(screen.queryByText('tag4')).not.toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const handleClick = jest.fn();
    render(<RecipeCard recipe={mockRecipe} onClick={handleClick} />);

    fireEvent.click(screen.getByText('Grilled Chicken Salad'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onSave when save button is clicked', () => {
    const handleSave = jest.fn();
    render(<RecipeCard recipe={mockRecipe} onSave={handleSave} />);

    const saveButton = screen.getByLabelText('Save recipe');
    fireEvent.click(saveButton);

    expect(handleSave).toHaveBeenCalledWith(mockRecipe);
  });

  it('stops propagation when save button is clicked', () => {
    const handleClick = jest.fn();
    const handleSave = jest.fn();
    render(<RecipeCard recipe={mockRecipe} onClick={handleClick} onSave={handleSave} />);

    const saveButton = screen.getByLabelText('Save recipe');
    fireEvent.click(saveButton);

    expect(handleSave).toHaveBeenCalled();
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not render save button when onSave is not provided', () => {
    render(<RecipeCard recipe={mockRecipe} />);
    expect(screen.queryByLabelText('Save recipe')).not.toBeInTheDocument();
  });

  it('handles recipe without optional fields', () => {
    const minimalRecipe = { title: 'Simple Recipe' };
    render(<RecipeCard recipe={minimalRecipe} />);

    expect(screen.getByText('Simple Recipe')).toBeInTheDocument();
    expect(screen.queryByText('min')).not.toBeInTheDocument();
    expect(screen.queryByText('servings')).not.toBeInTheDocument();
  });

  it('handles zero prep and cook times', () => {
    const recipeWithZeroTimes = {
      ...mockRecipe,
      prepTime: 0,
      cookTime: 0,
    };
    render(<RecipeCard recipe={recipeWithZeroTimes} />);
    expect(screen.queryByText('0 min')).not.toBeInTheDocument();
  });
});
