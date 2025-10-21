/**
 * AI Prompt Templates for ChefWise
 */

export const RECIPE_PROMPT = (dietType, ingredients, preferences = {}) => `
Generate a healthy ${dietType} recipe using the following ingredients: ${ingredients.join(', ')}.

${preferences.allergies ? `Avoid these allergens: ${preferences.allergies.join(', ')}` : ''}
${preferences.servings ? `Servings: ${preferences.servings}` : 'Servings: 4'}
${preferences.cookTime ? `Target cook time: ${preferences.cookTime} minutes` : ''}

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
  "tags": ["tag1", "tag2", ...]
}
`;

export const SUBSTITUTION_PROMPT = (ingredient, context = {}) => `
Suggest the top 3 ingredient substitutions for "${ingredient}" that maintain flavor, texture, and diet compatibility.

${context.dietType ? `Diet type: ${context.dietType}` : ''}
${context.reason ? `Reason for substitution: ${context.reason}` : ''}
${context.allergies ? `Avoid allergens: ${context.allergies.join(', ')}` : ''}

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

export const MEAL_PLAN_PROMPT = (days, macroGoals, preferences = {}) => `
Create a ${days}-day meal plan with the following macro targets per day:
- Protein: ${macroGoals.protein}g
- Carbs: ${macroGoals.carbs}g
- Fat: ${macroGoals.fat}g
- Calories: ${macroGoals.calories || 'calculated from macros'}

${preferences.dietType ? `Diet type: ${preferences.dietType}` : ''}
${preferences.allergies ? `Avoid allergens: ${preferences.allergies.join(', ')}` : ''}
${preferences.pantryItems ? `Prioritize using: ${preferences.pantryItems.join(', ')}` : ''}
${preferences.mealsPerDay ? `Meals per day: ${preferences.mealsPerDay}` : 'Meals per day: 3'}

Return a JSON object with the following structure:
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

export const DIET_FILTERS = {
  mediterranean: 'Mediterranean diet - emphasis on olive oil, fish, vegetables, whole grains',
  vegan: 'Vegan - no animal products',
  vegetarian: 'Vegetarian - no meat or fish',
  keto: 'Ketogenic - very low carb, high fat',
  paleo: 'Paleo - no grains, legumes, or dairy',
  'low-fat': 'Low fat - limit fat to 20-30% of calories',
  'low-sugar': 'Low sugar - minimize added sugars and high glycemic foods',
  'low-sodium': 'Low sodium - limit sodium intake',
  nafld: 'NAFLD-friendly - low fat, low sugar, anti-inflammatory',
  gallbladder: 'Gallbladder-friendly - low fat, avoid triggers',
  gluten_free: 'Gluten-free - no wheat, barley, rye',
  dairy_free: 'Dairy-free - no milk products',
};

export const formatDietPrompt = (dietType) => {
  return DIET_FILTERS[dietType] || dietType;
};
