import 'package:flutter/foundation.dart';
import '../models/pantry_item.dart';

/// Service for managing pantry inventory
class PantryService extends ChangeNotifier {
  final List<PantryItem> _items = [];
  
  List<PantryItem> get items => List.unmodifiable(_items);
  
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
    _loadSampleData();
  }

  void _loadSampleData() {
    _items.addAll([
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
    ]);
  }

  void addItem(PantryItem item) {
    _items.add(item);
    notifyListeners();
  }

  void updateItem(PantryItem item) {
    final index = _items.indexWhere((i) => i.id == item.id);
    if (index != -1) {
      _items[index] = item;
      notifyListeners();
    }
  }

  void removeItem(String id) {
    _items.removeWhere((item) => item.id == id);
    notifyListeners();
  }

  List<PantryItem> searchItems(String query) {
    if (query.isEmpty) return items;
    
    final lowerQuery = query.toLowerCase();
    return _items.where((item) {
      return item.name.toLowerCase().contains(lowerQuery) ||
          item.category.toLowerCase().contains(lowerQuery);
    }).toList();
  }
}
