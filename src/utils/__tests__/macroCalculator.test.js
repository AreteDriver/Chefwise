import {
  calculateCalories,
  calculateMacroPercentages,
  calculateMacroTargets,
  sumMacros,
  checkMacroStatus,
} from '../macroCalculator'

describe('macroCalculator', () => {
  describe('calculateCalories', () => {
    it('should calculate total calories from macros correctly', () => {
      const macros = { protein: 50, carbs: 100, fat: 20 }
      const result = calculateCalories(macros)
      
      // (50*4) + (100*4) + (20*9) = 200 + 400 + 180 = 780
      expect(result).toBe(780)
    })

    it('should handle zero values', () => {
      const macros = { protein: 0, carbs: 0, fat: 0 }
      expect(calculateCalories(macros)).toBe(0)
    })

    it('should handle decimal values', () => {
      const macros = { protein: 25.5, carbs: 50.3, fat: 10.2 }
      const result = calculateCalories(macros)
      
      // (25.5*4) + (50.3*4) + (10.2*9) = 102 + 201.2 + 91.8 = 395
      expect(result).toBeCloseTo(395, 0)
    })
  })

  describe('calculateMacroPercentages', () => {
    it('should calculate macro percentages correctly', () => {
      const macros = { protein: 50, carbs: 100, fat: 20 }
      const result = calculateMacroPercentages(macros)
      
      // Total calories: 780
      // Protein: (50*4)/780 * 100 = 25.6% ≈ 26%
      // Carbs: (100*4)/780 * 100 = 51.3% ≈ 51%
      // Fat: (20*9)/780 * 100 = 23.1% ≈ 23%
      expect(result.protein).toBe(26)
      expect(result.carbs).toBe(51)
      expect(result.fat).toBe(23)
    })

    it('should handle equal macro distribution', () => {
      const macros = { protein: 30, carbs: 30, fat: 13.33 }
      const result = calculateMacroPercentages(macros)
      
      // Should be roughly balanced
      expect(result.protein).toBeGreaterThan(0)
      expect(result.carbs).toBeGreaterThan(0)
      expect(result.fat).toBeGreaterThan(0)
    })
  })

  describe('calculateMacroTargets', () => {
    it('should calculate targets for maintenance goal', () => {
      const params = { weight: 150, goal: 'maintain', activityLevel: 'moderate' }
      const result = calculateMacroTargets(params)
      
      // 150 * 14 = 2100 calories
      expect(result.calories).toBe(2100)
      expect(result.protein).toBeGreaterThan(0)
      expect(result.carbs).toBeGreaterThan(0)
      expect(result.fat).toBeGreaterThan(0)
    })

    it('should calculate targets for weight loss', () => {
      const params = { weight: 150, goal: 'lose', activityLevel: 'moderate' }
      const result = calculateMacroTargets(params)
      
      // 150 * 14 - 500 = 1600 calories
      expect(result.calories).toBe(1600)
    })

    it('should calculate targets for weight gain', () => {
      const params = { weight: 150, goal: 'gain', activityLevel: 'moderate' }
      const result = calculateMacroTargets(params)
      
      // 150 * 14 + 500 = 2600 calories
      expect(result.calories).toBe(2600)
    })

    it('should handle different activity levels', () => {
      const sedentary = calculateMacroTargets({ weight: 150, activityLevel: 'sedentary' })
      const active = calculateMacroTargets({ weight: 150, activityLevel: 'active' })
      
      // 150 * 12 = 1800 (sedentary)
      // 150 * 16 = 2400 (active)
      expect(sedentary.calories).toBe(1800)
      expect(active.calories).toBe(2400)
    })

    it('should use defaults for missing parameters', () => {
      const result = calculateMacroTargets({ weight: 150 })
      
      // Should use moderate activity (14) and maintain goal (0)
      expect(result.calories).toBe(2100)
    })

    it('should handle invalid activity level gracefully', () => {
      const result = calculateMacroTargets({ weight: 150, activityLevel: 'invalid' })
      
      // Should default to moderate (14)
      expect(result.calories).toBe(2100)
    })
  })

  describe('sumMacros', () => {
    it('should sum macros from multiple meals correctly', () => {
      const meals = [
        { macros: { calories: 400, protein: 30, carbs: 40, fat: 15 } },
        { macros: { calories: 600, protein: 40, carbs: 60, fat: 20 } },
        { macros: { calories: 300, protein: 20, carbs: 30, fat: 10 } },
      ]
      
      const result = sumMacros(meals)
      
      expect(result.calories).toBe(1300)
      expect(result.protein).toBe(90)
      expect(result.carbs).toBe(130)
      expect(result.fat).toBe(45)
    })

    it('should handle empty meals array', () => {
      const result = sumMacros([])
      
      expect(result).toEqual({})
    })

    it('should handle meals with missing macros', () => {
      const meals = [
        { macros: { calories: 400, protein: 30 } },
        { macros: { carbs: 50 } },
        { name: 'meal without macros' },
      ]
      
      const result = sumMacros(meals)
      
      expect(result.calories).toBe(400)
      expect(result.protein).toBe(30)
      expect(result.carbs).toBe(50)
      expect(result.fat).toBe(0)
    })

    it('should sum additional nutrients (fiber, sugar, sodium)', () => {
      const meals = [
        { macros: { fiber: 5, sugar: 10, sodium: 200 } },
        { macros: { fiber: 3, sugar: 8, sodium: 150 } },
      ]
      
      const result = sumMacros(meals)
      
      expect(result.fiber).toBe(8)
      expect(result.sugar).toBe(18)
      expect(result.sodium).toBe(350)
    })
  })

  describe('checkMacroStatus', () => {
    it('should mark macros as on-track when within tolerance', () => {
      const current = { calories: 2050, protein: 148, carbs: 205, fat: 62 }
      const target = { calories: 2100, protein: 150, carbs: 200, fat: 60 }
      
      const result = checkMacroStatus(current, target, 10)
      
      expect(result.calories).toBe('on-track')
      expect(result.protein).toBe('on-track')
      expect(result.carbs).toBe('on-track')
      expect(result.fat).toBe('on-track')
    })

    it('should mark macros as under when below target', () => {
      const current = { calories: 1500, protein: 100, carbs: 150, fat: 40 }
      const target = { calories: 2100, protein: 150, carbs: 200, fat: 60 }
      
      const result = checkMacroStatus(current, target, 10)
      
      expect(result.calories).toBe('under')
      expect(result.protein).toBe('under')
      expect(result.carbs).toBe('under')
      expect(result.fat).toBe('under')
    })

    it('should mark macros as over when above target', () => {
      const current = { calories: 2500, protein: 180, carbs: 250, fat: 80 }
      const target = { calories: 2100, protein: 150, carbs: 200, fat: 60 }
      
      const result = checkMacroStatus(current, target, 10)
      
      expect(result.calories).toBe('over')
      expect(result.protein).toBe('over')
      expect(result.carbs).toBe('over')
      expect(result.fat).toBe('over')
    })

    it('should use default tolerance of 10% when not specified', () => {
      const current = { calories: 2150, protein: 155, carbs: 205, fat: 63 }
      const target = { calories: 2100, protein: 150, carbs: 200, fat: 60 }
      
      const result = checkMacroStatus(current, target)
      
      // All within 10% tolerance
      expect(result.calories).toBe('on-track')
      expect(result.protein).toBe('on-track')
    })

    it('should handle custom tolerance values', () => {
      const current = { calories: 2200, protein: 150, carbs: 200, fat: 60 }
      const target = { calories: 2100, protein: 150, carbs: 200, fat: 60 }
      
      const strict = checkMacroStatus(current, target, 2)
      const lenient = checkMacroStatus(current, target, 20)
      
      // 2200 vs 2100 is ~4.8% difference
      expect(strict.calories).toBe('over') // Outside 2% tolerance
      expect(lenient.calories).toBe('on-track') // Within 20% tolerance
    })
  })
})
