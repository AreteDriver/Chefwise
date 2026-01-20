import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/pantry_item.dart';

/// Service for managing pantry inventory with Firestore sync
class PantryService extends ChangeNotifier {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  List<PantryItem> _items = [];
  bool _isLoading = true;
  StreamSubscription<QuerySnapshot>? _firestoreSubscription;
  StreamSubscription<User?>? _authSubscription;

  List<PantryItem> get items => List.unmodifiable(_items);
  bool get isLoading => _isLoading;

  String? get _userId => _auth.currentUser?.uid;

  Map<String, List<PantryItem>> get itemsByCategory {
    final Map<String, List<PantryItem>> grouped = {};

    for (var category in PantryCategories.all) {
      grouped[category] = [];
    }

    for (var item in _items) {
      if (grouped.containsKey(item.category)) {
        grouped[item.category]!.add(item);
      } else {
        grouped[PantryCategories.other]!.add(item);
      }
    }

    return grouped;
  }

  PantryService() {
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
        _items = [];
        _isLoading = false;
        notifyListeners();
      }
    });
  }

  /// Load and listen to pantry items from Firestore
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
          .collection('pantryItems')
          .where('userId', isEqualTo: userId)
          .orderBy('name')
          .snapshots()
          .listen((snapshot) {
        _items = snapshot.docs.map((doc) {
          final data = doc.data();
          data['id'] = doc.id; // Include document ID
          return PantryItem.fromJson(data);
        }).toList();

        _isLoading = false;
        notifyListeners();
      }, onError: (e) {
        debugPrint('Firestore listen error: $e');
        // Fall back to sample data on error
        _loadSampleData();
      });
    } catch (e) {
      debugPrint('Error setting up Firestore listener: $e');
      _loadSampleData();
    }
  }

  /// Load sample data for demo/offline mode
  void _loadSampleData() {
    _items = [
      PantryItem(
        id: '1',
        name: 'Chicken Breast',
        category: PantryCategories.proteins,
        quantity: 2,
        unit: 'lbs',
      ),
      PantryItem(
        id: '2',
        name: 'Broccoli',
        category: PantryCategories.veggies,
        quantity: 1,
        unit: 'bunch',
      ),
      PantryItem(
        id: '3',
        name: 'Rice',
        category: PantryCategories.grains,
        quantity: 5,
        unit: 'cups',
      ),
      PantryItem(
        id: '4',
        name: 'Milk',
        category: PantryCategories.dairy,
        quantity: 1,
        unit: 'gallon',
      ),
      PantryItem(
        id: '5',
        name: 'Garlic',
        category: PantryCategories.spices,
        quantity: 3,
        unit: 'cloves',
      ),
    ];
    _isLoading = false;
    notifyListeners();
  }

  /// Add a new item to the pantry
  Future<void> addItem(PantryItem item) async {
    final userId = _userId;
    if (userId == null) {
      // Offline mode - add locally
      _items.add(item);
      notifyListeners();
      return;
    }

    try {
      final data = item.toJson();
      data['userId'] = userId;
      data['createdAt'] = FieldValue.serverTimestamp();

      await _firestore.collection('pantryItems').add(data);
      // Real-time listener will update _items
    } catch (e) {
      debugPrint('Error adding pantry item: $e');
      // Add locally as fallback
      _items.add(item);
      notifyListeners();
    }
  }

  /// Update an existing item
  Future<void> updateItem(PantryItem item) async {
    final userId = _userId;
    if (userId == null) {
      // Offline mode - update locally
      final index = _items.indexWhere((i) => i.id == item.id);
      if (index != -1) {
        _items[index] = item;
        notifyListeners();
      }
      return;
    }

    try {
      final data = item.toJson();
      data['userId'] = userId;
      data['updatedAt'] = FieldValue.serverTimestamp();

      await _firestore.collection('pantryItems').doc(item.id).update(data);
      // Real-time listener will update _items
    } catch (e) {
      debugPrint('Error updating pantry item: $e');
      // Update locally as fallback
      final index = _items.indexWhere((i) => i.id == item.id);
      if (index != -1) {
        _items[index] = item;
        notifyListeners();
      }
    }
  }

  /// Remove an item from the pantry
  Future<void> removeItem(String id) async {
    final userId = _userId;
    if (userId == null) {
      // Offline mode - remove locally
      _items.removeWhere((item) => item.id == id);
      notifyListeners();
      return;
    }

    try {
      await _firestore.collection('pantryItems').doc(id).delete();
      // Real-time listener will update _items
    } catch (e) {
      debugPrint('Error removing pantry item: $e');
      // Remove locally as fallback
      _items.removeWhere((item) => item.id == id);
      notifyListeners();
    }
  }

  /// Search items by name or category
  List<PantryItem> searchItems(String query) {
    if (query.isEmpty) return items;

    final lowerQuery = query.toLowerCase();
    return _items.where((item) {
      return item.name.toLowerCase().contains(lowerQuery) ||
          item.category.toLowerCase().contains(lowerQuery);
    }).toList();
  }

  @override
  void dispose() {
    _firestoreSubscription?.cancel();
    _authSubscription?.cancel();
    super.dispose();
  }
}
