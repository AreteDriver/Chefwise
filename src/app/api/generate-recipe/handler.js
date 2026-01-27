import OpenAI from 'openai';
import { withAuth } from '@/middleware/withAuth';

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

export async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ingredients } = req.body;

  if (!ingredients) {
    return res.status(400).json({ error: 'Ingredients are required' });
  }

  try {
    const completion = await getOpenAI().chat.completions.create({
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
    recipeText = recipeText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const recipe = JSON.parse(recipeText);

    return res.status(200).json({ recipe });
  } catch (error) {
    console.error('OpenAI Error:', error);
    return res.status(500).json({ error: 'Failed to generate recipe' });
  }
}

export default withAuth(handler);
