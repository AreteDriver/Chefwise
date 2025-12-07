/// Pantry item model
class PantryItem {
  final String id;
  final String name;
  final String category;
  final double quantity;
  final String unit;
  final DateTime? expiryDate;

  PantryItem({
    required this.id,
    required this.name,
    required this.category,
    this.quantity = 1.0,
    this.unit = 'unit',
    this.expiryDate,
  });

  PantryItem copyWith({
    String? id,
    String? name,
    String? category,
    double? quantity,
    String? unit,
    DateTime? expiryDate,
  }) {
    return PantryItem(
      id: id ?? this.id,
      name: name ?? this.name,
      category: category ?? this.category,
      quantity: quantity ?? this.quantity,
      unit: unit ?? this.unit,
      expiryDate: expiryDate ?? this.expiryDate,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'category': category,
      'quantity': quantity,
      'unit': unit,
      'expiryDate': expiryDate?.toIso8601String(),
    };
  }

  factory PantryItem.fromJson(Map<String, dynamic> json) {
    return PantryItem(
      id: json['id'],
      name: json['name'],
      category: json['category'],
      quantity: (json['quantity'] ?? 1.0).toDouble(),
      unit: json['unit'] ?? 'unit',
      expiryDate: json['expiryDate'] != null 
          ? DateTime.parse(json['expiryDate']) 
          : null,
    );
  }
}

/// Pantry categories
class PantryCategories {
  static const String proteins = 'Proteins';
  static const String veggies = 'Veggies';
  static const String grains = 'Grains';
  static const String dairy = 'Dairy';
  static const String spices = 'Spices';
  static const String canned = 'Canned Goods';
  static const String frozen = 'Frozen';
  static const String other = 'Other';

  static List<String> get all => [
        proteins,
        veggies,
        grains,
        dairy,
        spices,
        canned,
        frozen,
        other,
      ];
}
