import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/user_preferences.dart';

/// Service for managing user preferences with Firestore sync
class UserPreferencesService extends ChangeNotifier {
  static const String _localPrefsKey = 'user_preferences';

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  UserPreferences _preferences = UserPreferences();
  bool _isLoading = true;
  StreamSubscription<DocumentSnapshot>? _firestoreSubscription;
  StreamSubscription<User?>? _authSubscription;

  UserPreferences get preferences => _preferences;
  bool get isLoading => _isLoading;
  bool get hasCompletedOnboarding => _preferences.hasCompletedOnboarding;

  String? get _userId => _auth.currentUser?.uid;

  UserPreferencesService() {
    _init();
  }

  void _init() {
    // Listen to auth state changes to refresh data when user changes
    _authSubscription = _auth.authStateChanges().listen((User? user) {
      if (user != null) {
        _loadFromFirestore();
      } else {
        // User signed out - reset to local-only mode
        _firestoreSubscription?.cancel();
        _loadFromLocal();
      }
    });

    // Initial load from local while waiting for auth
    _loadFromLocal();
  }

  /// Load preferences from local storage (for offline/initial load)
  Future<void> _loadFromLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonString = prefs.getString(_localPrefsKey);

      if (jsonString != null) {
        final json = jsonDecode(jsonString);
        _preferences = UserPreferences.fromJson(json);
      }
    } catch (e) {
      debugPrint('Error loading local preferences: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Load and listen to preferences from Firestore
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
          .collection('users')
          .doc(userId)
          .snapshots()
          .listen((snapshot) {
        if (snapshot.exists) {
          final data = snapshot.data()!;
          _preferences = UserPreferences.fromJson(data);
          _saveToLocal(); // Cache locally for offline
        } else {
          // Document doesn't exist - check if we have local onboarding data to merge
          if (_preferences.hasCompletedOnboarding) {
            // User completed onboarding offline - sync to Firestore
            _saveToFirestore();
          }
        }
        _isLoading = false;
        notifyListeners();
      }, onError: (e) {
        debugPrint('Firestore listen error: $e');
        _isLoading = false;
        notifyListeners();
      });
    } catch (e) {
      debugPrint('Error setting up Firestore listener: $e');
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Save preferences to Firestore
  Future<void> _saveToFirestore() async {
    final userId = _userId;
    if (userId == null) return;

    try {
      await _firestore.collection('users').doc(userId).set(
            _preferences.toJson(),
            SetOptions(merge: true),
          );
    } catch (e) {
      debugPrint('Error saving to Firestore: $e');
    }
  }

  /// Save preferences to local storage (for offline cache)
  Future<void> _saveToLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonString = jsonEncode(_preferences.toJson());
      await prefs.setString(_localPrefsKey, jsonString);
    } catch (e) {
      debugPrint('Error saving local preferences: $e');
    }
  }

  /// Update preferences and sync to both local and Firestore
  Future<void> updatePreferences(UserPreferences newPreferences) async {
    _preferences = newPreferences;
    notifyListeners();

    // Save to both local cache and Firestore
    await Future.wait([
      _saveToLocal(),
      _saveToFirestore(),
    ]);
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

  /// Reset all preferences (sign out flow)
  Future<void> resetOnboarding() async {
    _preferences = UserPreferences();
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_localPrefsKey);
    } catch (e) {
      debugPrint('Error resetting preferences: $e');
    }
  }

  @override
  void dispose() {
    _firestoreSubscription?.cancel();
    _authSubscription?.cancel();
    super.dispose();
  }
}
