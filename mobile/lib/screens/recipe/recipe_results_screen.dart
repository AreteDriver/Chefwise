import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_text_styles.dart';
import '../../models/recipe.dart';
import 'recipe_detail_screen.dart';

/// Recipe results screen showing generated recipes
class RecipeResultsScreen extends StatelessWidget {
  final List<Recipe> recipes;
  final VoidCallback onRegenerate;

  const RecipeResultsScreen({
    super.key,
    required this.recipes,
    required this.onRegenerate,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Recipe Results'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: onRegenerate,
            tooltip: 'Regenerate',
          ),
        ],
      ),
      body: SafeArea(
        child: recipes.isEmpty
            ? _EmptyResults(onRegenerate: onRegenerate)
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: recipes.length,
                itemBuilder: (context, index) {
                  return _RecipeCard(
                    recipe: recipes[index],
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => RecipeDetailScreen(
                            recipe: recipes[index],
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
      ),
    );
  }
}

class _EmptyResults extends StatelessWidget {
  final VoidCallback onRegenerate;

  const _EmptyResults({required this.onRegenerate});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 80,
              color: AppColors.textTertiary,
            ),
            const SizedBox(height: 24),
            Text(
              'No recipes found',
              style: AppTextStyles.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Try adjusting your filters or regenerate',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: onRegenerate,
              icon: const Icon(Icons.refresh),
              label: const Text('Regenerate'),
            ),
          ],
        ),
      ),
    );
  }
}

class _RecipeCard extends StatelessWidget {
  final Recipe recipe;
  final VoidCallback onTap;

  const _RecipeCard({
    required this.recipe,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image placeholder
            Container(
              height: 160,
              color: AppColors.surfaceVariant,
              child: Center(
                child: Icon(
                  Icons.restaurant,
                  size: 60,
                  color: AppColors.textTertiary,
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    recipe.title,
                    style: AppTextStyles.titleSmall,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),

                  const SizedBox(height: 8),

                  // Description
                  if (recipe.description.isNotEmpty)
                    Text(
                      recipe.description,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),

                  const SizedBox(height: 12),

                  // Quick info row
                  Row(
                    children: [
                      Icon(
                        Icons.access_time,
                        size: 16,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${recipe.totalTime} min',
                        style: AppTextStyles.labelSmall,
                      ),
                      const SizedBox(width: 16),
                      Icon(
                        Icons.local_fire_department,
                        size: 16,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${recipe.macros.calories.toInt()} cal',
                        style: AppTextStyles.labelSmall,
                      ),
                      const SizedBox(width: 16),
                      Icon(
                        Icons.restaurant_menu,
                        size: 16,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${recipe.servings} servings',
                        style: AppTextStyles.labelSmall,
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Macros
                  Row(
                    children: [
                      _MacroBadge(
                        label: 'P',
                        value: '${recipe.macros.protein.toInt()}g',
                        color: AppColors.accent,
                      ),
                      const SizedBox(width: 8),
                      _MacroBadge(
                        label: 'C',
                        value: '${recipe.macros.carbs.toInt()}g',
                        color: AppColors.accentSecondary,
                      ),
                      const SizedBox(width: 8),
                      _MacroBadge(
                        label: 'F',
                        value: '${recipe.macros.fat.toInt()}g',
                        color: AppColors.warning,
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Tags
                  if (recipe.tags.isNotEmpty)
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: recipe.tags.take(3).map((tag) {
                        return Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            tag,
                            style: AppTextStyles.labelSmall.copyWith(
                              color: AppColors.primary,
                            ),
                          ),
                        );
                      }).toList(),
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

class _MacroBadge extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _MacroBadge({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: AppTextStyles.labelSmall.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(width: 2),
          Text(
            value,
            style: AppTextStyles.labelSmall.copyWith(
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
