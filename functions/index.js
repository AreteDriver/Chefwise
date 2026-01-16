const functions = require('firebase-functions');
const admin = require('firebase-admin');
const OpenAI = require('openai');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

admin.initializeApp();

// Initialize OpenAI with error handling
let openai;
try {
  const apiKey = functions.config().openai?.key || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OpenAI API key not configured. AI features will be disabled.');
  } else {
    openai = new OpenAI({
      apiKey: apiKey,
    });
  }
} catch (error) {
  console.error('Failed to initialize OpenAI:', error);
}

// Constants
const MAX_MEAL_PLAN_DAYS = 30;
const DEFAULT_MAX_RECIPES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Check if user can perform action based on plan tier
 */
async function checkPlanTier(userId, feature) {
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }

  const userData = userDoc.data();
  const planTier = userData.planTier || 'free';

  if (feature === 'generateRecipe') {
    const today = new Date().toISOString().split('T')[0];
    const usageToday = userData.dailyUsage?.[today] || 0;
    const limit = planTier === 'free' ? 2 : Infinity;

    if (usageToday >= limit) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Daily limit reached. Upgrade to premium for unlimited recipes.'
      );
    }

    // Increment usage
    await admin.firestore().collection('users').doc(userId).update({
      [`dailyUsage.${today}`]: admin.firestore.FieldValue.increment(1),
    });
  }

  return true;
}

/**
 * Build recipe generation prompt with comprehensive dietary handling
 */
function buildRecipePrompt(dietType, ingredients, preferences = {}) {
  const {
    allergies = [],
    servings = 4,
    cookTime,
    difficulty,
    cuisine,
    restrictions = [],
    pantryContents = [],
  } = preferences;

  // Combine pantry contents with provided ingredients
  const allIngredients = [...new Set([...ingredients, ...(pantryContents ?? [])])];

  return `
Generate a healthy ${dietType} recipe using the following ingredients: ${allIngredients.join(', ')}.

Requirements:
${allergies.length > 0 ? `- MUST avoid these allergens: ${allergies.join(', ')}` : ''}
${restrictions.length > 0 ? `- MUST follow these dietary restrictions: ${restrictions.join(', ')}` : ''}
- Servings: ${servings}
${cookTime ? `- Target total time (prep + cook): ${cookTime} minutes or less` : ''}
${difficulty ? `- Difficulty level: ${difficulty}` : ''}
${cuisine ? `- Cuisine type: ${cuisine}` : ''}
${pantryContents.length > 0 ? `- Prioritize using these pantry items: ${pantryContents.join(', ')}` : ''}

Return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "title": "Recipe name",
  "description": "Brief description",
  "ingredients": [
    {"item": "ingredient name", "amount": "quantity", "unit": "measurement"}
  ],
  "steps": ["step 1", "step 2", ...],
  "prepTime": number (in minutes),
  "cookTime": number (in minutes),
  "servings": number,
  "difficulty": "easy/medium/hard",
  "macros": {
    "calories": number,
    "protein": number (grams),
    "carbs": number (grams),
    "fat": number (grams),
    "fiber": number (grams),
    "sugar": number (grams),
    "sodium": number (mg)
  },
  "tags": ["tag1", "tag2", ...]
}
`;
}

/**
 * Parse AI response and extract JSON
 */
function parseAIResponse(responseText) {
  try {
    // Remove markdown code blocks if present
    let cleanedText = responseText.trim();
    const jsonMatch = cleanedText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      cleanedText = jsonMatch[1];
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '');
    }
    
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Invalid JSON response from AI');
  }
}

/**
 * Generate recipe using OpenAI with enhanced error handling
 */
