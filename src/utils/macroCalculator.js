/**
 * Macro and nutrition calculation utilities
 */

/**
 * Calculate calories from macros
 * @param {Object} macros - Macro nutrients
 * @param {number} macros.protein - Protein in grams
 * @param {number} macros.carbs - Carbs in grams
 * @param {number} macros.fat - Fat in grams
 * @returns {number} Total calories
 */
export const calculateCalories = ({ protein, carbs, fat }) => {
  return (protein * 4) + (carbs * 4) + (fat * 9);
};

/**
 * Calculate macro percentages
 * @param {Object} macros - Macro nutrients
 * @returns {Object} Percentages of each macro
 */
export const calculateMacroPercentages = ({ protein, carbs, fat }) => {
  const totalCalories = calculateCalories({ protein, carbs, fat });
  
  return {
    protein: Math.round((protein * 4 / totalCalories) * 100),
    carbs: Math.round((carbs * 4 / totalCalories) * 100),
    fat: Math.round((fat * 9 / totalCalories) * 100),
  };
};

/**
 * Calculate macro targets based on body weight and goals
 * @param {Object} params
 * @param {number} params.weight - Body weight in pounds
 * @param {string} params.goal - 'maintain', 'lose', 'gain'
 * @param {string} params.activityLevel - 'sedentary', 'moderate', 'active'
 * @returns {Object} Macro targets
 */
export const calculateMacroTargets = ({ weight, goal = 'maintain', activityLevel = 'moderate' }) => {
  const activityMultiplier = {
    sedentary: 12,
    moderate: 14,
    active: 16,
  };

  const goalAdjustment = {
    lose: -500,
    maintain: 0,
    gain: 500,
  };

  const baseCalories = weight * (activityMultiplier[activityLevel] || 14);
  const targetCalories = baseCalories + (goalAdjustment[goal] || 0);

  // Standard macro split: 30% protein, 40% carbs, 30% fat
  const protein = Math.round((targetCalories * 0.30) / 4);
  const carbs = Math.round((targetCalories * 0.40) / 4);
  const fat = Math.round((targetCalories * 0.30) / 9);

  return {
    calories: targetCalories,
    protein,
    carbs,
    fat,
  };
};

/**
 * Sum macros from multiple meals
 * @param {Array} meals - Array of meal objects with macros
 * @returns {Object} Total macros
 */
export const sumMacros = (meals) => {
  return meals.reduce((total, meal) => {
    return {
      calories: (total.calories || 0) + (meal.macros?.calories || 0),
      protein: (total.protein || 0) + (meal.macros?.protein || 0),
      carbs: (total.carbs || 0) + (meal.macros?.carbs || 0),
      fat: (total.fat || 0) + (meal.macros?.fat || 0),
      fiber: (total.fiber || 0) + (meal.macros?.fiber || 0),
      sugar: (total.sugar || 0) + (meal.macros?.sugar || 0),
      sodium: (total.sodium || 0) + (meal.macros?.sodium || 0),
    };
  }, {});
};

/**
 * Check if macros are within target range
 * @param {Object} current - Current macros
 * @param {Object} target - Target macros
 * @param {number} tolerance - Acceptable variance percentage (default 10%)
 * @returns {Object} Status for each macro
 */
export const checkMacroStatus = (current, target, tolerance = 10) => {
  const checkValue = (curr, targ) => {
    const variance = Math.abs(curr - targ);
    const percentVariance = (variance / targ) * 100;
    
    if (percentVariance <= tolerance) return 'on-track';
    if (curr < targ) return 'under';
    return 'over';
  };

  return {
    calories: checkValue(current.calories, target.calories),
    protein: checkValue(current.protein, target.protein),
    carbs: checkValue(current.carbs, target.carbs),
    fat: checkValue(current.fat, target.fat),
  };
};
