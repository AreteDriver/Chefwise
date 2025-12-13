import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_text_styles.dart';

/// Select Goals screen - Second onboarding screen
class SelectGoalsScreen extends StatefulWidget {
  final List<String> initialGoals;
  final Function(List<String>) onContinue;

  const SelectGoalsScreen({
    super.key,
    required this.initialGoals,
    required this.onContinue,
  });

  @override
  State<SelectGoalsScreen> createState() => _SelectGoalsScreenState();
}

class _SelectGoalsScreenState extends State<SelectGoalsScreen> {
  late Set<String> _selectedGoals;

  final List<String> _availableGoals = [
    'High protein',
    'Low fat',
    'Quick Meals',
    'Low carb',
    'Heart healthy',
    'Budget friendly',
    'Meal prep',
    'Weight loss',
  ];

  @override
  void initState() {
    super.initState();
    _selectedGoals = Set.from(widget.initialGoals);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Your Goals'),
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'What are your cooking goals?',
                      style: AppTextStyles.titleMedium,
                    ),
                    
                    const SizedBox(height: 8),
                    
                    Text(
                      'Select all that apply',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    
                    const SizedBox(height: 24),
                    
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: _availableGoals.map((goal) {
                        final isSelected = _selectedGoals.contains(goal);
                        return FilterChip(
                          label: Text(goal),
                          selected: isSelected,
                          onSelected: (selected) {
                            setState(() {
                              if (selected) {
                                _selectedGoals.add(goal);
                              } else {
                                _selectedGoals.remove(goal);
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
                  ],
                ),
              ),
            ),
            
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: ElevatedButton(
                onPressed: _selectedGoals.isEmpty
                    ? null
                    : () => widget.onContinue(_selectedGoals.toList()),
                child: const Text('Continue'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
