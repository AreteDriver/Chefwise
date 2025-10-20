import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebaseConfig';
import { getUserPlanTier } from '@/utils/SubscriptionGate';
import RecipeCard from '@/components/RecipeCard';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import useOpenAI from '@/hooks/useOpenAI';

export default function Home({ user }) {
  const router = useRouter();
  const [planTier, setPlanTier] = useState('free');
  const [prompt, setPrompt] = useState('');
  const [selectedDiet, setSelectedDiet] = useState('');
  const { loading, error, result, generateRecipe } = useOpenAI();

  useEffect(() => {
    if (user) {
      getUserPlanTier(user.uid).then(setPlanTier);
    }
  }, [user]);

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Create user profile if it doesn't exist
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', result.user.uid), {
          email: result.user.email,
          displayName: result.user.displayName,
          planTier: 'free',
          createdAt: new Date().toISOString(),
          dailyUsage: {},
          preferences: {},
        });
      }
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleGenerateRecipe = async () => {
    if (!user) {
      alert('Please sign in to generate recipes');
      return;
    }

    if (!prompt.trim()) {
      alert('Please enter ingredients or a recipe idea');
      return;
    }

    try {
      await generateRecipe({
        dietType: selectedDiet || 'general',
        ingredients: prompt.split(',').map(i => i.trim()),
        preferences: {},
      });
    } catch (err) {
      console.error('Error generating recipe:', err);
    }
  };

  const dietOptions = [
    { value: '', label: 'Any Diet' },
    { value: 'mediterranean', label: 'Mediterranean' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'keto', label: 'Keto' },
    { value: 'paleo', label: 'Paleo' },
    { value: 'low-fat', label: 'Low Fat' },
    { value: 'low-sugar', label: 'Low Sugar' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">ChefWise</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <button
                    onClick={() => router.push('/pantry')}
                    className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Pantry
                  </button>
                  <button
                    onClick={() => router.push('/planner')}
                    className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Planner
                  </button>
                  <button
                    onClick={() => router.push('/tracker')}
                    className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Tracker
                  </button>
                  <button
                    onClick={() => router.push('/profile')}
                    className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Sign In with Google
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user && (
          <SubscriptionBanner
            isPremium={planTier === 'premium'}
            onUpgrade={() => router.push('/upgrade')}
          />
        )}

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Your AI Cooking Assistant
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Generate personalized recipes, plan your meals, and track your nutrition with AI-powered assistance
          </p>
        </div>

        {/* Recipe Generator */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Generate a Recipe</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diet Type
              </label>
              <select
                value={selectedDiet}
                onChange={(e) => setSelectedDiet(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {dietOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingredients or Recipe Idea
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter ingredients (comma-separated) or describe the dish you want..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
              />
            </div>

            <button
              onClick={handleGenerateRecipe}
              disabled={loading || !user}
              className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Recipe'}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Recipe Result */}
        {result && (
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Your Recipe</h3>
            <RecipeCard
              recipe={result}
              onSave={(recipe) => console.log('Save recipe:', recipe)}
              onClick={() => router.push(`/recipe/${result.id || 'preview'}`)}
            />
          </div>
        )}

        {/* Features Grid */}
        {!user && (
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Recipe Generation</h3>
              <p className="text-gray-600">Get personalized recipes based on your ingredients and preferences</p>
            </div>

            <div className="text-center">
              <div className="bg-secondary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Meal Planning</h3>
              <p className="text-gray-600">Plan your weekly meals with macro tracking and shopping lists</p>
            </div>

            <div className="text-center">
              <div className="bg-accent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Nutrition Tracking</h3>
              <p className="text-gray-600">Monitor your daily macros and meet your health goals</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
