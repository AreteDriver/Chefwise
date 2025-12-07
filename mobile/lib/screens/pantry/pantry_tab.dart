import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_text_styles.dart';
import '../../services/pantry_service.dart';
import '../../models/pantry_item.dart';

/// Pantry Tab - Manage pantry inventory
class PantryTab extends StatefulWidget {
  const PantryTab({super.key});

  @override
  State<PantryTab> createState() => _PantryTabState();
}

class _PantryTabState extends State<PantryTab> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'My Pantry',
                    style: AppTextStyles.titleLarge,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'The more you add, the smarter ChefWise gets',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),

            // Search Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: TextField(
                decoration: const InputDecoration(
                  hintText: 'Search pantry items...',
                  prefixIcon: Icon(Icons.search),
                ),
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                  });
                },
              ),
            ),

            const SizedBox(height: 16),

            // Pantry Items by Category
            Expanded(
              child: Consumer<PantryService>(
                builder: (context, pantryService, _) {
                  final items = _searchQuery.isEmpty
                      ? pantryService.itemsByCategory
                      : _groupSearchResults(
                          pantryService.searchItems(_searchQuery));

                  return ListView.builder(
                    itemCount: items.length,
                    itemBuilder: (context, index) {
                      final category = items.keys.elementAt(index);
                      final categoryItems = items[category]!;

                      if (categoryItems.isEmpty) {
                        return const SizedBox.shrink();
                      }

                      return _CategorySection(
                        category: category,
                        items: categoryItems,
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddItemSheet(context),
        icon: const Icon(Icons.add),
        label: const Text('Add Item'),
      ),
    );
  }

  Map<String, List<PantryItem>> _groupSearchResults(List<PantryItem> items) {
    final Map<String, List<PantryItem>> grouped = {};
    for (var item in items) {
      if (!grouped.containsKey(item.category)) {
        grouped[item.category] = [];
      }
      grouped[item.category]!.add(item);
    }
    return grouped;
  }

  void _showAddItemSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => const _AddItemSheet(),
    );
  }
}

class _CategorySection extends StatelessWidget {
  final String category;
  final List<PantryItem> items;

  const _CategorySection({
    required this.category,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          child: Text(
            category,
            style: AppTextStyles.titleSmall.copyWith(
              color: AppColors.primary,
            ),
          ),
        ),
        ...items.map((item) => _PantryItemTile(item: item)),
        const Divider(height: 1),
      ],
    );
  }
}

class _PantryItemTile extends StatelessWidget {
  final PantryItem item;

  const _PantryItemTile({required this.item});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: AppColors.surfaceVariant,
        child: Icon(
          _getCategoryIcon(item.category),
          color: AppColors.primary,
        ),
      ),
      title: Text(item.name, style: AppTextStyles.bodyLarge),
      subtitle: Text(
        '${item.quantity} ${item.unit}',
        style: AppTextStyles.bodySmall,
      ),
      trailing: IconButton(
        icon: const Icon(Icons.more_vert),
        onPressed: () {
          // Show edit/delete options
        },
      ),
    );
  }

  IconData _getCategoryIcon(String category) {
    switch (category) {
      case PantryCategories.proteins:
        return Icons.set_meal;
      case PantryCategories.veggies:
        return Icons.eco;
      case PantryCategories.grains:
        return Icons.grain;
      case PantryCategories.dairy:
        return Icons.water_drop;
      case PantryCategories.spices:
        return Icons.spa;
      case PantryCategories.canned:
        return Icons.inventory_2;
      case PantryCategories.frozen:
        return Icons.ac_unit;
      default:
        return Icons.shopping_basket;
    }
  }
}

class _AddItemSheet extends StatefulWidget {
  const _AddItemSheet();

  @override
  State<_AddItemSheet> createState() => _AddItemSheetState();
}

class _AddItemSheetState extends State<_AddItemSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _quantityController = TextEditingController(text: '1');
  final _unitController = TextEditingController(text: 'unit');
  String _selectedCategory = PantryCategories.other;

  @override
  void dispose() {
    _nameController.dispose();
    _quantityController.dispose();
    _unitController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 24,
        right: 24,
        top: 24,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Add Pantry Item', style: AppTextStyles.titleMedium),
            const SizedBox(height: 24),
            
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Item Name'),
              validator: (value) =>
                  value?.isEmpty ?? true ? 'Please enter a name' : null,
            ),
            
            const SizedBox(height: 16),
            
            DropdownButtonFormField<String>(
              value: _selectedCategory,
              decoration: const InputDecoration(labelText: 'Category'),
              items: PantryCategories.all
                  .map((cat) => DropdownMenuItem(
                        value: cat,
                        child: Text(cat),
                      ))
                  .toList(),
              onChanged: (value) {
                setState(() {
                  _selectedCategory = value!;
                });
              },
            ),
            
            const SizedBox(height: 16),
            
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _quantityController,
                    decoration: const InputDecoration(labelText: 'Quantity'),
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _unitController,
                    decoration: const InputDecoration(labelText: 'Unit'),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 24),
            
            ElevatedButton(
              onPressed: _addItem,
              child: const Text('Add Item'),
            ),
            
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _addItem() {
    if (_formKey.currentState?.validate() ?? false) {
      final pantryService = context.read<PantryService>();
      final item = PantryItem(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        name: _nameController.text,
        category: _selectedCategory,
        quantity: double.tryParse(_quantityController.text) ?? 1.0,
        unit: _unitController.text,
      );
      pantryService.addItem(item);
      Navigator.pop(context);
    }
  }
}