exports.generateRecipe = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Validate OpenAI availability
  if (!openai) {
    throw new functions.https.HttpsError('unavailable', 'AI service is not configured');
  }

  const userId = context.auth.uid;
  
  // Check plan tier
  await checkPlanTier(userId, 'generateRecipe');

  // Validate input
  const { dietType, ingredients, preferences } = data;
  
  if (!dietType || !ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'dietType and ingredients array are required');
  }

  try {
    const prompt = buildRecipePrompt(dietType, ingredients, preferences);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional chef and nutritionist. Always respond with valid JSON only, no markdown formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const recipeText = completion.choices[0].message.content;
    const recipe = parseAIResponse(recipeText);

    // Validate recipe structure
    if (!recipe.title || !recipe.ingredients || !recipe.steps) {
      throw new Error('Invalid recipe structure from AI');
    }

    // Save recipe to user's collection
    const recipeRef = await admin.firestore().collection('recipes').add({
      ...recipe,
      userId,
      dietType,
      sourceIngredients: ingredients,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      ...recipe,
      id: recipeRef.id,
    };
  } catch (error) {
    console.error('Error generating recipe:', error);
    
    // Provide more specific error messages
    if (error.code === 'insufficient_quota') {
      throw new functions.https.HttpsError('resource-exhausted', 'AI service quota exceeded');
    } else if (error.code === 'model_not_found') {
      throw new functions.https.HttpsError('unavailable', 'AI model not available');
    } else if (error.message.includes('JSON')) {
      throw new functions.https.HttpsError('internal', 'Failed to parse AI response');
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to generate recipe: ' + error.message);
  }
});

/**
 * Generate ingredient substitutions with enhanced error handling
 */
exports.getSubstitutions = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (!openai) {
    throw new functions.https.HttpsError('unavailable', 'AI service is not configured');
  }

  const { ingredient, dietType, reason, allergies } = data;

  if (!ingredient) {
    throw new functions.https.HttpsError('invalid-argument', 'ingredient is required');
  }

  const prompt = `
Suggest the top 3 ingredient substitutions for "${ingredient}" that maintain flavor, texture, and diet compatibility.

${dietType ? `Diet type: ${dietType}` : ''}
${reason ? `Reason for substitution: ${reason}` : ''}
${allergies ? `Avoid allergens: ${allergies.join(', ')}` : ''}

Return ONLY a valid JSON array (no markdown, no extra text) with this exact structure:
[
  {
    "substitute": "ingredient name",
    "ratio": "substitution ratio (e.g., 1:1)",
    "notes": "any preparation notes",
    "nutritionDiff": "brief comparison of nutrition"
  }
]
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional chef. Always respond with valid JSON only, no markdown formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const substitutionsText = completion.choices[0].message.content;
    return parseAIResponse(substitutionsText);
  } catch (error) {
    console.error('Error generating substitutions:', error);
    
    if (error.code === 'insufficient_quota') {
      throw new functions.https.HttpsError('resource-exhausted', 'AI service quota exceeded');
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to generate substitutions: ' + error.message);
  }
});

/**
 * Generate meal plan with enhanced pantry integration
 */
exports.generateMealPlan = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (!openai) {
    throw new functions.https.HttpsError('unavailable', 'AI service is not configured');
  }

  const userId = context.auth.uid;
  const { days, macroGoals, pantryItems, preferences } = data;

  // Validate input
  if (!days || !macroGoals) {
    throw new functions.https.HttpsError('invalid-argument', 'days and macroGoals are required');
  }

  if (days < 1 || days > MAX_MEAL_PLAN_DAYS) {
    throw new functions.https.HttpsError('invalid-argument', `days must be between 1 and ${MAX_MEAL_PLAN_DAYS}`);
  }

  const prompt = `
Create a ${days}-day meal plan with the following macro targets per day:
- Protein: ${macroGoals.protein}g
- Carbs: ${macroGoals.carbs}g
- Fat: ${macroGoals.fat}g
- Calories: ${macroGoals.calories || 'calculated from macros'}

