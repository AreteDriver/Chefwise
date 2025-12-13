/// User preferences model for onboarding and profile
class UserPreferences {
  final String? name;
  final List<String> goals;
  final List<String> dietaryNeeds;
  final double cookingConfidence;
  final int typicalCookingTime;
  final List<String> cuisinePreferences;
  final bool hasCompletedOnboarding;

  UserPreferences({
    this.name,
    this.goals = const [],
    this.dietaryNeeds = const [],
    this.cookingConfidence = 3.0,
    this.typicalCookingTime = 30,
    this.cuisinePreferences = const [],
    this.hasCompletedOnboarding = false,
  });

  UserPreferences copyWith({
    String? name,
    List<String>? goals,
    List<String>? dietaryNeeds,
    double? cookingConfidence,
    int? typicalCookingTime,
    List<String>? cuisinePreferences,
    bool? hasCompletedOnboarding,
  }) {
    return UserPreferences(
      name: name ?? this.name,
      goals: goals ?? this.goals,
      dietaryNeeds: dietaryNeeds ?? this.dietaryNeeds,
      cookingConfidence: cookingConfidence ?? this.cookingConfidence,
      typicalCookingTime: typicalCookingTime ?? this.typicalCookingTime,
      cuisinePreferences: cuisinePreferences ?? this.cuisinePreferences,
      hasCompletedOnboarding: hasCompletedOnboarding ?? this.hasCompletedOnboarding,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'goals': goals,
      'dietaryNeeds': dietaryNeeds,
      'cookingConfidence': cookingConfidence,
      'typicalCookingTime': typicalCookingTime,
      'cuisinePreferences': cuisinePreferences,
      'hasCompletedOnboarding': hasCompletedOnboarding,
    };
  }

  factory UserPreferences.fromJson(Map<String, dynamic> json) {
    return UserPreferences(
      name: json['name'],
      goals: List<String>.from(json['goals'] ?? []),
      dietaryNeeds: List<String>.from(json['dietaryNeeds'] ?? []),
      cookingConfidence: (json['cookingConfidence'] ?? 3.0).toDouble(),
      typicalCookingTime: json['typicalCookingTime'] ?? 30,
      cuisinePreferences: List<String>.from(json['cuisinePreferences'] ?? []),
      hasCompletedOnboarding: json['hasCompletedOnboarding'] ?? false,
    );
  }
}
