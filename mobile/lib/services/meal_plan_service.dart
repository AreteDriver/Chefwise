import 'package:flutter/foundation.dart';
import '../models/meal_plan.dart';
import '../models/recipe.dart';

/// Service for managing meal plans
class MealPlanService extends ChangeNotifier {
  MealPlan? _currentPlan;
  
  MealPlan? get currentPlan => _currentPlan;
  bool get hasPlan => _currentPlan != null;

  MealPlanService() {
    _loadSamplePlan();
  }

  void _loadSamplePlan() {
    final now = DateTime.now();
    final startOfWeek = now.subtract(Duration(days: now.weekday - 1));
    
    final sampleRecipe1 = Recipe(
      id: 'r1',
      title: 'Grilled Chicken Salad',
      ingredients: ['Chicken', 'Lettuce', 'Tomatoes'],
      steps: ['Grill chicken', 'Mix salad'],
      prepTime: 10,
      cookTime: 20,
      servings: 2,
      macros: RecipeMacros(
        calories: 350,
        protein: 35,
        carbs: 20,
        fat: 12,
      ),
      tags: ['Healthy', 'High Protein'],
    );

    final sampleRecipe2 = Recipe(
      id: 'r2',
      title: 'Pasta Primavera',
      ingredients: ['Pasta', 'Mixed Vegetables', 'Olive Oil'],
      steps: ['Cook pasta', 'Sauté vegetables', 'Mix together'],
      prepTime: 15,
      cookTime: 25,
      servings: 4,
      macros: RecipeMacros(
        calories: 400,
        protein: 12,
        carbs: 65,
        fat: 10,
      ),
      tags: ['Vegetarian', 'Quick'],
    );

    final dailyMeals = <DailyMeal>[];
    for (int i = 0; i < 7; i++) {
      dailyMeals.add(DailyMeal(
        date: startOfWeek.add(Duration(days: i)),
        dayName: _getDayName(startOfWeek.add(Duration(days: i)).weekday),
        breakfast: sampleRecipe1,
        lunch: sampleRecipe2,
        dinner: sampleRecipe1,
      ));
    }

    _currentPlan = MealPlan(
      id: 'mp1',
      dailyMeals: dailyMeals,
      targets: MacroTargets(
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 65,
      ),
      startDate: startOfWeek,
    );
  }

  String _getDayName(int weekday) {
    switch (weekday) {
      case 1:
        return 'Monday';
      case 2:
        return 'Tuesday';
      case 3:
        return 'Wednesday';
      case 4:
        return 'Thursday';
      case 5:
        return 'Friday';
      case 6:
        return 'Saturday';
      case 7:
        return 'Sunday';
      default:
        return '';
    }
  }

  void generateNewPlan() {
    _loadSamplePlan();
    notifyListeners();
  }

  void updateTargets(MacroTargets newTargets) {
    if (_currentPlan != null) {
      _currentPlan = MealPlan(
        id: _currentPlan!.id,
        dailyMeals: _currentPlan!.dailyMeals,
        targets: newTargets,
        startDate: _currentPlan!.startDate,
      );
      notifyListeners();
    }
  }
}