${preferences?.dietType ? `Diet type: ${preferences.dietType}` : ''}
${preferences?.allergies ? `Avoid allergens: ${preferences.allergies.join(', ')}` : ''}
${preferences?.restrictions ? `Follow these dietary restrictions: ${preferences.restrictions.join(', ')}` : ''}
${pantryItems && pantryItems.length > 0 ? `Prioritize using these pantry items: ${pantryItems.join(', ')}` : ''}
${preferences?.mealsPerDay ? `Meals per day: ${preferences.mealsPerDay}` : 'Meals per day: 3'}

Return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "days": [
    {
      "day": number,
      "date": "YYYY-MM-DD",
      "meals": [
        {
          "type": "breakfast/lunch/dinner/snack",
          "title": "meal name",
          "ingredients": ["ingredient1", "ingredient2", ...],
          "macros": {
            "calories": number,
            "protein": number,
            "carbs": number,
            "fat": number
          }
        }
      ],
      "dailyTotals": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number
      }
    }
  ],
  "shoppingList": [
    {"item": "ingredient", "quantity": "amount with unit"}
  ]
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional nutritionist and meal planner. Always respond with valid JSON only, no markdown formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const mealPlanText = completion.choices[0].message.content;
    const mealPlan = parseAIResponse(mealPlanText);

    // Validate meal plan structure
    if (!mealPlan.days || !Array.isArray(mealPlan.days) || mealPlan.days.length === 0) {
      throw new Error('Invalid meal plan structure from AI');
    }

    // Save meal plan
    const mealPlanRef = await admin.firestore().collection('mealPlans').add({
      ...mealPlan,
      userId,
      macroGoals,
      pantryItems: pantryItems || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      ...mealPlan,
      id: mealPlanRef.id,
    };
  } catch (error) {
    console.error('Error generating meal plan:', error);
    
    if (error.code === 'insufficient_quota') {
      throw new functions.https.HttpsError('resource-exhausted', 'AI service quota exceeded');
    } else if (error.message.includes('JSON')) {
      throw new functions.https.HttpsError('internal', 'Failed to parse AI response');
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to generate meal plan: ' + error.message);
  }
});

/**
 * Get recipe suggestions based on pantry contents
 * This is an extensible feature for dynamic recipe creation
 */
