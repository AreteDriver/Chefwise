import { renderHook, act, waitFor } from '@testing-library/react'
import { useOpenAI } from '../useOpenAI'
import { httpsCallable } from 'firebase/functions'

// Mock Firebase functions
jest.mock('firebase/functions')
jest.mock('../../firebase/firebaseConfig', () => ({
  functions: {},
}))

describe('useOpenAI Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateRecipe', () => {
    it('should generate recipe successfully', async () => {
      const mockRecipe = {
        title: 'Test Recipe',
        ingredients: ['chicken', 'broccoli'],
        steps: ['Step 1', 'Step 2'],
        macros: { protein: 40, carbs: 20, fat: 10 },
      }

      const mockFunction = jest.fn().mockResolvedValue({ data: mockRecipe })
      httpsCallable.mockReturnValue(mockFunction)

      const { result } = renderHook(() => useOpenAI())

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)

      let response
      await act(async () => {
        response = await result.current.generateRecipe({
          dietType: 'Mediterranean',
          ingredients: ['chicken', 'broccoli'],
          preferences: {},
        })
      })

      expect(response).toEqual(mockRecipe)
      expect(result.current.loading).toBe(false)
      expect(result.current.result).toEqual(mockRecipe)
      expect(mockFunction).toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      const mockError = new Error('API Error')
      const mockFunction = jest.fn().mockRejectedValue(mockError)
      httpsCallable.mockReturnValue(mockFunction)

      const { result } = renderHook(() => useOpenAI())

      await act(async () => {
        try {
          await result.current.generateRecipe({
            dietType: 'Mediterranean',
            ingredients: [],
          })
        } catch (error) {
          // Expected error
        }
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('API Error')
    })

    it('should handle missing ingredients edge case', async () => {
      const mockFunction = jest.fn().mockResolvedValue({
        data: { error: 'No ingredients provided' },
      })
      httpsCallable.mockReturnValue(mockFunction)

      const { result } = renderHook(() => useOpenAI())

      await act(async () => {
        await result.current.generateRecipe({
          dietType: 'Mediterranean',
          ingredients: [],
          preferences: {},
        })
      })

      expect(mockFunction).toHaveBeenCalledWith({
        dietType: 'Mediterranean',
        ingredients: [],
        preferences: {},
      })
    })

    it('should handle invalid diet type', async () => {
      const mockFunction = jest.fn().mockResolvedValue({
        data: { title: 'Recipe', ingredients: [], steps: [] },
      })
      httpsCallable.mockReturnValue(mockFunction)

      const { result } = renderHook(() => useOpenAI())

      await act(async () => {
        await result.current.generateRecipe({
          dietType: 'InvalidDiet',
          ingredients: ['chicken'],
          preferences: {},
        })
      })

      expect(mockFunction).toHaveBeenCalled()
    })
  })

  describe('generateSubstitutions', () => {
    it('should generate substitutions successfully', async () => {
      const mockSubstitutions = [
        { substitute: 'tofu', ratio: '1:1', notes: 'Vegan alternative' },
        { substitute: 'turkey', ratio: '1:1', notes: 'Leaner option' },
      ]

      const mockFunction = jest.fn().mockResolvedValue({ data: mockSubstitutions })
      httpsCallable.mockReturnValue(mockFunction)

      const { result } = renderHook(() => useOpenAI())

      let response
      await act(async () => {
        response = await result.current.generateSubstitutions('chicken', {
          dietType: 'vegan',
        })
      })

      expect(response).toEqual(mockSubstitutions)
      expect(result.current.result).toEqual(mockSubstitutions)
    })

    it('should handle empty ingredient name', async () => {
      const mockFunction = jest.fn().mockResolvedValue({ data: [] })
      httpsCallable.mockReturnValue(mockFunction)

      const { result } = renderHook(() => useOpenAI())

      await act(async () => {
        await result.current.generateSubstitutions('', {})
      })

      expect(mockFunction).toHaveBeenCalledWith({
        ingredient: '',
      })
    })
  })

  describe('generateMealPlan', () => {
    it('should generate meal plan successfully', async () => {
      const mockMealPlan = {
        days: [
          {
            day: 1,
            meals: [
              { name: 'Breakfast', calories: 400 },
              { name: 'Lunch', calories: 600 },
            ],
          },
        ],
        shoppingList: ['eggs', 'chicken', 'rice'],
      }

      const mockFunction = jest.fn().mockResolvedValue({ data: mockMealPlan })
      httpsCallable.mockReturnValue(mockFunction)

      const { result } = renderHook(() => useOpenAI())

      let response
      await act(async () => {
        response = await result.current.generateMealPlan({
          days: 7,
          macroGoals: { protein: 150, carbs: 200, fat: 60 },
          pantryItems: ['chicken', 'rice'],
        })
      })

      expect(response).toEqual(mockMealPlan)
      expect(result.current.result).toEqual(mockMealPlan)
    })

    it('should handle zero days edge case', async () => {
      const mockFunction = jest.fn().mockResolvedValue({ data: { days: [] } })
      httpsCallable.mockReturnValue(mockFunction)

      const { result } = renderHook(() => useOpenAI())

      await act(async () => {
        await result.current.generateMealPlan({
          days: 0,
          macroGoals: {},
          pantryItems: [],
        })
      })

      expect(mockFunction).toHaveBeenCalled()
    })

    it('should handle missing macro goals', async () => {
      const mockFunction = jest.fn().mockResolvedValue({
        data: { days: [], shoppingList: [] },
      })
      httpsCallable.mockReturnValue(mockFunction)

      const { result } = renderHook(() => useOpenAI())

      await act(async () => {
        await result.current.generateMealPlan({
          days: 7,
          macroGoals: null,
          pantryItems: [],
        })
      })

      expect(mockFunction).toHaveBeenCalledWith({
        days: 7,
        macroGoals: null,
        pantryItems: [],
      })
    })
  })

  describe('loading states', () => {
    it('should set loading to true during API call', async () => {
      const mockFunction = jest.fn(() => new Promise((resolve) => setTimeout(() => resolve({ data: {} }), 100)))
      httpsCallable.mockReturnValue(mockFunction)

      const { result } = renderHook(() => useOpenAI())

      act(() => {
        result.current.generateRecipe({ ingredients: [] })
      })

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })
})
