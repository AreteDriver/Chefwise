import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_text_styles.dart';

/// Cooking Confidence screen - Fourth onboarding screen
class CookingConfidenceScreen extends StatefulWidget {
  final double initialConfidence;
  final int initialCookingTime;
  final VoidCallback onComplete;

  const CookingConfidenceScreen({
    super.key,
    required this.initialConfidence,
    required this.initialCookingTime,
    required this.onComplete,
  });

  @override
  State<CookingConfidenceScreen> createState() => _CookingConfidenceScreenState();
}

class _CookingConfidenceScreenState extends State<CookingConfidenceScreen> {
  late double _confidence;
  late int _cookingTime;

  final List<int> _timeOptions = [15, 30, 45, 60, 90];

  @override
  void initState() {
    super.initState();
    _confidence = widget.initialConfidence;
    _cookingTime = widget.initialCookingTime;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Cooking Profile'),
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
                    // Cooking Confidence Section
                    Text(
                      'How confident are you in the kitchen?',
                      style: AppTextStyles.titleMedium,
                    ),
                    
                    const SizedBox(height: 24),
                    
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Beginner',
                          style: AppTextStyles.bodySmall,
                        ),
                        Text(
                          'Expert',
                          style: AppTextStyles.bodySmall,
                        ),
                      ],
                    ),
                    
                    Slider(
                      value: _confidence,
                      min: 1,
                      max: 5,
                      divisions: 4,
                      label: _getConfidenceLabel(_confidence),
                      activeColor: AppColors.primary,
                      onChanged: (value) {
                        setState(() {
                          _confidence = value;
                        });
                      },
                    ),
                    
                    Center(
                      child: Text(
                        _getConfidenceLabel(_confidence),
                        style: AppTextStyles.bodyLarge.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    
                    const SizedBox(height: 40),
                    
                    // Cooking Time Section
                    Text(
                      'How much time do you typically have for cooking?',
                      style: AppTextStyles.titleMedium,
                    ),
                    
                    const SizedBox(height: 16),
                    
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: _timeOptions.map((time) {
                        final isSelected = _cookingTime == time;
                        return ChoiceChip(
                          label: Text('$time min'),
                          selected: isSelected,
                          onSelected: (selected) {
                            setState(() {
                              _cookingTime = time;
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
                onPressed: widget.onComplete,
                child: const Text('Get Cooking!'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getConfidenceLabel(double value) {
    switch (value.round()) {
      case 1:
        return 'Beginner';
      case 2:
        return 'Learning';
      case 3:
        return 'Intermediate';
      case 4:
        return 'Advanced';
      case 5:
        return 'Expert';
      default:
        return 'Intermediate';
    }
  }
}