exports.getPantrySuggestions = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (!openai) {
    throw new functions.https.HttpsError('unavailable', 'AI service is not configured');
  }

  const userId = context.auth.uid;
  const { pantryItems, preferences } = data;

  // Validate input
  if (!pantryItems || !Array.isArray(pantryItems) || pantryItems.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'pantryItems array is required');
  }

  const { dietType, allergies, restrictions, maxRecipes = DEFAULT_MAX_RECIPES } = preferences || {};

  const prompt = `
Based on these available pantry ingredients: ${pantryItems.join(', ')}.

Suggest ${maxRecipes} different recipe ideas that can be made with these ingredients.

${dietType ? `Diet preference: ${dietType}` : ''}
${allergies && allergies.length > 0 ? `MUST avoid these allergens: ${allergies.join(', ')}` : ''}
${restrictions && restrictions.length > 0 ? `Follow these dietary restrictions: ${restrictions.join(', ')}` : ''}

Return ONLY a valid JSON array (no markdown, no extra text) with this exact structure:
[
  {
    "title": "Recipe name",
    "description": "Brief description",
    "estimatedTime": number (total time in minutes),
    "difficulty": "easy/medium/hard",
    "ingredients": [
      {"item": "ingredient name", "fromPantry": true/false}
    ],
    "missingIngredients": ["ingredient1", "ingredient2"],
    "matchPercentage": number (0-100, percentage of ingredients from pantry)
  }
]
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a creative chef specializing in making recipes from available ingredients. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    });

    const suggestionsText = completion.choices[0].message.content;
    const suggestions = parseAIResponse(suggestionsText);

    // Log the suggestions for analytics
    await admin.firestore().collection('pantrySuggestions').add({
      userId,
      pantryItems,
      suggestions,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return suggestions;
  } catch (error) {
    console.error('Error getting pantry suggestions:', error);
    
    if (error.code === 'insufficient_quota') {
      throw new functions.https.HttpsError('resource-exhausted', 'AI service quota exceeded');
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to get pantry suggestions: ' + error.message);
  }
});

/**
 * Import recipe from URL
 * Fetches page content, extracts recipe data from JSON-LD or HTML,
 * and uses AI to structure/clean the data
 */
exports.importRecipeFromUrl = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { url } = data;

  // Validate URL
  if (!url || typeof url !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'URL is required');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid URL format');
  }

  // Only allow HTTP/HTTPS
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new functions.https.HttpsError('invalid-argument', 'Only HTTP/HTTPS URLs are allowed');
  }

  try {
    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Chefwise/1.0; +https://chefwise.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 15000,
    });

    if (!response.ok) {
      throw new functions.https.HttpsError('unavailable', `Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try to extract recipe from JSON-LD (schema.org/Recipe)
    let recipeData = extractJsonLdRecipe($);

    // If no JSON-LD, try to extract from common HTML patterns
    if (!recipeData) {
      recipeData = extractHtmlRecipe($, parsedUrl.hostname);
    }

    // If we have some data, use AI to clean and structure it
    if (recipeData && openai) {
      recipeData = await aiStructureRecipe(recipeData, url);
    } else if (!recipeData) {
      // Last resort: use AI to extract from page text
      if (!openai) {
        throw new functions.https.HttpsError('unavailable', 'Could not extract recipe and AI service is not available');
      }
      recipeData = await aiExtractRecipe($, url);
    }

    // Validate we have minimum required fields
    if (!recipeData || !recipeData.title || !recipeData.ingredients || recipeData.ingredients.length === 0) {
      throw new functions.https.HttpsError('not-found', 'Could not extract recipe from URL');
    }

    // Upload image to Firebase Storage if available
    let imageStoragePath = null;
    let uploadedImageUrl = null;

    if (recipeData.imageUrl) {
      try {
        const imageResult = await downloadAndUploadImage(
          recipeData.imageUrl,
          userId,
          parsedUrl.hostname
        );
        if (imageResult) {
          imageStoragePath = imageResult.path;
          uploadedImageUrl = imageResult.url;
        }
      } catch (imgError) {
        console.warn('Failed to upload image:', imgError.message);
        // Continue without image - not a critical failure
      }
    }

    // Save recipe to user's collection
    const recipeRef = await admin.firestore().collection('recipes').add({
      ...recipeData,
      userId,
      sourceUrl: url,
      sourceDomain: parsedUrl.hostname,
      imageStoragePath,
      imageUrl: uploadedImageUrl || recipeData.imageUrl,
      importedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      ...recipeData,
      id: recipeRef.id,
      sourceUrl: url,
      imageUrl: uploadedImageUrl || recipeData.imageUrl,
      imageStoragePath,
    };
  } catch (error) {
    console.error('Error importing recipe from URL:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to import recipe: ' + error.message);
  }
});

/**
 * Extract recipe from JSON-LD structured data
 */
