import { useRouter } from 'next/router';
import TabLayout from '@/components/TabLayout';
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
    <TabLayout user={user} activeTab="pantry">
      <PantryInventory
        userId={user.uid}
        onSuggestRecipes={handleSuggestRecipes}
      />
    </TabLayout>
  );
}
