import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/firebaseConfig';
import { useSubscription } from '@/contexts/SubscriptionContext';
import RecipeCard from '@/components/RecipeCard';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import MainLayout from '@/components/MainLayout';
import useOpenAI from '@/hooks/useOpenAI';
import { trackFeatureUsage } from '@/utils/analytics';

export default function Home({ user }) {
  const router = useRouter();
  const subscription = useSubscription();
  const [prompt, setPrompt] = useState('');
  const [selectedDiet, setSelectedDiet] = useState('');
  const { loading, error, result, generateRecipe } = useOpenAI();

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
      // Track feature usage
      trackFeatureUsage('recipe_generation', subscription.planTier);
      
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
    <MainLayout user={user} currentPage="home">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sign In Section for Non-Authenticated Users */}
        {!user && (
          <div className="text-center mb-8">
            <button
              onClick={handleSignIn}
              className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors text-lg font-semibold"
            >
              Sign In with Google to Get Started
            </button>
          </div>
        )}

        {user && (
          <SubscriptionBanner
            isPremium={subscription.isPremium}
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
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-left">
                <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">AI Recipe Generation</p>
                  <p className="text-sm text-gray-600">Personalized recipes from your pantry</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-left">
                <div className="bg-secondary/10 rounded-full p-2 flex-shrink-0">
                  <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Meal Planning</p>
                  <p className="text-sm text-gray-600">Weekly plans with macro tracking</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-left">
                <div className="bg-accent/10 rounded-full p-2 flex-shrink-0">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Nutrition Tracking</p>
                  <p className="text-sm text-gray-600">Monitor daily macros and goals</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSignIn}
              className="w-full bg-primary text-white py-3 px-6 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign In with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

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
      </div>
    </MainLayout>
  );
}
