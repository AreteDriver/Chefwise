import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart';
import '../models/recipe.dart';
import '../models/meal_plan.dart';

/// Service for calling Firebase Cloud Functions
class CloudFunctionsService {
  final FirebaseFunctions _functions =
      FirebaseFunctions.instanceFor(region: 'us-central1');

  /// Generate a recipe using AI via Cloud Function
  ///
  /// [params] should include:
  /// - pantryItems: List of available ingredients
  /// - dietaryNeeds: List of dietary restrictions
  /// - cuisinePreferences: List of preferred cuisines
  /// - maxPrepTime: Maximum prep time in minutes
  /// - servings: Number of servings
  Future<Recipe> generateRecipe(Map<String, dynamic> params) async {
    try {
      final callable = _functions.httpsCallable(
        'generateRecipe',
        options: HttpsCallableOptions(
          timeout: const Duration(seconds: 60),
        ),
      );

      final result = await callable.call(params);
      return Recipe.fromJson(result.data as Map<String, dynamic>);
    } on FirebaseFunctionsException catch (e) {
      debugPrint('Cloud Function Error: ${e.code} - ${e.message}');
      throw CloudFunctionException(
        code: e.code,
        message: _getErrorMessage(e.code),
      );
    } catch (e) {
      debugPrint('Unexpected error calling generateRecipe: $e');
      throw CloudFunctionException(
        code: 'unknown',
        message: 'Failed to generate recipe. Please try again.',
      );
    }
  }

  /// Generate a meal plan using AI via Cloud Function
  ///
  /// [params] should include:
  /// - pantryItems: List of available ingredients
  /// - dietaryNeeds: List of dietary restrictions
  /// - cuisinePreferences: List of preferred cuisines
  /// - macroTargets: Daily macro targets (calories, protein, carbs, fat)
  /// - daysCount: Number of days to plan (default 7)
  Future<MealPlan> generateMealPlan(Map<String, dynamic> params) async {
    try {
      final callable = _functions.httpsCallable(
        'generateMealPlan',
        options: HttpsCallableOptions(
          timeout: const Duration(seconds: 120),
        ),
      );

      final result = await callable.call(params);
      return MealPlan.fromJson(result.data as Map<String, dynamic>);
    } on FirebaseFunctionsException catch (e) {
      debugPrint('Cloud Function Error: ${e.code} - ${e.message}');
      throw CloudFunctionException(
        code: e.code,
        message: _getErrorMessage(e.code),
      );
    } catch (e) {
      debugPrint('Unexpected error calling generateMealPlan: $e');
      throw CloudFunctionException(
        code: 'unknown',
        message: 'Failed to generate meal plan. Please try again.',
      );
    }
  }

  /// Get ingredient substitutions via Cloud Function
  ///
  /// [params] should include:
  /// - ingredient: The ingredient to find substitutes for
  /// - recipeContext: Optional recipe context for better suggestions
  /// - dietaryNeeds: User's dietary restrictions
  Future<List<String>> getSubstitutions(Map<String, dynamic> params) async {
    try {
      final callable = _functions.httpsCallable(
        'getSubstitutions',
        options: HttpsCallableOptions(
          timeout: const Duration(seconds: 30),
        ),
      );

      final result = await callable.call(params);
      return List<String>.from(result.data['substitutions'] ?? []);
    } on FirebaseFunctionsException catch (e) {
      debugPrint('Cloud Function Error: ${e.code} - ${e.message}');
      throw CloudFunctionException(
        code: e.code,
        message: _getErrorMessage(e.code),
      );
    } catch (e) {
      debugPrint('Unexpected error calling getSubstitutions: $e');
      throw CloudFunctionException(
        code: 'unknown',
        message: 'Failed to get substitutions. Please try again.',
      );
    }
  }

  String _getErrorMessage(String code) {
    switch (code) {
      case 'unauthenticated':
        return 'Please sign in to use this feature.';
      case 'permission-denied':
        return 'You do not have permission to perform this action.';
      case 'resource-exhausted':
        return 'Too many requests. Please wait and try again.';
      case 'unavailable':
        return 'Service temporarily unavailable. Please try again later.';
      case 'deadline-exceeded':
        return 'Request timed out. Please try again.';
      case 'internal':
        return 'An internal error occurred. Please try again.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}

/// Exception thrown when a Cloud Function call fails
class CloudFunctionException implements Exception {
  final String code;
  final String message;

  CloudFunctionException({required this.code, required this.message});

  @override
  String toString() => 'CloudFunctionException: [$code] $message';
}
