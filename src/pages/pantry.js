import { useRouter } from 'next/router';
import PantryInventory from '@/components/PantryInventory';
import MainLayout from '@/components/MainLayout';
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
    <MainLayout user={user} currentPage="pantry">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PantryInventory
          userId={user.uid}
          onSuggestRecipes={handleSuggestRecipes}
        />
      </div>
    </MainLayout>
  );
}
