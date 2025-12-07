import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_text_styles.dart';
import '../../services/user_preferences_service.dart';
import '../../services/recipe_service.dart';
import '../recipe/recipe_filters_sheet.dart';
import '../recipe/recipe_results_screen.dart';

/// Home Tab - Main screen with greeting and quick actions
class HomeTab extends StatelessWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Greeting Section
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Consumer<UserPreferencesService>(
                      builder: (context, prefs, _) {
                        final name = prefs.preferences.name ?? 'Chef';
                        return Text(
                          'Hey $name, what\'s for dinner tonight?',
                          style: AppTextStyles.titleLarge,
                        );
                      },
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Let\'s create something delicious',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),

              // Cook with What I Have CTA
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: ElevatedButton(
                  onPressed: () => _showRecipeFilters(context),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.all(20),
                    minimumSize: const Size(double.infinity, 60),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.kitchen, size: 24),
                      const SizedBox(width: 12),
                      Text(
                        'Cook with What I Have',
                        style: AppTextStyles.button.copyWith(fontSize: 16),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 32),

              // Quick Picks Section
              Padding(
                padding: const EdgeInsets.only(left: 24.0),
                child: Text(
                  'Quick Picks',
                  style: AppTextStyles.titleMedium,
                ),
              ),

              const SizedBox(height: 16),

              Consumer<RecipeService>(
                builder: (context, recipeService, _) {
                  final recipes = recipeService.recipes.take(5).toList();
                  return SizedBox(
                    height: 200,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: recipes.length,
                      itemBuilder: (context, index) {
                        final recipe = recipes[index];
                        return _QuickPickCard(
                          title: recipe.title,
                          time: '${recipe.totalTime} min',
                          calories: '${recipe.macros.calories.toInt()} cal',
                        );
                      },
                    ),
                  );
                },
              ),

              const SizedBox(height: 24),

              // Popular Categories
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Popular Categories',
                      style: AppTextStyles.titleMedium,
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: [
                        _CategoryChip(label: 'Breakfast', icon: Icons.breakfast_dining),
                        _CategoryChip(label: 'Lunch', icon: Icons.lunch_dining),
                        _CategoryChip(label: 'Dinner', icon: Icons.dinner_dining),
                        _CategoryChip(label: 'Dessert', icon: Icons.cake),
                        _CategoryChip(label: 'Snacks', icon: Icons.fastfood),
                        _CategoryChip(label: 'Healthy', icon: Icons.eco),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showRecipeFilters(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => RecipeFiltersSheet(
        onGenerate: (filters) {
          final recipeService = context.read<RecipeService>();
          final recipes = recipeService.generateRecipes(filters);
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => RecipeResultsScreen(
                recipes: recipes,
                onRegenerate: () {
                  final newRecipes = recipeService.generateRecipes(filters);
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (context) => RecipeResultsScreen(
                        recipes: newRecipes,
                        onRegenerate: () {},
                      ),
                    ),
                  );
                },
              ),
            ),
          );
        },
      ),
    );
  }
}

class _QuickPickCard extends StatelessWidget {
  final String title;
  final String time;
  final String calories;

  const _QuickPickCard({
    required this.title,
    required this.time,
    required this.calories,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 160,
      margin: const EdgeInsets.symmetric(horizontal: 8),
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 100,
              color: AppColors.surfaceVariant,
              child: const Center(
                child: Icon(
                  Icons.restaurant,
                  size: 40,
                  color: AppColors.textTertiary,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTextStyles.labelLarge,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.access_time, size: 14, color: AppColors.textSecondary),
                      const SizedBox(width: 4),
                      Text(time, style: AppTextStyles.labelSmall),
                      const SizedBox(width: 8),
                      Text(calories, style: AppTextStyles.labelSmall),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final IconData icon;

  const _CategoryChip({
    required this.label,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      avatar: Icon(icon, size: 18, color: AppColors.primary),
      label: Text(label),
      onPressed: () {
        // Navigate to category
      },
      backgroundColor: AppColors.surface,
      side: const BorderSide(color: AppColors.divider),
    );
  }
}
