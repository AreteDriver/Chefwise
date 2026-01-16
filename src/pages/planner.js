import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import MealPlanner from '@/components/MealPlanner';
import MainLayout from '@/components/MainLayout';
import useOpenAI from '@/hooks/useOpenAI';
import { useNetworkStatus } from '@/contexts/NetworkStatusContext';

export default function PlannerPage({ user }) {
  const router = useRouter();
  const [mealPlan, setMealPlan] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [macroGoals, setMacroGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
  });
  const [days, setDays] = useState(7);
  const { generateMealPlan, loadCachedMealPlan, loading } = useOpenAI();
  const { isOnline } = useNetworkStatus();
  const cacheLoadedRef = useRef(false);

  // Load cached meal plan on mount
  useEffect(() => {
    if (user && !cacheLoadedRef.current) {
      cacheLoadedRef.current = true;
      loadCachedMealPlan(user.uid).then((cached) => {
        if (cached) {
          setMealPlan(cached);
          setIsFromCache(true);
        }
      });
    }
  }, [user, loadCachedMealPlan]);

  if (!user) {
    router.push('/');
    return null;
  }

  const maxDays = 14;

  const handleGeneratePlan = async () => {
    if (days > maxDays) {
      alert(`Please select up to ${maxDays} days.`);
      return;
    }

    if (!isOnline) {
      alert('You are offline. Please connect to the internet to generate a new meal plan.');
      return;
    }

    try {
      const plan = await generateMealPlan({
        days,
        macroGoals,
        preferences: {},
        userId: user.uid,
      });
      setMealPlan(plan);
      setIsFromCache(false);
      setShowForm(false);
    } catch (error) {
      console.error('Error generating meal plan:', error);
    }
  };

  return (
    <MainLayout user={user} currentPage="planner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <p className="text-sm text-gray-500 mt-1">
                  Your plan allows up to {maxDays} days
                  {days > maxDays && (
                    <span className="text-primary font-medium">
                      {' '}(Upgrade for longer plans)
                    </span>
                  )}
                </p>
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

        {isFromCache && mealPlan && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-700">
              Showing your saved meal plan. {isOnline ? 'Generate a new plan to update.' : 'Connect to the internet to generate a new plan.'}
            </span>
          </div>
        )}

        <MealPlanner
          mealPlan={mealPlan}
          onGeneratePlan={() => setShowForm(true)}
        />
      </div>
    </MainLayout>
  );
}
