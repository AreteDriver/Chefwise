import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/firebaseConfig';

/**
 * Custom hook for OpenAI API interactions with rate limiting
 * @returns {Object} API state and methods
 */
export const useOpenAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  /**
   * Generate a recipe from user input
   * @param {Object} params - Recipe parameters
   * @param {string} params.dietType - Diet preference
   * @param {string[]} params.ingredients - List of ingredients
   * @param {Object} params.preferences - User preferences
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
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate ingredient substitutions
   * @param {string} ingredient - Ingredient to substitute
   * @param {Object} context - Additional context
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
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate meal plan
   * @param {Object} params - Meal plan parameters
   * @param {number} params.days - Number of days
   * @param {Object} params.macroGoals - Macro targets
   * @param {string[]} params.pantryItems - Available ingredients
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
      setError(err.message);
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
  };
};

export default useOpenAI;
