const functions = require('firebase-functions');
const admin = require('firebase-admin');
const OpenAI = require('openai');

admin.initializeApp();

const openai = new OpenAI({
  apiKey: functions.config().openai.key,
});

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
 * Generate recipe using OpenAI
 */
exports.generateRecipe = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  
  // Check plan tier
  await checkPlanTier(userId, 'generateRecipe');

  const { dietType, ingredients, preferences } = data;

  const prompt = `
Generate a healthy ${dietType} recipe using the following ingredients: ${ingredients.join(', ')}.

${preferences?.allergies ? `Avoid these allergens: ${preferences.allergies.join(', ')}` : ''}
${preferences?.servings ? `Servings: ${preferences.servings}` : 'Servings: 4'}

Return a JSON object with the following structure:
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
  "macros": {
    "calories": number,
    "protein": number (grams),
    "carbs": number (grams),
    "fat": number (grams),
    "fiber": number (grams),
    "sugar": number (grams),
    "sodium": number (mg)
  },
  "tags": ["tag1", "tag2"]
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional chef and nutritionist. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const recipeText = completion.choices[0].message.content;
    const recipe = JSON.parse(recipeText);

    // Save recipe to user's collection
    const recipeRef = await admin.firestore().collection('recipes').add({
      ...recipe,
      userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      ...recipe,
      id: recipeRef.id,
    };
  } catch (error) {
    console.error('Error generating recipe:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate recipe');
  }
});

/**
 * Generate ingredient substitutions
 */
exports.getSubstitutions = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { ingredient, dietType, reason, allergies } = data;

  const prompt = `
Suggest the top 3 ingredient substitutions for "${ingredient}" that maintain flavor, texture, and diet compatibility.

${dietType ? `Diet type: ${dietType}` : ''}
${reason ? `Reason for substitution: ${reason}` : ''}
${allergies ? `Avoid allergens: ${allergies.join(', ')}` : ''}

Return a JSON array with the following structure:
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
          content: 'You are a professional chef. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const substitutionsText = completion.choices[0].message.content;
    return JSON.parse(substitutionsText);
  } catch (error) {
    console.error('Error generating substitutions:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate substitutions');
  }
});

/**
 * Generate meal plan
 */
exports.generateMealPlan = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { days, macroGoals, pantryItems, preferences } = data;

  const prompt = `
Create a ${days}-day meal plan with the following macro targets per day:
- Protein: ${macroGoals.protein}g
- Carbs: ${macroGoals.carbs}g
- Fat: ${macroGoals.fat}g
- Calories: ${macroGoals.calories || 'calculated from macros'}

${preferences?.dietType ? `Diet type: ${preferences.dietType}` : ''}
${preferences?.allergies ? `Avoid allergens: ${preferences.allergies.join(', ')}` : ''}
${pantryItems ? `Prioritize using: ${pantryItems.join(', ')}` : ''}

Return a JSON object with the following structure:
{
  "days": [
    {
      "day": number,
      "date": "YYYY-MM-DD",
      "meals": [
        {
          "type": "breakfast/lunch/dinner",
          "title": "meal name",
          "ingredients": ["ingredient1", "ingredient2"],
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
          content: 'You are a professional nutritionist and meal planner. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const mealPlanText = completion.choices[0].message.content;
    const mealPlan = JSON.parse(mealPlanText);

    // Save meal plan
    await admin.firestore().collection('mealPlans').add({
      ...mealPlan,
      userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return mealPlan;
  } catch (error) {
    console.error('Error generating meal plan:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate meal plan');
  }
});
