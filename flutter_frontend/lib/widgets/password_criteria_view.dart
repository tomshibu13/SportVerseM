import 'package:flutter/material.dart';
import '../utils/validators.dart';

class PasswordCriteriaView extends StatelessWidget {
  final String password;
  final String? confirmPassword;
  final bool showConfirmMatch;

  const PasswordCriteriaView({
    super.key,
    required this.password,
    this.confirmPassword,
    this.showConfirmMatch = true,
  });

  @override
  Widget build(BuildContext context) {
    final hasMin = Validators.hasMinLength(password, 8);
    final hasUpper = Validators.hasUppercase(password);
    final hasLower = Validators.hasLowercase(password);
    final hasNum = Validators.hasDigit(password);
    final hasSpecial = Validators.hasSpecialChar(password);
    final isMatch = confirmPassword != null &&
        confirmPassword!.isNotEmpty &&
        password.isNotEmpty &&
        confirmPassword == password;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF9F7F4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Password Requirements:',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: Color(0xFF4B5563),
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 12,
            runSpacing: 6,
            children: [
              _buildCriterion('8+ Characters', hasMin),
              _buildCriterion('Uppercase (A-Z)', hasUpper),
              _buildCriterion('Lowercase (a-z)', hasLower),
              _buildCriterion('Number (0-9)', hasNum),
              _buildCriterion('Special Character', hasSpecial),
              if (showConfirmMatch && confirmPassword != null)
                _buildCriterion('Passwords Match', isMatch),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCriterion(String label, bool isSatisfied) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: 14,
          height: 14,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isSatisfied ? const Color(0xFF16A34A) : Colors.transparent,
            border: Border.all(
              color: isSatisfied ? const Color(0xFF16A34A) : const Color(0xFF9CA3AF),
              width: 1.5,
            ),
          ),
          child: isSatisfied
              ? const Icon(Icons.check, size: 10, color: Colors.white)
              : null,
        ),
        const SizedBox(width: 5),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isSatisfied ? FontWeight.w600 : FontWeight.normal,
            color: isSatisfied ? const Color(0xFF15803D) : const Color(0xFF6B7280),
          ),
        ),
      ],
    );
  }
}
