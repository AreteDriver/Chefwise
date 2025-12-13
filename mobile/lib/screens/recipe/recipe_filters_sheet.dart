import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_text_styles.dart';
import '../../models/recipe.dart';

/// Recipe generation filter bottom sheet
class RecipeFiltersSheet extends StatefulWidget {
  final Function(Map<String, dynamic>) onGenerate;

  const RecipeFiltersSheet({
    super.key,
    required this.onGenerate,
  });

  @override
  State<RecipeFiltersSheet> createState() => _RecipeFiltersSheetState();
}

class _RecipeFiltersSheetState extends State<RecipeFiltersSheet> {
  String _mealType = 'Any';
  String _difficulty = 'Any';
  int _maxTime = 60;
  final Set<String> _selectedTags = {};

  final List<String> _mealTypes = ['Any', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'];
  final List<String> _difficulties = ['Any', 'Easy', 'Medium', 'Hard'];
  final List<String> _availableTags = [
    'Healthy',
    'Quick',
    'High Protein',
    'Low Carb',
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Customize Recipe',
                style: AppTextStyles.titleMedium,
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Meal Type
          Text('Meal Type', style: AppTextStyles.labelLarge),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _mealTypes.map((type) {
              final isSelected = _mealType == type;
              return ChoiceChip(
                label: Text(type),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    _mealType = type;
                  });
                },
                selectedColor: AppColors.primary,
                labelStyle: AppTextStyles.labelMedium.copyWith(
                  color: isSelected ? Colors.white : AppColors.textPrimary,
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 24),

          // Difficulty
          Text('Difficulty', style: AppTextStyles.labelLarge),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _difficulties.map((diff) {
              final isSelected = _difficulty == diff;
              return ChoiceChip(
                label: Text(diff),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    _difficulty = diff;
                  });
                },
                selectedColor: AppColors.primary,
                labelStyle: AppTextStyles.labelMedium.copyWith(
                  color: isSelected ? Colors.white : AppColors.textPrimary,
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 24),

          // Max Time
          Text('Max Cooking Time', style: AppTextStyles.labelLarge),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Slider(
                  value: _maxTime.toDouble(),
                  min: 15,
                  max: 120,
                  divisions: 21,
                  label: '$_maxTime min',
                  activeColor: AppColors.primary,
                  onChanged: (value) {
                    setState(() {
                      _maxTime = value.toInt();
                    });
                  },
                ),
              ),
              Text(
                '$_maxTime min',
                style: AppTextStyles.bodyLarge.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Tags
          Text('Tags', style: AppTextStyles.labelLarge),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _availableTags.map((tag) {
              final isSelected = _selectedTags.contains(tag);
              return FilterChip(
                label: Text(tag),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _selectedTags.add(tag);
                    } else {
                      _selectedTags.remove(tag);
                    }
                  });
                },
                selectedColor: AppColors.primary,
                labelStyle: AppTextStyles.labelMedium.copyWith(
                  color: isSelected ? Colors.white : AppColors.textPrimary,
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 32),

          // Generate Button
          ElevatedButton(
            onPressed: _generateRecipe,
            child: const Text('Generate Recipe'),
          ),

          const SizedBox(height: 16),
        ],
      ),
    );
  }

  void _generateRecipe() {
    widget.onGenerate({
      'mealType': _mealType,
      'difficulty': _difficulty,
      'maxTime': _maxTime,
      'tags': _selectedTags.toList(),
    });
    Navigator.pop(context);
  }
}
