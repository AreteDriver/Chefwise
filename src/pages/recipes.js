import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '@/components/MainLayout';
import RecipeCard from '@/components/RecipeCard';
import { getUserRecipes, searchRecipes, deleteRecipe } from '@/utils/offline/recipeService';
import { useNetworkStatus } from '@/contexts/NetworkStatusContext';

export default function RecipesPage({ user }) {
  const router = useRouter();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { isOnline } = useNetworkStatus();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    const loadRecipes = async () => {
      if (loadedRef.current) return;
      loadedRef.current = true;

      try {
        const userRecipes = await getUserRecipes(user.uid);
        setRecipes(userRecipes);
      } catch (error) {
        console.error('Error loading recipes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, [user, router]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    setLoading(true);

    try {
      if (query.trim()) {
        const results = await searchRecipes(user.uid, query);
        setRecipes(results);
      } else {
        const userRecipes = await getUserRecipes(user.uid);
        setRecipes(userRecipes);
      }
    } catch (error) {
      console.error('Error searching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recipeId) => {
    try {
      await deleteRecipe(recipeId);
      setRecipes(recipes.filter(r => r.id !== recipeId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <MainLayout user={user} currentPage="recipes">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Recipes</h1>
          <p className="text-gray-600">
            Your saved recipes are stored locally for offline access
          </p>
        </div>

        {/* Offline indicator */}
        {!isOnline && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-700">
              You're offline. Showing cached recipes from your device.
            </span>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search recipes by name, tag, or ingredient..."
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading recipes...</p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            {searchQuery ? (
              <>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No recipes found</h3>
                <p className="text-gray-500">Try a different search term</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No saved recipes yet</h3>
                <p className="text-gray-500 mb-4">Generate recipes from your pantry to save them here</p>
                <button
                  onClick={() => router.push('/pantry')}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Go to Pantry
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} saved
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="relative">
                  <RecipeCard
                    recipe={recipe}
                    onClick={() => router.push(`/recipe/${recipe.id}`)}
                  />
                  {/* Delete button */}
                  <button
                    onClick={() => setDeleteConfirm(recipe.id)}
                    className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                    aria-label="Delete recipe"
                  >
                    <svg
                      className="w-5 h-5 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                  {/* Saved date */}
                  <div className="absolute bottom-4 left-4 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
                    Saved {new Date(recipe.savedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-2">Delete Recipe?</h3>
              <p className="text-gray-600 mb-4">
                This will remove the recipe from your saved recipes. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
