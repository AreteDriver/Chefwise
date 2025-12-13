import 'recipe.dart';

/// Meal plan model
class MealPlan {
  final String id;
  final List<DailyMeal> dailyMeals;
  final MacroTargets targets;
  final DateTime startDate;

  MealPlan({
    required this.id,
    required this.dailyMeals,
    required this.targets,
    required this.startDate,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'dailyMeals': dailyMeals.map((e) => e.toJson()).toList(),
      'targets': targets.toJson(),
      'startDate': startDate.toIso8601String(),
    };
  }

  factory MealPlan.fromJson(Map<String, dynamic> json) {
    return MealPlan(
      id: json['id'],
      dailyMeals: (json['dailyMeals'] as List)
          .map((e) => DailyMeal.fromJson(e))
          .toList(),
      targets: MacroTargets.fromJson(json['targets']),
      startDate: DateTime.parse(json['startDate']),
    );
  }
}

/// Daily meal model
class DailyMeal {
  final DateTime date;
  final String dayName;
  final Recipe? breakfast;
  final Recipe? lunch;
  final Recipe? dinner;
  final Recipe? snack;

  DailyMeal({
    required this.date,
    required this.dayName,
    this.breakfast,
    this.lunch,
    this.dinner,
    this.snack,
  });

  RecipeMacros get totalMacros {
    double calories = 0;
    double protein = 0;
    double carbs = 0;
    double fat = 0;

    for (var meal in [breakfast, lunch, dinner, snack]) {
      if (meal != null) {
        calories += meal.macros.calories;
        protein += meal.macros.protein;
        carbs += meal.macros.carbs;
        fat += meal.macros.fat;
      }
    }

    return RecipeMacros(
      calories: calories,
      protein: protein,
      carbs: carbs,
      fat: fat,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'date': date.toIso8601String(),
      'dayName': dayName,
      'breakfast': breakfast?.toJson(),
      'lunch': lunch?.toJson(),
      'dinner': dinner?.toJson(),
      'snack': snack?.toJson(),
    };
  }

  factory DailyMeal.fromJson(Map<String, dynamic> json) {
    return DailyMeal(
      date: DateTime.parse(json['date']),
      dayName: json['dayName'],
      breakfast: json['breakfast'] != null 
          ? Recipe.fromJson(json['breakfast']) 
          : null,
      lunch: json['lunch'] != null 
          ? Recipe.fromJson(json['lunch']) 
          : null,
      dinner: json['dinner'] != null 
          ? Recipe.fromJson(json['dinner']) 
          : null,
      snack: json['snack'] != null 
          ? Recipe.fromJson(json['snack']) 
          : null,
    );
  }
}

/// Macro targets model
class MacroTargets {
  final double calories;
  final double protein;
  final double carbs;
  final double fat;

  MacroTargets({
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
  });

  Map<String, dynamic> toJson() {
    return {
      'calories': calories,
      'protein': protein,
      'carbs': carbs,
      'fat': fat,
    };
  }

  factory MacroTargets.fromJson(Map<String, dynamic> json) {
    return MacroTargets(
      calories: (json['calories'] ?? 2000).toDouble(),
      protein: (json['protein'] ?? 150).toDouble(),
      carbs: (json['carbs'] ?? 200).toDouble(),
      fat: (json['fat'] ?? 65).toDouble(),
    );
  }
}
