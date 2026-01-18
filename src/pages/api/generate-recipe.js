/**
 * Generate Recipe API Route
 *
 * NOTE: This route is deprecated in favor of the Firebase Cloud Function
 * `generateRecipe`. Use httpsCallable(functions, 'generateRecipe') instead.
 *
 * This route is kept for backwards compatibility but should be migrated.
 */

import OpenAI from 'openai';
import { withAuth } from '@/middleware/withAuth';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ingredients } = req.body;

  if (!ingredients) {
    return res.status(400).json({ error: 'Ingredients are required' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional chef. Generate creative, delicious recipes based on the ingredients provided. Return the response as a JSON object with: title, ingredients (array), instructions (array), and cookTime (string).'
        },
        {
          role: 'user',
          content: `Create a recipe using these ingredients: ${ingredients}. Return ONLY valid JSON with no markdown formatting.`
        }
      ],
      temperature: 0.8,
    });

    let recipeText = completion.choices[0].message.content.trim();

    // Remove markdown code blocks if present
    recipeText = recipeText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const recipe = JSON.parse(recipeText);

    res.status(200).json({ recipe });
  } catch (error) {
    console.error('OpenAI Error:', error);
    res.status(500).json({ error: 'Failed to generate recipe' });
  }
}

// Require authentication - users must be signed in to generate recipes
export default withAuth(handler);
