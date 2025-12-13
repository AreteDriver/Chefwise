import 'package:flutter/foundation.dart';
import '../models/recipe.dart';

/// Service for managing recipes
class RecipeService extends ChangeNotifier {
  static const int maxGeneratedRecipes = 3;
  
  final List<Recipe> _recipes = [];
  
  List<Recipe> get recipes => List.unmodifiable(_recipes);

  RecipeService() {
    _loadSampleRecipes();
  }

  void _loadSampleRecipes() {
    _recipes.addAll([
      Recipe(
        id: 'r1',
        title: 'Grilled Chicken Salad',
        description: 'A healthy and protein-packed salad with grilled chicken, fresh vegetables, and a light vinaigrette.',
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
        description: 'A colorful vegetarian pasta dish loaded with fresh spring vegetables.',
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
        description: 'A quick and easy Asian-inspired stir fry with colorful vegetables.',
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
      Recipe(
        id: 'r4',
        title: 'Salmon Bowl',
        description: 'A nutritious bowl with pan-seared salmon, quinoa, and fresh vegetables.',
        ingredients: [
          '2 salmon fillets (6 oz each)',
          '1 cup cooked quinoa',
          '1 avocado, sliced',
          '1 cup edamame',
          '1/2 cup shredded carrots',
          '2 tbsp soy sauce',
          '1 tbsp honey',
          'Sesame seeds and green onions for garnish',
        ],
        steps: [
          'Season salmon with salt and pepper.',
          'Heat a pan over medium-high heat.',
          'Cook salmon skin-side down for 4 minutes.',
          'Flip and cook for another 3-4 minutes.',
          'Divide quinoa between two bowls.',
          'Top with salmon, avocado, edamame, and carrots.',
          'Mix soy sauce and honey for the dressing.',
          'Drizzle dressing over bowls and garnish.',
        ],
        prepTime: 10,
        cookTime: 15,
        servings: 2,
        macros: RecipeMacros(
          calories: 550,
          protein: 40,
          carbs: 45,
          fat: 22,
          fiber: 10,
          sugar: 8,
          sodium: 650,
        ),
        tags: ['High Protein', 'Healthy', 'Omega-3'],
      ),
      Recipe(
        id: 'r5',
        title: 'Quinoa Salad',
        description: 'A refreshing Mediterranean-inspired quinoa salad.',
        ingredients: [
          '1 cup quinoa, cooked',
          '1 cup cherry tomatoes, halved',
          '1 cucumber, diced',
          '1/2 cup feta cheese, crumbled',
          '1/4 cup olives, sliced',
          '2 tbsp lemon juice',
          '2 tbsp olive oil',
          'Fresh parsley, chopped',
        ],
        steps: [
          'Cook quinoa according to package directions and let cool.',
          'In a large bowl, combine cooled quinoa, tomatoes, and cucumber.',
          'Add feta cheese and olives.',
          'Whisk together lemon juice and olive oil.',
          'Pour dressing over the salad.',
          'Toss gently to combine.',
          'Garnish with fresh parsley.',
          'Chill for 15 minutes before serving (optional).',
        ],
        prepTime: 15,
        cookTime: 20,
        servings: 4,
        macros: RecipeMacros(
          calories: 280,
          protein: 10,
          carbs: 32,
          fat: 12,
          fiber: 5,
          sugar: 4,
          sodium: 350,
        ),
        tags: ['Vegetarian', 'Healthy', 'Mediterranean', 'Meal Prep'],
      ),
    ]);
  }

  List<Recipe> generateRecipes(Map<String, dynamic> filters) {
    // In a real app, this would call an AI service
    // For now, return filtered sample recipes
    notifyListeners();
    return _recipes.take(maxGeneratedRecipes).toList();
  }

  Recipe? getRecipeById(String id) {
    try {
      return _recipes.firstWhere((recipe) => recipe.id == id);
    } catch (e) {
      return null;
    }
  }

  void addRecipe(Recipe recipe) {
    _recipes.add(recipe);
    notifyListeners();
  }

  void removeRecipe(String id) {
    _recipes.removeWhere((recipe) => recipe.id == id);
    notifyListeners();
  }
}
