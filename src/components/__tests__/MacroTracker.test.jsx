import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MacroTracker from '../MacroTracker';

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
}));

describe('MacroTracker', () => {
  describe('Default values', () => {
    it('renders with default goals when none provided', () => {
      render(<MacroTracker />);

      expect(screen.getByText('Daily Macro Tracker')).toBeInTheDocument();
      expect(screen.getByText('0 / 2000')).toBeInTheDocument(); // Default calories
    });

    it('uses default macro goals', () => {
      render(<MacroTracker />);

      expect(screen.getByText('0 / 150g')).toBeInTheDocument(); // Protein
      expect(screen.getByText('0 / 200g')).toBeInTheDocument(); // Carbs
      expect(screen.getByText('0 / 65g')).toBeInTheDocument(); // Fat
    });
  });

  describe('With custom values', () => {
    const dailyMacros = {
      calories: 1500,
      protein: 100,
      carbs: 150,
      fat: 50,
      fiber: 20,
      sugar: 30,
      sodium: 1500,
    };

    const macroGoals = {
      calories: 2000,
      protein: 150,
      carbs: 200,
      fat: 65,
      fiber: 25,
      sugar: 50,
      sodium: 2300,
    };

    it('displays current calories vs goal', () => {
      render(<MacroTracker dailyMacros={dailyMacros} macroGoals={macroGoals} />);
      expect(screen.getByText('1500 / 2000')).toBeInTheDocument();
    });

    it('displays macro values', () => {
      render(<MacroTracker dailyMacros={dailyMacros} macroGoals={macroGoals} />);

      expect(screen.getByText('100 / 150g')).toBeInTheDocument();
      expect(screen.getByText('150 / 200g')).toBeInTheDocument();
      expect(screen.getByText('50 / 65g')).toBeInTheDocument();
    });

    it('displays other nutrients', () => {
      render(<MacroTracker dailyMacros={dailyMacros} macroGoals={macroGoals} />);

      expect(screen.getByText('20 / 25g')).toBeInTheDocument(); // Fiber
      expect(screen.getByText('30 / 50g')).toBeInTheDocument(); // Sugar
      expect(screen.getByText('1500 / 2300mg')).toBeInTheDocument(); // Sodium
    });
  });

  describe('Progress bars', () => {
    it('renders calorie progress bar', () => {
      const { container } = render(
        <MacroTracker
          dailyMacros={{ calories: 1000 }}
          macroGoals={{ calories: 2000 }}
        />
      );

      // Progress bar should be at 50%
      const progressBars = container.querySelectorAll('.bg-primary.h-3');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('caps progress at 100%', () => {
      const { container } = render(
        <MacroTracker
          dailyMacros={{ calories: 3000 }}
          macroGoals={{ calories: 2000 }}
        />
      );

      // Check that progress bar doesn't exceed container
      const progressBar = container.querySelector('.bg-primary.h-3');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });
  });

  describe('Chart', () => {
    it('renders the bar chart', () => {
      render(<MacroTracker />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('displays chart title', () => {
      render(<MacroTracker />);
      expect(screen.getByText('Macros vs Goals')).toBeInTheDocument();
    });
  });

  describe('Summary messages', () => {
    it('shows on-track message when calories are within range', () => {
      render(
        <MacroTracker
          dailyMacros={{ calories: 1950 }}
          macroGoals={{ calories: 2000 }}
        />
      );

      expect(screen.getByText(/on track with your calorie goals/)).toBeInTheDocument();
    });

    it('shows under message when calories are too low', () => {
      render(
        <MacroTracker
          dailyMacros={{ calories: 1000 }}
          macroGoals={{ calories: 2000 }}
        />
      );

      expect(screen.getByText(/add more calories/)).toBeInTheDocument();
    });

    it('shows over message when calories exceed goal', () => {
      render(
        <MacroTracker
          dailyMacros={{ calories: 2500 }}
          macroGoals={{ calories: 2000 }}
        />
      );

      expect(screen.getByText(/exceeded your calorie goal/)).toBeInTheDocument();
    });
  });

  describe('Section headers', () => {
    it('renders all section headers', () => {
      render(<MacroTracker />);

      expect(screen.getByText('Daily Macro Tracker')).toBeInTheDocument();
      expect(screen.getByText('Calories')).toBeInTheDocument();
      expect(screen.getByText('Macros vs Goals')).toBeInTheDocument();
      expect(screen.getByText('Other Nutrients')).toBeInTheDocument();
    });
  });

  describe('Macro labels', () => {
    it('renders all macro labels', () => {
      render(<MacroTracker />);

      expect(screen.getByText('Protein')).toBeInTheDocument();
      expect(screen.getByText('Carbs')).toBeInTheDocument();
      expect(screen.getByText('Fat')).toBeInTheDocument();
      expect(screen.getByText('Fiber')).toBeInTheDocument();
      expect(screen.getByText('Sugar')).toBeInTheDocument();
      expect(screen.getByText('Sodium')).toBeInTheDocument();
    });
  });

  describe('Percentage display', () => {
    it('displays percentages for other nutrients', () => {
      render(
        <MacroTracker
          dailyMacros={{ fiber: 12, sugar: 25, sodium: 1150 }}
          macroGoals={{ fiber: 25, sugar: 50, sodium: 2300 }}
        />
      );

      expect(screen.getByText('48%')).toBeInTheDocument(); // Fiber: 12/25
      // Sugar and Sodium both show 50%
      const fiftyPercentElements = screen.getAllByText('50%');
      expect(fiftyPercentElements.length).toBe(2);
    });
  });
});
