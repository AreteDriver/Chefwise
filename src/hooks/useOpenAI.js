import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/firebaseConfig';

/**
 * Custom hook for OpenAI API interactions with rate limiting and error handling
 * @returns {Object} API state and methods
 */
export const useOpenAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  /**
   * Generate a recipe from user input with enhanced dietary handling
   * @param {Object} params - Recipe parameters
   * @param {string} params.dietType - Diet preference
   * @param {string[]} params.ingredients - List of ingredients
   * @param {Object} params.preferences - User preferences including pantryContents, allergies, restrictions
   */
  const generateRecipe = async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      const generateRecipeFunction = httpsCallable(functions, 'generateRecipe');
      const response = await generateRecipeFunction(params);
      setResult(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to generate recipe';
      setError(errorMessage);
      console.error('Recipe generation error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate ingredient substitutions
   * @param {string} ingredient - Ingredient to substitute
   * @param {Object} context - Additional context (dietType, allergies, reason)
   */
  const generateSubstitutions = async (ingredient, context = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const getSubstitutionsFunction = httpsCallable(functions, 'getSubstitutions');
      const response = await getSubstitutionsFunction({ ingredient, ...context });
      setResult(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to generate substitutions';
      setError(errorMessage);
      console.error('Substitution error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate meal plan with pantry integration
   * @param {Object} params - Meal plan parameters
   * @param {number} params.days - Number of days
   * @param {Object} params.macroGoals - Macro targets (protein, carbs, fat, calories)
   * @param {string[]} params.pantryItems - Available ingredients
   * @param {Object} params.preferences - User preferences (dietType, allergies, restrictions)
   */
  const generateMealPlan = async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      const generateMealPlanFunction = httpsCallable(functions, 'generateMealPlan');
      const response = await generateMealPlanFunction(params);
      setResult(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to generate meal plan';
      setError(errorMessage);
      console.error('Meal plan error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get recipe suggestions based on pantry contents
   * @param {Object} params - Suggestion parameters
   * @param {string[]} params.pantryItems - Available pantry ingredients
   * @param {Object} params.preferences - User preferences (dietType, allergies, restrictions, maxRecipes)
   */
  const getPantrySuggestions = async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      const getPantrySuggestionsFunction = httpsCallable(functions, 'getPantrySuggestions');
      const response = await getPantrySuggestionsFunction(params);
      setResult(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to get pantry suggestions';
      setError(errorMessage);
      console.error('Pantry suggestions error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    result,
    generateRecipe,
    generateSubstitutions,
    generateMealPlan,
    getPantrySuggestions,
  };
};

export default useOpenAI;
