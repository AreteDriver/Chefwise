import React, { useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

/**
 * MealPlanner Component - Displays weekly meal plan with charts
 * @param {Object} props
 * @param {Object} props.mealPlan - Meal plan data
 * @param {Function} props.onGeneratePlan - Generate plan callback
 */
export default function MealPlanner({ mealPlan, onGeneratePlan }) {
  const [selectedDay, setSelectedDay] = useState(0);

  if (!mealPlan || !mealPlan.days || mealPlan.days.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Meal Planner</h2>
        <p className="text-gray-600 mb-6">
          Generate a personalized meal plan based on your dietary preferences and macro goals.
        </p>
        <button
          onClick={onGeneratePlan}
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Generate Meal Plan
        </button>
      </div>
    );
  }

  const currentDay = mealPlan.days[selectedDay];
  const macroData = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [
      {
        data: [
          currentDay.dailyTotals.protein,
          currentDay.dailyTotals.carbs,
          currentDay.dailyTotals.fat,
        ],
        backgroundColor: ['#10B981', '#F59E0B', '#EC4899'],
        borderWidth: 0,
      },
    ],
  };

  const weeklyCalories = {
    labels: mealPlan.days.map((d) => `Day ${d.day}`),
    datasets: [
      {
        label: 'Calories',
        data: mealPlan.days.map((d) => d.dailyTotals.calories),
        backgroundColor: '#10B981',
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Your Meal Plan</h2>
        
        {/* Day selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {mealPlan.days.map((day, index) => (
            <button
              key={day.day}
              onClick={() => setSelectedDay(index)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedDay === index
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Day {day.day}
            </button>
          ))}
        </div>
      </div>

      {/* Meals for selected day */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">
          {new Date(currentDay.date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </h3>
        
        <div className="space-y-4">
          {currentDay.meals.map((meal, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs font-semibold text-primary uppercase">
                    {meal.type}
                  </span>
                  <h4 className="text-lg font-semibold">{meal.title}</h4>
                </div>
                <div className="text-sm text-gray-600">
                  {meal.macros.calories} cal
                </div>
              </div>
              
              <div className="flex gap-4 text-sm text-gray-600">
                <span>P: {meal.macros.protein}g</span>
                <span>C: {meal.macros.carbs}g</span>
                <span>F: {meal.macros.fat}g</span>
              </div>

              {meal.ingredients && (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Ingredients: </span>
                  {meal.ingredients.slice(0, 3).join(', ')}
                  {meal.ingredients.length > 3 && '...'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Daily totals */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-semibold mb-2">Daily Totals</h4>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Calories</div>
            <div className="text-lg font-bold">{currentDay.dailyTotals.calories}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Protein</div>
            <div className="text-lg font-bold">{currentDay.dailyTotals.protein}g</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Carbs</div>
            <div className="text-lg font-bold">{currentDay.dailyTotals.carbs}g</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Fat</div>
            <div className="text-lg font-bold">{currentDay.dailyTotals.fat}g</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold mb-3 text-center">Macro Distribution</h4>
          <div className="max-w-xs mx-auto">
            <Doughnut data={macroData} />
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-center">Weekly Calories</h4>
          <Bar
            data={weeklyCalories}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
              },
            }}
          />
        </div>
      </div>

      {/* Shopping list */}
      {mealPlan.shoppingList && mealPlan.shoppingList.length > 0 && (
        <div className="mt-6 border-t pt-6">
          <h4 className="font-semibold mb-3">Shopping List</h4>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
            {mealPlan.shoppingList.map((item, index) => (
              <div key={index} className="flex items-center text-sm">
                <input type="checkbox" className="mr-2" />
                <span>{item.item} - {item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
