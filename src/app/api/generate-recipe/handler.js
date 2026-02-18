import OpenAI from 'openai';
import { withAuth } from '@/middleware/withAuth';
import { rateLimit } from '@/middleware/rateLimit';

let _openai;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

const MAX_INGREDIENTS_LENGTH = 2000;
const OPENAI_TIMEOUT_MS = 30000;
const checkRateLimit = rateLimit({ windowMs: 60_000, max: 10, name: 'generate-recipe' });

export async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (checkRateLimit(req, res)) return;

  const { ingredients } = req.body;

  if (!ingredients) {
    return res.status(400).json({ error: 'Ingredients are required' });
  }

  if (typeof ingredients !== 'string' || ingredients.trim().length === 0) {
    return res.status(400).json({ error: 'Ingredients must be a non-empty string' });
  }

  if (ingredients.length > MAX_INGREDIENTS_LENGTH) {
    return res.status(400).json({ error: `Ingredients text exceeds maximum length of ${MAX_INGREDIENTS_LENGTH} characters` });
  }

  const sanitizedIngredients = ingredients.trim();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

    let completion;
    try {
      completion = await getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional chef. Generate creative, delicious recipes based on the ingredients provided. Return the response as a JSON object with: title, ingredients (array), instructions (array), and cookTime (string).'
          },
          {
            role: 'user',
            content: `Create a recipe using these ingredients: ${sanitizedIngredients}. Return ONLY valid JSON with no markdown formatting.`
          }
        ],
        temperature: 0.8,
      }, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    let recipeText = completion.choices[0].message.content.trim();
    recipeText = recipeText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    let recipe;
    try {
      recipe = JSON.parse(recipeText);
    } catch (parseError) {
      console.error('Failed to parse recipe JSON:', recipeText);
      return res.status(502).json({ error: 'Failed to parse recipe response. Please try again.' });
    }

    return res.status(200).json({ recipe });
  } catch (error) {
    console.error('OpenAI Error:', error);

    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Recipe generation timed out. Please try again.' });
    }

    if (error.code === 'invalid_api_key') {
      return res.status(500).json({ error: 'API configuration error' });
    }

    if (error.code === 'rate_limit_exceeded') {
      return res.status(503).json({ error: 'Service temporarily busy. Please try again in a moment.' });
    }

    return res.status(500).json({ error: 'Failed to generate recipe. Please try again.' });
  }
}

export default withAuth(handler);
