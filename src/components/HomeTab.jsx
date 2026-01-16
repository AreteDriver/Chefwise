import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import useOpenAI from '@/hooks/useOpenAI';
import RecipeCard from './RecipeCard';
import { saveRecipe } from '@/utils/offline/recipeService';

const MAX_PANTRY_ITEMS_TO_LOAD = 10;
const MAX_PANTRY_ITEMS_TO_DISPLAY = 5;

const HomeTab = ({ user }) => {
  const router = useRouter();
  const [pantryItems, setPantryItems] = useState([]);
  const [loadingPantry, setLoadingPantry] = useState(false);
  const [recipeSaved, setRecipeSaved] = useState(false);
  const { loading, error, result, generateRecipe } = useOpenAI();

  // Reset saved state when a new recipe is generated
  useEffect(() => {
    setRecipeSaved(false);
  }, [result]);

  useEffect(() => {
    const loadPantryItems = async () => {
      if (!user) return;
      
      setLoadingPantry(true);
      try {
        const q = query(
          collection(db, 'pantryItems'),
          where('userId', '==', user.uid),
          limit(MAX_PANTRY_ITEMS_TO_LOAD)
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPantryItems(items);
      } catch (error) {
        console.error('Error loading pantry items:', error);
      } finally {
        setLoadingPantry(false);
      }
    };

    if (user) {
      loadPantryItems();
    }
  }, [user]);

  const handleFindRecipesFromPantry = async () => {
    if (!user) {
      alert('Please sign in to generate recipes');
      return;
    }

    if (pantryItems.length === 0) {
      router.push('/pantry');
      return;
    }

    const ingredients = pantryItems.map(item => item.name);
    try {
      await generateRecipe({
        dietType: 'general',
        ingredients,
        preferences: {},
        userId: user.uid,
      });
    } catch (err) {
      console.error('Error generating recipe:', err);
    }
  };

  const handleQuickPick = async (category) => {
    if (!user) {
      alert('Please sign in to generate recipes');
      return;
    }

    let prompt = '';
    let dietType = 'general';

    switch (category) {
      case 'quick':
        prompt = 'a quick meal that takes less than 30 minutes to prepare';
        break;
      case 'high-protein':
        prompt = 'a high protein dish with at least 30g of protein per serving';
        dietType = 'high-protein';
        break;
      case 'low-carb':
        prompt = 'a low carb meal with less than 20g of carbs per serving';
        dietType = 'keto';
        break;
      case 'vegetarian':
        prompt = 'a delicious vegetarian meal';
        dietType = 'vegetarian';
        break;
      case 'comfort-food':
        prompt = 'a comfort food dish that is satisfying and hearty';
        break;
      case 'healthy':
        prompt = 'a healthy balanced meal with vegetables and lean protein';
        break;
      default:
        prompt = 'a delicious meal';
    }

    try {
      await generateRecipe({
        dietType,
        ingredients: [prompt],
        preferences: {},
        userId: user.uid,
      });
    } catch (err) {
      console.error('Error generating recipe:', err);
    }
  };

  const handleSaveRecipe = async (recipe) => {
    if (!user || recipeSaved) return;

    try {
      await saveRecipe(user.uid, recipe);
      setRecipeSaved(true);
    } catch (err) {
      console.error('Error saving recipe:', err);
    }
  };

  const quickPickCategories = [
    {
      id: 'quick',
      title: 'Quick Meals',
      description: 'Under 30 minutes',
      icon: '⚡',
      color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    },
    {
      id: 'high-protein',
      title: 'High Protein',
      description: '30g+ protein',
      icon: '💪',
      color: 'bg-red-100 text-red-700 border-red-300',
    },
    {
      id: 'low-carb',
      title: 'Low Carb',
      description: 'Keto friendly',
      icon: '🥑',
      color: 'bg-green-100 text-green-700 border-green-300',
    },
    {
      id: 'vegetarian',
      title: 'Vegetarian',
      description: 'Plant-based',
      icon: '🥗',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    },
    {
      id: 'comfort-food',
      title: 'Comfort Food',
      description: 'Hearty & satisfying',
      icon: '🍲',
      color: 'bg-orange-100 text-orange-700 border-orange-300',
    },
    {
      id: 'healthy',
      title: 'Healthy Balance',
      description: 'Nutritious & light',
      icon: '🥙',
      color: 'bg-blue-100 text-blue-700 border-blue-300',
    },
  ];

  const userName = user?.displayName?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6">
      {/* Greeting Section */}
      <div className="bg-gradient-to-r from-primary to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Hey {userName}, what's for dinner tonight?
        </h1>
        <p className="text-emerald-50 text-sm md:text-base">
          Let's find the perfect recipe for you
        </p>
      </div>

      {/* Big CTA - Find Recipes from Pantry */}
      <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-primary/20">
        <div className="flex items-start gap-4 mb-4">
          <div className="bg-primary/10 rounded-full p-3 flex-shrink-0">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Find Recipes Based on Your Pantry
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              {pantryItems.length > 0
                ? `Use your ${pantryItems.length} pantry item${pantryItems.length > 1 ? 's' : ''} to create something delicious`
                : 'Add items to your pantry to get personalized recipe suggestions'}
            </p>
            {loadingPantry && (
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Loading pantry items...
              </div>
            )}
            {pantryItems.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {pantryItems.slice(0, MAX_PANTRY_ITEMS_TO_DISPLAY).map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                  >
                    {item.name}
                  </span>
                ))}
                {pantryItems.length > MAX_PANTRY_ITEMS_TO_DISPLAY && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    +{pantryItems.length - MAX_PANTRY_ITEMS_TO_DISPLAY} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleFindRecipesFromPantry}
          disabled={loading}
          className="w-full bg-primary text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Generating Recipe...
            </span>
          ) : pantryItems.length > 0 ? (
            '🍳 Generate Recipe from My Pantry'
          ) : (
            '📝 Add Pantry Items First'
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Recipe Result */}
      {result && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-gray-900">Your Recipe</h3>
            {recipeSaved && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Saved to My Recipes
              </span>
            )}
          </div>
          <RecipeCard
            recipe={result}
            onSave={recipeSaved ? null : handleSaveRecipe}
            onClick={() => router.push(`/recipe/${result.id || 'preview'}`)}
          />
        </div>
      )}

      {/* Quick Picks Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Picks</h2>
        <p className="text-gray-600 mb-6">
          Browse by category and get instant recipe suggestions
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickPickCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleQuickPick(category.id)}
              disabled={loading}
              className={`${category.color} border-2 rounded-2xl p-4 text-left transition-all hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="text-3xl mb-2">{category.icon}</div>
              <h3 className="font-bold text-sm mb-1">{category.title}</h3>
              <p className="text-xs opacity-80">{category.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeTab;
