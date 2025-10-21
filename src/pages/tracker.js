import { useState } from 'react';
import { useRouter } from 'next/router';
import MacroTracker from '@/components/MacroTracker';

export default function TrackerPage({ user }) {
  const router = useRouter();
  const [dailyMacros] = useState({
    calories: 1650,
    protein: 125,
    carbs: 165,
    fat: 55,
    fiber: 18,
    sugar: 32,
    sodium: 1800,
  });

  const [macroGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
    fiber: 25,
    sugar: 50,
    sodium: 2300,
  });

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.push('/')}
              className="text-2xl font-bold text-primary"
            >
              ChefWise
            </button>
            <button
              onClick={() => router.push('/')}
              className="text-gray-700 hover:text-primary"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MacroTracker
          dailyMacros={dailyMacros}
          macroGoals={macroGoals}
        />
      </main>
    </div>
  );
}
