import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_text_styles.dart';
import '../../models/recipe.dart';
import 'cook_mode_screen.dart';

/// Recipe detail screen showing full recipe information
class RecipeDetailScreen extends StatefulWidget {
  final Recipe recipe;

  const RecipeDetailScreen({
    super.key,
    required this.recipe,
  });

  @override
  State<RecipeDetailScreen> createState() => _RecipeDetailScreenState();
}

class _RecipeDetailScreenState extends State<RecipeDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final Set<int> _checkedIngredients = {};

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App Bar with image
          SliverAppBar(
            expandedHeight: 250,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                widget.recipe.title,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  shadows: [
                    Shadow(
                      color: Colors.black45,
                      blurRadius: 10,
                    ),
                  ],
                ),
              ),
              background: Container(
                color: AppColors.primary,
                child: const Center(
                  child: Icon(
                    Icons.restaurant,
                    size: 80,
                    color: Colors.white54,
                  ),
                ),
              ),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Quick Info
                _QuickInfo(recipe: widget.recipe),

                const Divider(height: 1),

                // Macros
                _MacrosSection(macros: widget.recipe.macros),

                const Divider(height: 1),

                // Tabs
                TabBar(
                  controller: _tabController,
                  labelColor: AppColors.primary,
                  unselectedLabelColor: AppColors.textSecondary,
                  indicatorColor: AppColors.primary,
                  labelStyle: AppTextStyles.labelLarge,
                  tabs: const [
                    Tab(text: 'Ingredients'),
                    Tab(text: 'Steps'),
                  ],
                ),

                SizedBox(
                  height: MediaQuery.of(context).size.height * 0.6,
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _IngredientsTab(
                        ingredients: widget.recipe.ingredients,
                        checkedIngredients: _checkedIngredients,
                        onToggle: (index) {
                          setState(() {
                            if (_checkedIngredients.contains(index)) {
                              _checkedIngredients.remove(index);
                            } else {
                              _checkedIngredients.add(index);
                            }
                          });
                        },
                      ),
                      _StepsTab(steps: widget.recipe.steps),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 8,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: ElevatedButton.icon(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => CookModeScreen(recipe: widget.recipe),
                ),
              );
            },
            icon: const Icon(Icons.play_arrow),
            label: const Text('Start Cooking'),
            style: ElevatedButton.styleFrom(
              minimumSize: const Size(double.infinity, 50),
            ),
          ),
        ),
      ),
    );
  }
}

class _QuickInfo extends StatelessWidget {
  final Recipe recipe;

  const _QuickInfo({required this.recipe});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _InfoItem(
            icon: Icons.access_time,
            label: 'Prep',
            value: '${recipe.prepTime} min',
          ),
          _InfoItem(
            icon: Icons.timer,
            label: 'Cook',
            value: '${recipe.cookTime} min',
          ),
          _InfoItem(
            icon: Icons.restaurant_menu,
            label: 'Servings',
            value: '${recipe.servings}',
          ),
          _InfoItem(
            icon: Icons.local_fire_department,
            label: 'Calories',
            value: '${recipe.macros.calories.toInt()}',
          ),
        ],
      ),
    );
  }
}

class _InfoItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoItem({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: AppColors.primary, size: 28),
        const SizedBox(height: 4),
        Text(
          label,
          style: AppTextStyles.labelSmall.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        Text(
          value,
          style: AppTextStyles.labelLarge,
        ),
      ],
    );
  }
}

class _MacrosSection extends StatelessWidget {
  final RecipeMacros macros;

  const _MacrosSection({required this.macros});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Nutrition per Serving', style: AppTextStyles.titleSmall),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _MacroColumn(
                label: 'Protein',
                value: '${macros.protein.toInt()}g',
                color: AppColors.accent,
              ),
              _MacroColumn(
                label: 'Carbs',
                value: '${macros.carbs.toInt()}g',
                color: AppColors.accentSecondary,
              ),
              _MacroColumn(
                label: 'Fat',
                value: '${macros.fat.toInt()}g',
                color: AppColors.warning,
              ),
              if (macros.fiber > 0)
                _MacroColumn(
                  label: 'Fiber',
                  value: '${macros.fiber.toInt()}g',
                  color: AppColors.success,
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MacroColumn extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _MacroColumn({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: AppTextStyles.titleSmall.copyWith(
            color: color,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: AppTextStyles.labelSmall.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
}

class _IngredientsTab extends StatelessWidget {
  final List<String> ingredients;
  final Set<int> checkedIngredients;
  final Function(int) onToggle;

  const _IngredientsTab({
    required this.ingredients,
    required this.checkedIngredients,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: ingredients.length,
      itemBuilder: (context, index) {
        final isChecked = checkedIngredients.contains(index);
        return CheckboxListTile(
          value: isChecked,
          onChanged: (_) => onToggle(index),
          title: Text(
            ingredients[index],
            style: AppTextStyles.bodyMedium.copyWith(
              decoration: isChecked ? TextDecoration.lineThrough : null,
              color: isChecked ? AppColors.textSecondary : AppColors.textPrimary,
            ),
          ),
          activeColor: AppColors.primary,
          controlAffinity: ListTileControlAffinity.leading,
        );
      },
    );
  }
}

class _StepsTab extends StatelessWidget {
  final List<String> steps;

  const _StepsTab({required this.steps});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: steps.length,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Center(
                  child: Text(
                    '${index + 1}',
                    style: AppTextStyles.labelMedium.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  steps[index],
                  style: AppTextStyles.bodyMedium,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
