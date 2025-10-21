import { useRouter } from 'next/router';
import PantryInventory from '@/components/PantryInventory';
import useOpenAI from '@/hooks/useOpenAI';

export default function PantryPage({ user }) {
  const router = useRouter();
  const { generateRecipe } = useOpenAI();

  if (!user) {
    router.push('/');
    return null;
  }

  const handleSuggestRecipes = async (items) => {
    const ingredients = items.map(item => item.name);
    try {
      await generateRecipe({
        dietType: 'general',
        ingredients,
        preferences: {},
      });
      router.push('/');
    } catch (error) {
      console.error('Error suggesting recipes:', error);
    }
  };

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
        <PantryInventory
          userId={user.uid}
          onSuggestRecipes={handleSuggestRecipes}
        />
      </main>
    </div>
  );
}
