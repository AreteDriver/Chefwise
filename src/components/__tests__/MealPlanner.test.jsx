import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MealPlanner from '../MealPlanner';

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>,
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
}));

describe('MealPlanner', () => {
  const mockMealPlan = {
    days: [
      {
        day: 1,
        date: '2026-01-18',
        meals: [
          {
            type: 'breakfast',
            title: 'Oatmeal with Berries',
            macros: { calories: 350, protein: 12, carbs: 55, fat: 8 },
            ingredients: ['oats', 'blueberries', 'honey', 'milk'],
          },
          {
            type: 'lunch',
            title: 'Grilled Chicken Salad',
            macros: { calories: 450, protein: 35, carbs: 20, fat: 25 },
            ingredients: ['chicken', 'lettuce', 'tomatoes'],
          },
        ],
        dailyTotals: { calories: 1800, protein: 120, carbs: 180, fat: 60 },
      },
      {
        day: 2,
        date: '2026-01-19',
        meals: [
          {
            type: 'breakfast',
            title: 'Eggs and Toast',
            macros: { calories: 400, protein: 20, carbs: 30, fat: 22 },
          },
        ],
        dailyTotals: { calories: 1900, protein: 130, carbs: 190, fat: 65 },
      },
    ],
    shoppingList: [
      { item: 'Chicken breast', quantity: '2 lbs' },
      { item: 'Oats', quantity: '1 lb' },
    ],
  };

  describe('Empty state', () => {
    it('renders empty state when no meal plan provided', () => {
      render(<MealPlanner mealPlan={null} />);
      expect(screen.getByText('Meal Planner')).toBeInTheDocument();
      expect(screen.getByText(/Generate a personalized meal plan/)).toBeInTheDocument();
    });

    it('renders empty state when meal plan has no days', () => {
      render(<MealPlanner mealPlan={{ days: [] }} />);
      expect(screen.getByText('Generate Meal Plan')).toBeInTheDocument();
    });

    it('calls onGeneratePlan when generate button is clicked', () => {
      const handleGenerate = jest.fn();
      render(<MealPlanner mealPlan={null} onGeneratePlan={handleGenerate} />);

      fireEvent.click(screen.getByText('Generate Meal Plan'));
      expect(handleGenerate).toHaveBeenCalledTimes(1);
    });
  });

  describe('With meal plan data', () => {
    it('renders meal plan title', () => {
      render(<MealPlanner mealPlan={mockMealPlan} />);
      expect(screen.getByText('Your Meal Plan')).toBeInTheDocument();
    });

    it('renders day selector buttons', () => {
      render(<MealPlanner mealPlan={mockMealPlan} />);
      expect(screen.getByText('Day 1')).toBeInTheDocument();
      expect(screen.getByText('Day 2')).toBeInTheDocument();
    });

    it('displays meals for selected day', () => {
      render(<MealPlanner mealPlan={mockMealPlan} />);
      expect(screen.getByText('Oatmeal with Berries')).toBeInTheDocument();
      expect(screen.getByText('Grilled Chicken Salad')).toBeInTheDocument();
    });

    it('switches days when day button is clicked', () => {
      render(<MealPlanner mealPlan={mockMealPlan} />);

      // Initially shows Day 1 meals
      expect(screen.getByText('Oatmeal with Berries')).toBeInTheDocument();

      // Click Day 2
      fireEvent.click(screen.getByText('Day 2'));

      // Should show Day 2 meals
      expect(screen.getByText('Eggs and Toast')).toBeInTheDocument();
      expect(screen.queryByText('Oatmeal with Berries')).not.toBeInTheDocument();
    });

    it('displays meal type labels', () => {
      render(<MealPlanner mealPlan={mockMealPlan} />);
      expect(screen.getByText('breakfast')).toBeInTheDocument();
      expect(screen.getByText('lunch')).toBeInTheDocument();
    });

    it('displays meal calories', () => {
      render(<MealPlanner mealPlan={mockMealPlan} />);
      expect(screen.getByText('350 cal')).toBeInTheDocument();
      expect(screen.getByText('450 cal')).toBeInTheDocument();
    });

    it('displays meal macros', () => {
      render(<MealPlanner mealPlan={mockMealPlan} />);
      expect(screen.getByText('P: 12g')).toBeInTheDocument();
      expect(screen.getByText('C: 55g')).toBeInTheDocument();
      expect(screen.getByText('F: 8g')).toBeInTheDocument();
    });

    it('displays truncated ingredients list', () => {
      render(<MealPlanner mealPlan={mockMealPlan} />);
      expect(screen.getByText(/oats, blueberries, honey/)).toBeInTheDocument();
      expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
    });

    it('displays daily totals', () => {
      render(<MealPlanner mealPlan={mockMealPlan} />);
      expect(screen.getByText('Daily Totals')).toBeInTheDocument();
      expect(screen.getByText('1800')).toBeInTheDocument();
      expect(screen.getByText('120g')).toBeInTheDocument();
    });

    it('renders charts', () => {
      render(<MealPlanner mealPlan={mockMealPlan} />);
      expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('displays shopping list', () => {
      render(<MealPlanner mealPlan={mockMealPlan} />);
      expect(screen.getByText('Shopping List')).toBeInTheDocument();
      expect(screen.getByText('Chicken breast - 2 lbs')).toBeInTheDocument();
      expect(screen.getByText('Oats - 1 lb')).toBeInTheDocument();
    });

    it('does not render shopping list when empty', () => {
      const planWithoutShoppingList = { ...mockMealPlan, shoppingList: [] };
      render(<MealPlanner mealPlan={planWithoutShoppingList} />);
      expect(screen.queryByText('Shopping List')).not.toBeInTheDocument();
    });
  });
});
