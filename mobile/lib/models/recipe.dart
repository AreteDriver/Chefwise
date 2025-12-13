/// Recipe model
class Recipe {
  final String id;
  final String title;
  final String description;
  final List<String> ingredients;
  final List<String> steps;
  final int prepTime;
  final int cookTime;
  final int servings;
  final RecipeMacros macros;
  final List<String> tags;
  final String? imageUrl;

  Recipe({
    required this.id,
    required this.title,
    this.description = '',
    required this.ingredients,
    required this.steps,
    this.prepTime = 0,
    this.cookTime = 0,
    this.servings = 4,
    required this.macros,
    this.tags = const [],
    this.imageUrl,
  });

  int get totalTime => prepTime + cookTime;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'ingredients': ingredients,
      'steps': steps,
      'prepTime': prepTime,
      'cookTime': cookTime,
      'servings': servings,
      'macros': macros.toJson(),
      'tags': tags,
      'imageUrl': imageUrl,
    };
  }

  factory Recipe.fromJson(Map<String, dynamic> json) {
    return Recipe(
      id: json['id'],
      title: json['title'],
      description: json['description'] ?? '',
      ingredients: List<String>.from(json['ingredients'] ?? []),
      steps: List<String>.from(json['steps'] ?? []),
      prepTime: json['prepTime'] ?? 0,
      cookTime: json['cookTime'] ?? 0,
      servings: json['servings'] ?? 4,
      macros: RecipeMacros.fromJson(json['macros'] ?? {}),
      tags: List<String>.from(json['tags'] ?? []),
      imageUrl: json['imageUrl'],
    );
  }
}

/// Recipe macros model
class RecipeMacros {
  final double calories;
  final double protein;
  final double carbs;
  final double fat;
  final double fiber;
  final double sugar;
  final double sodium;

  RecipeMacros({
    this.calories = 0,
    this.protein = 0,
    this.carbs = 0,
    this.fat = 0,
    this.fiber = 0,
    this.sugar = 0,
    this.sodium = 0,
  });

  Map<String, dynamic> toJson() {
    return {
      'calories': calories,
      'protein': protein,
      'carbs': carbs,
      'fat': fat,
      'fiber': fiber,
      'sugar': sugar,
      'sodium': sodium,
    };
  }

  factory RecipeMacros.fromJson(Map<String, dynamic> json) {
    return RecipeMacros(
      calories: (json['calories'] ?? 0).toDouble(),
      protein: (json['protein'] ?? 0).toDouble(),
      carbs: (json['carbs'] ?? 0).toDouble(),
      fat: (json['fat'] ?? 0).toDouble(),
      fiber: (json['fiber'] ?? 0).toDouble(),
      sugar: (json['sugar'] ?? 0).toDouble(),
      sodium: (json['sodium'] ?? 0).toDouble(),
    );
  }
}
