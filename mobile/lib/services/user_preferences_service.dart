import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_preferences.dart';

/// Service for managing user preferences and onboarding state
class UserPreferencesService extends ChangeNotifier {
  static const String _prefsKey = 'user_preferences';
  
  UserPreferences _preferences = UserPreferences();
  bool _isLoading = true;

  UserPreferences get preferences => _preferences;
  bool get isLoading => _isLoading;
  bool get hasCompletedOnboarding => _preferences.hasCompletedOnboarding;

  UserPreferencesService() {
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonString = prefs.getString(_prefsKey);
      
      if (jsonString != null) {
        final json = jsonDecode(jsonString);
        _preferences = UserPreferences.fromJson(json);
      }
    } catch (e) {
      debugPrint('Error loading preferences: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updatePreferences(UserPreferences newPreferences) async {
    _preferences = newPreferences;
    notifyListeners();
    
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonString = jsonEncode(_preferences.toJson());
      await prefs.setString(_prefsKey, jsonString);
    } catch (e) {
      debugPrint('Error saving preferences: $e');
    }
  }

  Future<void> updateName(String name) async {
    await updatePreferences(_preferences.copyWith(name: name));
  }

  Future<void> updateGoals(List<String> goals) async {
    await updatePreferences(_preferences.copyWith(goals: goals));
  }

  Future<void> updateDietaryNeeds(List<String> needs) async {
    await updatePreferences(_preferences.copyWith(dietaryNeeds: needs));
  }

  Future<void> updateCookingConfidence(double confidence) async {
    await updatePreferences(_preferences.copyWith(cookingConfidence: confidence));
  }

  Future<void> updateCookingTime(int time) async {
    await updatePreferences(_preferences.copyWith(typicalCookingTime: time));
  }

  Future<void> updateCuisinePreferences(List<String> cuisines) async {
    await updatePreferences(_preferences.copyWith(cuisinePreferences: cuisines));
  }

  Future<void> completeOnboarding() async {
    await updatePreferences(_preferences.copyWith(hasCompletedOnboarding: true));
  }

  Future<void> resetOnboarding() async {
    _preferences = UserPreferences();
    notifyListeners();
    
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_prefsKey);
    } catch (e) {
      debugPrint('Error resetting preferences: $e');
    }
  }
}