function extractJsonLdRecipe($) {
  const scripts = $('script[type="application/ld+json"]');

  for (let i = 0; i < scripts.length; i++) {
    try {
      const jsonText = $(scripts[i]).html();
      if (!jsonText) continue;

      let data = JSON.parse(jsonText);

      // Handle @graph array
      if (data['@graph']) {
        data = data['@graph'].find(item =>
          item['@type'] === 'Recipe' ||
          (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
        );
      }

      // Handle array of objects
      if (Array.isArray(data)) {
        data = data.find(item =>
          item['@type'] === 'Recipe' ||
          (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
        );
      }

      if (!data) continue;

      // Check if this is a Recipe
      const type = data['@type'];
      if (type !== 'Recipe' && !(Array.isArray(type) && type.includes('Recipe'))) {
        continue;
      }

      // Parse the recipe data
      return {
        title: data.name || '',
        description: data.description || '',
        ingredients: parseJsonLdIngredients(data.recipeIngredient),
        steps: parseJsonLdSteps(data.recipeInstructions),
        prepTime: parseIsoDuration(data.prepTime),
        cookTime: parseIsoDuration(data.cookTime),
        servings: parseServings(data.recipeYield),
        difficulty: null, // Not in schema.org
        macros: parseJsonLdNutrition(data.nutrition),
        tags: parseJsonLdTags(data),
        imageUrl: parseImage(data.image),
      };
    } catch (e) {
      console.warn('Failed to parse JSON-LD:', e.message);
      continue;
    }
  }

  return null;
}

/**
 * Parse JSON-LD ingredients to standard format
 */
function parseJsonLdIngredients(ingredients) {
  if (!ingredients || !Array.isArray(ingredients)) return [];

  return ingredients.map(ing => {
    if (typeof ing === 'string') {
      return { item: ing, amount: '', unit: '' };
    }
    return { item: ing.toString(), amount: '', unit: '' };
  });
}

/**
 * Parse JSON-LD instructions to steps array
 */
function parseJsonLdSteps(instructions) {
  if (!instructions) return [];

  if (typeof instructions === 'string') {
    return [instructions];
  }

  if (Array.isArray(instructions)) {
    return instructions.flatMap(inst => {
      if (typeof inst === 'string') return inst;
      if (inst['@type'] === 'HowToStep') return inst.text || inst.name || '';
      if (inst['@type'] === 'HowToSection') {
        const sectionSteps = inst.itemListElement || [];
        return sectionSteps.map(s => s.text || s.name || '');
      }
      if (inst.text) return inst.text;
      return '';
    }).filter(step => step.length > 0);
  }

  return [];
}

/**
 * Parse ISO 8601 duration to minutes
 */
function parseIsoDuration(duration) {
  if (!duration) return null;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  return hours * 60 + minutes;
}

/**
 * Parse recipe yield to servings number
 */
function parseServings(recipeYield) {
  if (!recipeYield) return 4; // Default

  if (typeof recipeYield === 'number') return recipeYield;

  if (typeof recipeYield === 'string') {
    const match = recipeYield.match(/(\d+)/);
    if (match) return parseInt(match[1], 10);
  }

  if (Array.isArray(recipeYield) && recipeYield.length > 0) {
    return parseServings(recipeYield[0]);
  }

  return 4;
}

/**
 * Parse JSON-LD nutrition info
 */
function parseJsonLdNutrition(nutrition) {
  if (!nutrition) return null;

  return {
    calories: parseNutrientValue(nutrition.calories),
    protein: parseNutrientValue(nutrition.proteinContent),
    carbs: parseNutrientValue(nutrition.carbohydrateContent),
    fat: parseNutrientValue(nutrition.fatContent),
    fiber: parseNutrientValue(nutrition.fiberContent),
    sugar: parseNutrientValue(nutrition.sugarContent),
    sodium: parseNutrientValue(nutrition.sodiumContent),
  };
}

/**
 * Parse nutrient value from string like "250 kcal" or "10 g"
 */
function parseNutrientValue(value) {
  if (!value) return null;
  if (typeof value === 'number') return value;

  const match = value.toString().match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Parse tags from JSON-LD recipe
 */
function parseJsonLdTags(data) {
  const tags = [];

  if (data.recipeCategory) {
    const categories = Array.isArray(data.recipeCategory) ? data.recipeCategory : [data.recipeCategory];
    tags.push(...categories);
  }

  if (data.recipeCuisine) {
    const cuisines = Array.isArray(data.recipeCuisine) ? data.recipeCuisine : [data.recipeCuisine];
    tags.push(...cuisines);
  }

  if (data.keywords) {
    const keywords = typeof data.keywords === 'string'
      ? data.keywords.split(',').map(k => k.trim())
      : Array.isArray(data.keywords) ? data.keywords : [];
    tags.push(...keywords);
  }

  return [...new Set(tags)].slice(0, 10); // Unique, max 10
}

/**
 * Parse image from JSON-LD
 */
function parseImage(image) {
  if (!image) return null;
  if (typeof image === 'string') return image;
  if (image.url) return image.url;
  if (Array.isArray(image) && image.length > 0) {
    return parseImage(image[0]);
  }
  return null;
}

/**
 * Extract recipe from HTML using common patterns
 */
function extractHtmlRecipe($, hostname) {
  // Common recipe card selectors
  const title =
    $('h1.recipe-title').text() ||
    $('h1.recipe-name').text() ||
    $('h1[itemprop="name"]').text() ||
    $('h2.recipe-title').text() ||
    $('.recipe-header h1').text() ||
    $('h1').first().text();

  if (!title || title.trim().length === 0) return null;

  // Try to find ingredients
  let ingredients = [];
  const ingredientSelectors = [
    '.recipe-ingredients li',
    '.ingredients li',
    '[itemprop="recipeIngredient"]',
    '.ingredient-list li',
    '.wprm-recipe-ingredient',
  ];

  for (const selector of ingredientSelectors) {
    const items = $(selector);
    if (items.length > 0) {
      items.each((_, el) => {
        const text = $(el).text().trim();
        if (text) ingredients.push({ item: text, amount: '', unit: '' });
      });
      break;
    }
  }

  // Try to find instructions
  let steps = [];
  const stepSelectors = [
    '.recipe-instructions li',
    '.instructions li',
    '[itemprop="recipeInstructions"] li',
    '.recipe-steps li',
    '.wprm-recipe-instruction',
  ];

  for (const selector of stepSelectors) {
    const items = $(selector);
    if (items.length > 0) {
      items.each((_, el) => {
        const text = $(el).text().trim();
        if (text) steps.push(text);
      });
      break;
    }
  }

  if (ingredients.length === 0 && steps.length === 0) {
    return null;
  }

  return {
    title: title.trim(),
    description: $('meta[name="description"]').attr('content') || '',
    ingredients,
    steps,
    prepTime: null,
    cookTime: null,
    servings: 4,
    difficulty: null,
    macros: null,
    tags: [],
    imageUrl: $('meta[property="og:image"]').attr('content') || null,
  };
}

/**
 * Use AI to structure/clean recipe data
 */
async function aiStructureRecipe(recipeData, sourceUrl) {
  const prompt = `
Clean and structure this recipe data extracted from ${sourceUrl}.
Fix any parsing issues, standardize ingredient amounts, and improve step clarity.

Raw data:
${JSON.stringify(recipeData, null, 2)}

Return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "title": "Recipe name",
  "description": "Brief description",
  "ingredients": [
    {"item": "ingredient name", "amount": "quantity", "unit": "measurement"}
  ],
  "steps": ["step 1", "step 2", ...],
  "prepTime": number or null (in minutes),
  "cookTime": number or null (in minutes),
  "servings": number,
  "difficulty": "easy/medium/hard",
  "macros": {
    "calories": number or null,
    "protein": number or null,
    "carbs": number or null,
    "fat": number or null,
    "fiber": number or null,
    "sugar": number or null,
    "sodium": number or null
  },
  "tags": ["tag1", "tag2", ...]
}
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a recipe data parser. Clean and structure recipe data. Always respond with valid JSON only.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });

  return parseAIResponse(completion.choices[0].message.content);
}

/**
 * Use AI to extract recipe from page text when other methods fail
 */
async function aiExtractRecipe($, sourceUrl) {
  // Get main content text, removing scripts, styles, etc.
  $('script, style, nav, footer, header, aside').remove();
  const pageText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 8000);

  const prompt = `
Extract recipe information from this web page text from ${sourceUrl}:

${pageText}

Return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "title": "Recipe name",
  "description": "Brief description",
  "ingredients": [
    {"item": "ingredient name", "amount": "quantity", "unit": "measurement"}
  ],
  "steps": ["step 1", "step 2", ...],
  "prepTime": number or null (in minutes),
  "cookTime": number or null (in minutes),
  "servings": number,
  "difficulty": "easy/medium/hard",
  "macros": null,
  "tags": ["tag1", "tag2", ...]
}

If you cannot find recipe information, return: {"error": "No recipe found"}
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a recipe extraction expert. Extract recipe data from web page text. Always respond with valid JSON only.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });

  const result = parseAIResponse(completion.choices[0].message.content);

  if (result.error) {
    return null;
  }

  return result;
}

