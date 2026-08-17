import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class AssessmentStepIndicator extends StatelessWidget {
  final int currentStep;
  final int totalSteps;

  const AssessmentStepIndicator({
    super.key,
    required this.currentStep,
    required this.totalSteps,
  });

  final List<String> _labels = const [
    'Sport',
    'Body Part',
    'Mechanism',
    'Symptoms',
    'Pain Level',
    'Swelling',
    'History',
    'Review'
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16.0),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(totalSteps * 2 - 1, (index) {
              if (index % 2 == 1) {
                // Line
                final stepIndex = index ~/ 2;
                final isCompleted = currentStep > stepIndex;
                return Expanded(
                  child: Container(
                    height: 2,
                    color: isCompleted ? AppColors.warmAccent : AppColors.border,
                  ),
                );
              } else {
                // Circle
                final stepIndex = index ~/ 2;
                final isCompleted = currentStep > stepIndex;
                final isCurrent = currentStep == stepIndex;

                return Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isCompleted
                        ? AppColors.warmAccent
                        : (isCurrent ? AppColors.primaryBlack : Colors.transparent),
                    border: Border.all(
                      color: isCompleted
                          ? AppColors.warmAccent
                          : (isCurrent ? AppColors.primaryBlack : AppColors.border),
                      width: 2,
                    ),
                  ),
                  child: Center(
                    child: isCompleted
                        ? const Icon(Icons.check, color: Colors.white, size: 16)
                        : Text(
                            '${stepIndex + 1}',
                            style: TextStyle(
                              color: isCurrent ? Colors.white : AppColors.mutedText,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                );
              }
            }),
          ),
          const SizedBox(height: 8),
          Text(
            _labels[currentStep],
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}
