import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/recipe.dart';
import 'cloud_functions_service.dart';

/// Service for managing recipes with Firestore sync and Cloud Functions
class RecipeService extends ChangeNotifier {
  static const int maxGeneratedRecipes = 3;

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final CloudFunctionsService _cloudFunctions = CloudFunctionsService();

  List<Recipe> _recipes = [];
  bool _isLoading = true;
  bool _isGenerating = false;
  String? _error;
  StreamSubscription<QuerySnapshot>? _firestoreSubscription;
  StreamSubscription<User?>? _authSubscription;

  List<Recipe> get recipes => List.unmodifiable(_recipes);
  bool get isLoading => _isLoading;
  bool get isGenerating => _isGenerating;
  String? get error => _error;

  String? get _userId => _auth.currentUser?.uid;

  RecipeService() {
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
        _recipes = [];
        _isLoading = false;
        notifyListeners();
      }
    });
  }

  /// Load and listen to saved recipes from Firestore
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

      // Set up real-time listener
      _firestoreSubscription = _firestore
          .collection('recipes')
          .where('userId', isEqualTo: userId)
          .orderBy('createdAt', descending: true)
          .snapshots()
          .listen((snapshot) {
        _recipes = snapshot.docs.map((doc) {
          final data = doc.data();
          data['id'] = doc.id;
          return Recipe.fromJson(data);
        }).toList();

        _isLoading = false;
        notifyListeners();
      }, onError: (e) {
        debugPrint('Firestore listen error: $e');
        // Fall back to sample data on error
        _loadSampleRecipes();
      });
    } catch (e) {
      debugPrint('Error setting up Firestore listener: $e');
      _loadSampleRecipes();
    }
  }

  /// Load sample recipes for demo/offline mode
  void _loadSampleRecipes() {
    _recipes = [
      Recipe(
        id: 'r1',
        title: 'Grilled Chicken Salad',
        description:
            'A healthy and protein-packed salad with grilled chicken, fresh vegetables, and a light vinaigrette.',
        ingredients: [
          '2 chicken breasts',
          '4 cups mixed greens',
          '1 cup cherry tomatoes, halved',
          '1/2 cucumber, sliced',
          '1/4 red onion, thinly sliced',
          '2 tbsp olive oil',
          '1 tbsp balsamic vinegar',
          'Salt and pepper to taste',
        ],
        steps: [
          'Season chicken breasts with salt and pepper.',
          'Heat a grill pan over medium-high heat.',
          'Grill chicken for 6-7 minutes per side until cooked through.',
          'Let chicken rest for 5 minutes, then slice.',
          'In a large bowl, combine greens, tomatoes, cucumber, and onion.',
          'Whisk together olive oil and balsamic vinegar.',
          'Add sliced chicken to the salad.',
          'Drizzle with dressing and toss gently.',
        ],
        prepTime: 10,
        cookTime: 20,
        servings: 2,
        macros: RecipeMacros(
          calories: 350,
          protein: 35,
          carbs: 20,
          fat: 12,
          fiber: 5,
          sugar: 8,
          sodium: 300,
        ),
        tags: ['Healthy', 'High Protein', 'Low Carb', 'Quick'],
      ),
      Recipe(
        id: 'r2',
        title: 'Pasta Primavera',
        description:
            'A colorful vegetarian pasta dish loaded with fresh spring vegetables.',
        ingredients: [
          '12 oz pasta (penne or fusilli)',
          '2 cups broccoli florets',
          '1 cup snap peas',
          '1 red bell pepper, sliced',
          '3 cloves garlic, minced',
          '3 tbsp olive oil',
          '1/4 cup Parmesan cheese',
          'Fresh basil for garnish',
        ],
        steps: [
          'Cook pasta according to package directions.',
          'In the last 3 minutes, add broccoli and snap peas to the pasta water.',
          'Drain pasta and vegetables, reserving 1/2 cup pasta water.',
          'Heat olive oil in a large pan over medium heat.',
          'Sauté bell pepper and garlic for 2-3 minutes.',
          'Add drained pasta and vegetables to the pan.',
          'Toss with pasta water to create a light sauce.',
          'Top with Parmesan cheese and fresh basil.',
        ],
        prepTime: 15,
        cookTime: 25,
        servings: 4,
        macros: RecipeMacros(
          calories: 400,
          protein: 12,
          carbs: 65,
          fat: 10,
          fiber: 6,
          sugar: 5,
          sodium: 200,
        ),
        tags: ['Vegetarian', 'Quick', 'Healthy'],
      ),
      Recipe(
        id: 'r3',
        title: 'Veggie Stir Fry',
        description:
            'A quick and easy Asian-inspired stir fry with colorful vegetables.',
        ingredients: [
          '2 cups mixed vegetables (bell peppers, carrots, snap peas)',
          '1 cup mushrooms, sliced',
          '3 cloves garlic, minced',
          '1 tbsp ginger, minced',
          '2 tbsp soy sauce',
          '1 tbsp sesame oil',
          '1 tsp cornstarch',
          'Sesame seeds for garnish',
        ],
        steps: [
          'Mix soy sauce, sesame oil, and cornstarch in a small bowl.',
          'Heat a wok or large pan over high heat.',
          'Add garlic and ginger, stir for 30 seconds.',
          'Add mushrooms and cook for 2 minutes.',
          'Add mixed vegetables and stir fry for 4-5 minutes.',
          'Pour in the sauce mixture.',
          'Toss everything together for 1-2 minutes.',
          'Garnish with sesame seeds and serve.',
        ],
        prepTime: 10,
        cookTime: 15,
        servings: 3,
        macros: RecipeMacros(
          calories: 180,
          protein: 6,
          carbs: 22,
          fat: 8,
          fiber: 5,
          sugar: 10,
          sodium: 600,
        ),
        tags: ['Vegan', 'Quick', 'Low Calorie'],
      ),
    ];
    _isLoading = false;
    notifyListeners();
  }

  /// Generate recipes using AI via Cloud Functions
  Future<List<Recipe>> generateRecipes(Map<String, dynamic> filters) async {
    _isGenerating = true;
    _error = null;
    notifyListeners();

    try {
      // Try to call Cloud Function
      final recipe = await _cloudFunctions.generateRecipe(filters);

      // Save generated recipe to Firestore
      await saveRecipe(recipe);

      _isGenerating = false;
      notifyListeners();
      return [recipe];
    } on CloudFunctionException catch (e) {
      debugPrint('Cloud Function error: $e');
      _error = e.message;
      _isGenerating = false;
      notifyListeners();

      // Fall back to sample recipes
      return _recipes.take(maxGeneratedRecipes).toList();
    } catch (e) {
      debugPrint('Error generating recipes: $e');
      _error = 'Failed to generate recipes. Showing saved recipes instead.';
      _isGenerating = false;
      notifyListeners();

      // Fall back to sample recipes
      return _recipes.take(maxGeneratedRecipes).toList();
    }
  }

  /// Get a recipe by ID
  Recipe? getRecipeById(String id) {
    try {
      return _recipes.firstWhere((recipe) => recipe.id == id);
    } catch (e) {
      return null;
    }
  }

  /// Save a recipe to Firestore
  Future<void> saveRecipe(Recipe recipe) async {
    final userId = _userId;
    if (userId == null) {
      // Offline mode - add locally
      _recipes.insert(0, recipe);
      notifyListeners();
      return;
    }

    try {
      final data = recipe.toJson();
      data['userId'] = userId;
      data['createdAt'] = FieldValue.serverTimestamp();

      await _firestore.collection('recipes').add(data);
      // Real-time listener will update _recipes
    } catch (e) {
      debugPrint('Error saving recipe: $e');
      // Add locally as fallback
      _recipes.insert(0, recipe);
      notifyListeners();
    }
  }

  /// Add a recipe (alias for saveRecipe)
  Future<void> addRecipe(Recipe recipe) => saveRecipe(recipe);

  /// Remove a recipe from Firestore
  Future<void> removeRecipe(String id) async {
    final userId = _userId;
    if (userId == null) {
      // Offline mode - remove locally
      _recipes.removeWhere((recipe) => recipe.id == id);
      notifyListeners();
      return;
    }

    try {
      await _firestore.collection('recipes').doc(id).delete();
      // Real-time listener will update _recipes
    } catch (e) {
      debugPrint('Error removing recipe: $e');
      // Remove locally as fallback
      _recipes.removeWhere((recipe) => recipe.id == id);
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