/**
 * Download image from URL and upload to Firebase Storage
 * @param {string} imageUrl - URL of the image to download
 * @param {string} userId - User ID for organizing storage
 * @param {string} domain - Source domain for reference
 * @returns {Promise<{path: string, url: string} | null>}
 */
async function downloadAndUploadImage(imageUrl, userId, domain) {
  if (!imageUrl) return null;

  try {
    // Fetch the image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Chefwise/1.0; +https://chefwise.app)',
        'Accept': 'image/*',
      },
      timeout: 30000,
    });

    if (!response.ok) {
      console.warn(`Failed to fetch image: ${response.status}`);
      return null;
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !ALLOWED_IMAGE_TYPES.some(t => contentType.includes(t.split('/')[1]))) {
      console.warn(`Invalid image content type: ${contentType}`);
      return null;
    }

    // Check content length if available
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_SIZE) {
      console.warn(`Image too large: ${contentLength} bytes`);
      return null;
    }

    // Get the image buffer
    const buffer = await response.buffer();

    // Check actual size
    if (buffer.length > MAX_IMAGE_SIZE) {
      console.warn(`Image too large after download: ${buffer.length} bytes`);
      return null;
    }

    // Determine file extension
    let extension = 'jpg';
    if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('webp')) extension = 'webp';
    else if (contentType.includes('gif')) extension = 'gif';

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const filename = `${timestamp}-${randomId}.${extension}`;
    const storagePath = `recipes/${userId}/imported/${filename}`;

    // Upload to Firebase Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);

    await file.save(buffer, {
      metadata: {
        contentType: contentType || `image/${extension}`,
        metadata: {
          sourceUrl: imageUrl,
          sourceDomain: domain,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    return {
      path: storagePath,
      url: publicUrl,
    };
  } catch (error) {
    console.error('Error downloading/uploading image:', error);
    return null;
  }
}

/**
 * Delete recipe image from Storage
 * Called when a recipe is deleted to clean up storage
 */
exports.onRecipeDelete = functions.firestore
  .document('recipes/{recipeId}')
  .onDelete(async (snap, context) => {
    const recipe = snap.data();

    if (recipe.imageStoragePath) {
      try {
        const bucket = admin.storage().bucket();
        await bucket.file(recipe.imageStoragePath).delete();
        console.log(`Deleted image: ${recipe.imageStoragePath}`);
      } catch (error) {
        console.warn(`Failed to delete image ${recipe.imageStoragePath}:`, error.message);
      }
    }
  });

/**
 * Also handle community recipe image cleanup
 */
exports.onCommunityRecipeDelete = functions.firestore
  .document('communityRecipes/{recipeId}')
  .onDelete(async (snap, context) => {
    const recipe = snap.data();

    if (recipe.imageStoragePath) {
      try {
        const bucket = admin.storage().bucket();
        await bucket.file(recipe.imageStoragePath).delete();
        console.log(`Deleted community image: ${recipe.imageStoragePath}`);
      } catch (error) {
        console.warn(`Failed to delete image ${recipe.imageStoragePath}:`, error.message);
      }
    }
  });
