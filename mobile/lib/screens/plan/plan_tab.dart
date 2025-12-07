import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_text_styles.dart';
import '../../services/meal_plan_service.dart';
import '../../models/meal_plan.dart';

/// Plan Tab - Weekly meal planner
class PlanTab extends StatelessWidget {
  const PlanTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Consumer<MealPlanService>(
          builder: (context, mealPlanService, _) {
            final plan = mealPlanService.currentPlan;

            if (plan == null) {
              return _EmptyPlanView(
                onGenerate: () => mealPlanService.generateNewPlan(),
              );
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'This Week\'s Plan',
                        style: AppTextStyles.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      _MacroTargetsSummary(targets: plan.targets),
                    ],
                  ),
                ),

                // Daily Meal Cards
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: plan.dailyMeals.length,
                    itemBuilder: (context, index) {
                      return _DailyMealCard(
                        dailyMeal: plan.dailyMeals[index],
                        targets: plan.targets,
                      );
                    },
                  ),
                ),

                // Action Buttons
                Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => mealPlanService.generateNewPlan(),
                          icon: const Icon(Icons.refresh),
                          label: const Text('Regenerate'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            // Adjust goals
                          },
                          icon: const Icon(Icons.tune),
                          label: const Text('Adjust Goals'),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _EmptyPlanView extends StatelessWidget {
  final VoidCallback onGenerate;

  const _EmptyPlanView({required this.onGenerate});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.calendar_today,
              size: 80,
              color: AppColors.textTertiary,
            ),
            const SizedBox(height: 24),
            Text(
              'No meal plan yet',
              style: AppTextStyles.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Generate a personalized weekly meal plan based on your preferences',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: onGenerate,
              icon: const Icon(Icons.auto_awesome),
              label: const Text('Generate Plan'),
            ),
          ],
        ),
      ),
    );
  }
}

class _MacroTargetsSummary extends StatelessWidget {
  final MacroTargets targets;

  const _MacroTargetsSummary({required this.targets});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _MacroPill(
          label: 'Cal',
          value: '${targets.calories.toInt()}',
          color: AppColors.primary,
        ),
        const SizedBox(width: 8),
        _MacroPill(
          label: 'P',
          value: '${targets.protein.toInt()}g',
          color: AppColors.accent,
        ),
        const SizedBox(width: 8),
        _MacroPill(
          label: 'C',
          value: '${targets.carbs.toInt()}g',
          color: AppColors.accentSecondary,
        ),
        const SizedBox(width: 8),
        _MacroPill(
          label: 'F',
          value: '${targets.fat.toInt()}g',
          color: AppColors.warning,
        ),
      ],
    );
  }
}

class _MacroPill extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _MacroPill({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color, width: 1),
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
          const SizedBox(width: 4),
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

class _DailyMealCard extends StatelessWidget {
  final DailyMeal dailyMeal;
  final MacroTargets targets;

  const _DailyMealCard({
    required this.dailyMeal,
    required this.targets,
  });

  @override
  Widget build(BuildContext context) {
    final macros = dailyMeal.totalMacros;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Date Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      dailyMeal.dayName,
                      style: AppTextStyles.titleSmall,
                    ),
                    Text(
                      '${dailyMeal.date.month}/${dailyMeal.date.day}',
                      style: AppTextStyles.bodySmall,
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${macros.calories.toInt()} cal',
                    style: AppTextStyles.labelMedium.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),

            const Divider(height: 24),

            // Meals
            if (dailyMeal.breakfast != null)
              _MealItem(
                mealType: 'Breakfast',
                recipe: dailyMeal.breakfast!,
              ),
            if (dailyMeal.lunch != null)
              _MealItem(
                mealType: 'Lunch',
                recipe: dailyMeal.lunch!,
              ),
            if (dailyMeal.dinner != null)
              _MealItem(
                mealType: 'Dinner',
                recipe: dailyMeal.dinner!,
              ),
            if (dailyMeal.snack != null)
              _MealItem(
                mealType: 'Snack',
                recipe: dailyMeal.snack!,
              ),
          ],
        ),
      ),
    );
  }
}

class _MealItem extends StatelessWidget {
  final String mealType;
  final dynamic recipe;

  const _MealItem({
    required this.mealType,
    required this.recipe,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  mealType,
                  style: AppTextStyles.labelSmall.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                Text(
                  recipe.title,
                  style: AppTextStyles.bodyLarge,
                ),
              ],
            ),
          ),
          Icon(
            Icons.arrow_forward_ios,
            size: 16,
            color: AppColors.textTertiary,
          ),
        ],
      ),
    );
  }
}
