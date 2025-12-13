const functions = require('firebase-functions');
const admin = require('firebase-admin');
const OpenAI = require('openai');

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
