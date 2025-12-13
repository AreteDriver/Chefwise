import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_text_styles.dart';

/// Dietary Needs screen - Third onboarding screen
class DietaryNeedsScreen extends StatefulWidget {
  final List<String> initialNeeds;
  final Function(List<String>) onContinue;

  const DietaryNeedsScreen({
    super.key,
    required this.initialNeeds,
    required this.onContinue,
  });

  @override
  State<DietaryNeedsScreen> createState() => _DietaryNeedsScreenState();
}

class _DietaryNeedsScreenState extends State<DietaryNeedsScreen> {
  late Set<String> _selectedNeeds;

  final List<String> _availableNeeds = [
    'Vegetarian',
    'Vegan',
    'Gluten-free',
    'Dairy-free',
    'Nut-free',
    'Keto',
    'Paleo',
    'Halal',
    'Kosher',
    'Low sodium',
  ];

  @override
  void initState() {
    super.initState();
    _selectedNeeds = Set.from(widget.initialNeeds);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dietary Needs'),
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
                      'Any dietary restrictions?',
                      style: AppTextStyles.titleMedium,
                    ),
                    
                    const SizedBox(height: 8),
                    
                    Text(
                      'Select all that apply or skip',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                    
                    const SizedBox(height: 24),
                    
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: _availableNeeds.map((need) {
                        final isSelected = _selectedNeeds.contains(need);
                        return FilterChip(
                          label: Text(need),
                          selected: isSelected,
                          onSelected: (selected) {
                            setState(() {
                              if (selected) {
                                _selectedNeeds.add(need);
                              } else {
                                _selectedNeeds.remove(need);
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  ElevatedButton(
                    onPressed: () => widget.onContinue(_selectedNeeds.toList()),
                    child: const Text('Continue'),
                  ),
                  
                  const SizedBox(height: 12),
                  
                  TextButton(
                    onPressed: () => widget.onContinue([]),
                    child: const Text('Skip'),
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
