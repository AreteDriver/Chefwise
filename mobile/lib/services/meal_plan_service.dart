import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/meal_plan.dart';
import '../models/recipe.dart';
import 'cloud_functions_service.dart';

/// Service for managing meal plans with Firestore sync and Cloud Functions
class MealPlanService extends ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final CloudFunctionsService _cloudFunctions = CloudFunctionsService();

  MealPlan? _currentPlan;
  bool _isLoading = true;
  bool _isGenerating = false;
  String? _error;
  StreamSubscription<QuerySnapshot>? _firestoreSubscription;
  StreamSubscription<User?>? _authSubscription;

  MealPlan? get currentPlan => _currentPlan;
  bool get hasPlan => _currentPlan != null;
  bool get isLoading => _isLoading;
  bool get isGenerating => _isGenerating;
  String? get error => _error;

  String? get _userId => _auth.currentUser?.uid;

  MealPlanService() {
    _init();
  }

  void _init() {
    // Listen to auth state changes
    _authSubscription = _auth.authStateChanges().listen((User? user) {
      if (user != null) {
        _loadFromFirestore();
      } else {
        // User signed out
        _firestoreSubscription?.cancel();
        _currentPlan = null;
        _isLoading = false;
        notifyListeners();
      }
    });
  }

  /// Load and listen to meal plans from Firestore
  Future<void> _loadFromFirestore() async {
    final userId = _userId;
    if (userId == null) {
      _isLoading = false;
      notifyListeners();
      return;
    }

    // Cancel any existing subscription
    await _firestoreSubscription?.cancel();

    try {
      _isLoading = true;
      notifyListeners();

      // Get the most recent meal plan for this user
      _firestoreSubscription = _firestore
          .collection('mealPlans')
          .where('userId', isEqualTo: userId)
          .orderBy('startDate', descending: true)
          .limit(1)
          .snapshots()
          .listen((snapshot) {
        if (snapshot.docs.isNotEmpty) {
          final doc = snapshot.docs.first;
          final data = doc.data();
          data['id'] = doc.id;
          _currentPlan = MealPlan.fromJson(data);
        } else {
          _currentPlan = null;
        }

        _isLoading = false;
        notifyListeners();
      }, onError: (e) {
        debugPrint('Firestore listen error: $e');
        // Fall back to sample data on error
        _loadSamplePlan();
      });
    } catch (e) {
      debugPrint('Error setting up Firestore listener: $e');
      _loadSamplePlan();
    }
  }

  /// Load sample meal plan for demo/offline mode
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

    _isLoading = false;
    notifyListeners();
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

  /// Generate a new meal plan using AI via Cloud Functions
  Future<void> generateNewPlan({Map<String, dynamic>? params}) async {
    _isGenerating = true;
    _error = null;
    notifyListeners();

    try {
      // Try to call Cloud Function
      final plan = await _cloudFunctions.generateMealPlan(params ?? {});

      // Save generated plan to Firestore
      await _savePlanToFirestore(plan);

      _isGenerating = false;
      notifyListeners();
    } on CloudFunctionException catch (e) {
      debugPrint('Cloud Function error: $e');
      _error = e.message;
      _isGenerating = false;

      // Fall back to sample plan
      _loadSamplePlan();
    } catch (e) {
      debugPrint('Error generating meal plan: $e');
      _error = 'Failed to generate meal plan. Using sample plan instead.';
      _isGenerating = false;

      // Fall back to sample plan
      _loadSamplePlan();
    }
  }

  /// Save meal plan to Firestore
  Future<void> _savePlanToFirestore(MealPlan plan) async {
    final userId = _userId;
    if (userId == null) {
      _currentPlan = plan;
      notifyListeners();
      return;
    }

    try {
      final data = plan.toJson();
      data['userId'] = userId;
      data['createdAt'] = FieldValue.serverTimestamp();

      await _firestore.collection('mealPlans').add(data);
      // Real-time listener will update _currentPlan
    } catch (e) {
      debugPrint('Error saving meal plan: $e');
      // Set locally as fallback
      _currentPlan = plan;
      notifyListeners();
    }
  }

  /// Update macro targets for the current plan
  Future<void> updateTargets(MacroTargets newTargets) async {
    if (_currentPlan == null) return;

    final updatedPlan = MealPlan(
      id: _currentPlan!.id,
      dailyMeals: _currentPlan!.dailyMeals,
      targets: newTargets,
      startDate: _currentPlan!.startDate,
    );

    final userId = _userId;
    if (userId == null || _currentPlan!.id == 'mp1') {
      // Offline or sample plan - update locally
      _currentPlan = updatedPlan;
      notifyListeners();
      return;
    }

    try {
      await _firestore.collection('mealPlans').doc(_currentPlan!.id).update({
        'targets': newTargets.toJson(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      // Real-time listener will update _currentPlan
    } catch (e) {
      debugPrint('Error updating targets: $e');
      // Update locally as fallback
      _currentPlan = updatedPlan;
      notifyListeners();
    }
  }

  /// Clear any error message
  void clearError() {
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _firestoreSubscription?.cancel();
    _authSubscription?.cancel();
    super.dispose();
  }
}
