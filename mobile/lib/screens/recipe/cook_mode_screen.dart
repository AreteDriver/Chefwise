import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_text_styles.dart';
import '../../models/recipe.dart';

/// Full-screen cook mode with carousel-style step navigation
class CookModeScreen extends StatefulWidget {
  final Recipe recipe;

  const CookModeScreen({
    super.key,
    required this.recipe,
  });

  @override
  State<CookModeScreen> createState() => _CookModeScreenState();
}

class _CookModeScreenState extends State<CookModeScreen> {
  late PageController _pageController;
  int _currentStep = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final totalSteps = widget.recipe.steps.length;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        title: Text('Cook Mode'),
        actions: [
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Progress indicator
            Container(
              padding: const EdgeInsets.all(16),
              color: AppColors.surface,
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Step ${_currentStep + 1} of $totalSteps',
                        style: AppTextStyles.labelLarge,
                      ),
                      Text(
                        '${((_currentStep + 1) / totalSteps * 100).toInt()}%',
                        style: AppTextStyles.labelLarge.copyWith(
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(
                    value: (_currentStep + 1) / totalSteps,
                    backgroundColor: AppColors.divider,
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),

            // Steps carousel
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: totalSteps,
                onPageChanged: (index) {
                  setState(() {
                    _currentStep = index;
                  });
                },
                itemBuilder: (context, index) {
                  return _StepCard(
                    stepNumber: index + 1,
                    stepText: widget.recipe.steps[index],
                    isFirst: index == 0,
                    isLast: index == totalSteps - 1,
                  );
                },
              ),
            ),

            // Navigation buttons
            Container(
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
              child: Row(
                children: [
                  // Previous button
                  if (_currentStep > 0)
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          _pageController.previousPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        },
                        icon: const Icon(Icons.arrow_back),
                        label: const Text('Previous'),
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(double.infinity, 50),
                        ),
                      ),
                    ),

                  if (_currentStep > 0 && _currentStep < totalSteps - 1)
                    const SizedBox(width: 16),

                  // Next/Finish button
                  if (_currentStep < totalSteps - 1)
                    Expanded(
                      flex: _currentStep == 0 ? 1 : 1,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          _pageController.nextPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        },
                        icon: const Icon(Icons.arrow_forward),
                        label: const Text('Next'),
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(double.infinity, 50),
                        ),
                      ),
                    )
                  else
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _showCompletionDialog(context),
                        icon: const Icon(Icons.check),
                        label: const Text('Finish'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.success,
                          minimumSize: const Size(double.infinity, 50),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCompletionDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.celebration, color: AppColors.success),
            const SizedBox(width: 8),
            Text('Congratulations!', style: AppTextStyles.titleMedium),
          ],
        ),
        content: Text(
          'You\'ve completed cooking ${widget.recipe.title}! Enjoy your meal!',
          style: AppTextStyles.bodyMedium,
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context); // Close cook mode
            },
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }
}

class _StepCard extends StatelessWidget {
  final int stepNumber;
  final String stepText;
  final bool isFirst;
  final bool isLast;

  const _StepCard({
    required this.stepNumber,
    required this.stepText,
    required this.isFirst,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Card(
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Step number badge
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'Step $stepNumber',
                  style: AppTextStyles.labelLarge.copyWith(
                    color: Colors.white,
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Step text
              Text(
                stepText,
                style: AppTextStyles.bodyLarge.copyWith(
                  fontSize: 18,
                  height: 1.6,
                ),
              ),

              const SizedBox(height: 32),

              // Tips section (optional)
              if (isFirst)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppColors.primary.withOpacity(0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.lightbulb_outline,
                        color: AppColors.primary,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Tip: Read all steps before starting',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              if (isLast)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.success.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppColors.success.withOpacity(0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.check_circle_outline,
                        color: AppColors.success,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Almost done! Finish this final step',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.success,
                          ),
                        ),
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
}
