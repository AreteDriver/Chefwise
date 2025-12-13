import { useState } from 'react';
import { useRouter } from 'next/router';
import TabLayout from '@/components/TabLayout';
import MacroTracker from '@/components/MacroTracker';
import MainLayout from '@/components/MainLayout';

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
    <MainLayout user={user} currentPage="tracker">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MacroTracker
          dailyMacros={dailyMacros}
          macroGoals={macroGoals}
        />
      </div>
    </MainLayout>
  );
}
