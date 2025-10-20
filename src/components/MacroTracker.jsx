import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * MacroTracker Component - Display and track daily macros
 * @param {Object} props
 * @param {Object} props.dailyMacros - Current day's macros
 * @param {Object} props.macroGoals - User's macro goals
 */
export default function MacroTracker({ dailyMacros = {}, macroGoals = {} }) {
  const defaultMacros = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  };

  const defaultGoals = {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
    fiber: 25,
    sugar: 50,
    sodium: 2300,
  };

  const current = { ...defaultMacros, ...dailyMacros };
  const goals = { ...defaultGoals, ...macroGoals };

  const calculatePercentage = (current, goal) => {
    if (!goal) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const macroItems = [
    { label: 'Protein', value: current.protein, goal: goals.protein, unit: 'g', color: '#10B981' },
    { label: 'Carbs', value: current.carbs, goal: goals.carbs, unit: 'g', color: '#F59E0B' },
    { label: 'Fat', value: current.fat, goal: goals.fat, unit: 'g', color: '#EC4899' },
  ];

  const chartData = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [
      {
        label: 'Current',
        data: [current.protein, current.carbs, current.fat],
        backgroundColor: '#10B981',
      },
      {
        label: 'Goal',
        data: [goals.protein, goals.carbs, goals.fat],
        backgroundColor: '#E5E7EB',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Daily Macro Tracker</h2>

      {/* Calories Section */}
      <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Calories</h3>
          <span className="text-2xl font-bold">
            {current.calories} / {goals.calories}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary h-3 rounded-full transition-all duration-300"
            style={{ width: `${calculatePercentage(current.calories, goals.calories)}%` }}
          />
        </div>
      </div>

      {/* Macros Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {macroItems.map((macro) => (
          <div key={macro.label} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">{macro.label}</span>
              <span className="text-sm text-gray-500">
                {macro.value} / {macro.goal}{macro.unit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${calculatePercentage(macro.value, macro.goal)}%`,
                  backgroundColor: macro.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Macros vs Goals</h3>
        <Bar data={chartData} options={chartOptions} />
      </div>

      {/* Additional Nutrients */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-3">Other Nutrients</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Fiber</div>
            <div className="text-lg font-semibold">
              {current.fiber} / {goals.fiber}g
            </div>
            <div className="text-xs text-gray-500">
              {Math.round(calculatePercentage(current.fiber, goals.fiber))}%
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Sugar</div>
            <div className="text-lg font-semibold">
              {current.sugar} / {goals.sugar}g
            </div>
            <div className="text-xs text-gray-500">
              {Math.round(calculatePercentage(current.sugar, goals.sugar))}%
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Sodium</div>
            <div className="text-lg font-semibold">
              {current.sodium} / {goals.sodium}mg
            </div>
            <div className="text-xs text-gray-500">
              {Math.round(calculatePercentage(current.sodium, goals.sodium))}%
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-900">
          {current.calories >= goals.calories * 0.9 && current.calories <= goals.calories * 1.1
            ? '✓ You\'re on track with your calorie goals!'
            : current.calories < goals.calories * 0.9
            ? '⚠ You might want to add more calories to meet your goals.'
            : '⚠ You\'ve exceeded your calorie goal for today.'}
        </p>
      </div>
    </div>
  );
}
