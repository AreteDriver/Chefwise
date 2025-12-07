import { useState } from 'react';
import { useRouter } from 'next/router';
import TabLayout from '@/components/TabLayout';
import MealPlanner from '@/components/MealPlanner';
import useOpenAI from '@/hooks/useOpenAI';

export default function PlannerPage({ user }) {
  const router = useRouter();
  const [mealPlan, setMealPlan] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [macroGoals, setMacroGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
  });
  const [days, setDays] = useState(7);
  const { generateMealPlan, loading } = useOpenAI();

  if (!user) {
    router.push('/');
    return null;
  }

  const handleGeneratePlan = async () => {
    try {
      const plan = await generateMealPlan({
        days,
        macroGoals,
        preferences: {},
      });
      setMealPlan(plan);
      setShowForm(false);
    } catch (error) {
      console.error('Error generating meal plan:', error);
    }
  };

  return (
    <TabLayout user={user} activeTab="planner">
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Meal Plan Settings</h3>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Days
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Calories
              </label>
              <input
                type="number"
                value={macroGoals.calories}
                onChange={(e) => setMacroGoals({ ...macroGoals, calories: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Protein (g)
              </label>
              <input
                type="number"
                value={macroGoals.protein}
                onChange={(e) => setMacroGoals({ ...macroGoals, protein: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Carbs (g)
              </label>
              <input
                type="number"
                value={macroGoals.carbs}
                onChange={(e) => setMacroGoals({ ...macroGoals, carbs: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fat (g)
              </label>
              <input
                type="number"
                value={macroGoals.fat}
                onChange={(e) => setMacroGoals({ ...macroGoals, fat: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGeneratePlan}
              disabled={loading}
              className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:bg-gray-300"
            >
              {loading ? 'Generating...' : 'Generate Plan'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <MealPlanner
        mealPlan={mealPlan}
        onGeneratePlan={() => setShowForm(true)}
      />
    </TabLayout>
  );
}
