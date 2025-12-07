import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/firebaseConfig';
import { generateCacheKey, getCache } from '../utils/cache/aiCache';

/**
 * Custom hook for OpenAI API interactions with rate limiting and caching
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
   * @param {boolean} params.useCache - Whether to use cache (default: true)
   */
  const generateRecipe = async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check cache first (unless explicitly disabled)
      const useCache = params.useCache !== false;
      if (useCache) {
        const cache = getCache();
        const cacheKey = generateCacheKey({ type: 'recipe', ...params });
        const cached = await cache.get(cacheKey);
        
        if (cached) {
          setResult(cached);
          setLoading(false);
          return cached;
        }
      }

      // Call API if not cached
      const generateRecipeFunction = httpsCallable(functions, 'generateRecipe');
      const response = await generateRecipeFunction(params);
      
      // Cache the response
      if (useCache && response.data) {
        const cache = getCache();
        const cacheKey = generateCacheKey({ type: 'recipe', ...params });
        await cache.set(cacheKey, response.data);
      }
      
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
   * @param {boolean} context.useCache - Whether to use cache (default: true)
   */
  const generateSubstitutions = async (ingredient, context = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check cache first (unless explicitly disabled)
      const useCache = context.useCache !== false;
      if (useCache) {
        const cache = getCache();
        const cacheKey = generateCacheKey({ type: 'substitution', ingredient, ...context });
        const cached = await cache.get(cacheKey);
        
        if (cached) {
          setResult(cached);
          setLoading(false);
          return cached;
        }
      }

      // Call API if not cached
      const getSubstitutionsFunction = httpsCallable(functions, 'getSubstitutions');
      const response = await getSubstitutionsFunction({ ingredient, ...context });
      
      // Cache the response
      if (useCache && response.data) {
        const cache = getCache();
        const cacheKey = generateCacheKey({ type: 'substitution', ingredient, ...context });
        await cache.set(cacheKey, response.data);
      }
      
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
   * @param {boolean} params.useCache - Whether to use cache (default: true)
   */
  const generateMealPlan = async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      // Check cache first (unless explicitly disabled)
      const useCache = params.useCache !== false;
      if (useCache) {
        const cache = getCache();
        const cacheKey = generateCacheKey({ type: 'mealplan', ...params });
        const cached = await cache.get(cacheKey);
        
        if (cached) {
          setResult(cached);
          setLoading(false);
          return cached;
        }
      }

      // Call API if not cached
      const generateMealPlanFunction = httpsCallable(functions, 'generateMealPlan');
      const response = await generateMealPlanFunction(params);
      
      // Cache the response
      if (useCache && response.data) {
        const cache = getCache();
        const cacheKey = generateCacheKey({ type: 'mealplan', ...params });
        await cache.set(cacheKey, response.data);
      }
      
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
