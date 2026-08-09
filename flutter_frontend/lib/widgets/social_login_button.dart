import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class SocialLoginButton extends StatelessWidget {
  final String text;
  final String assetName;
  final VoidCallback onPressed;
  final Widget? fallbackIcon;

  const SocialLoginButton({
    super.key,
    required this.text,
    required this.assetName,
    required this.onPressed,
    this.fallbackIcon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 46,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border, width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: onPressed,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(
                assetName,
                width: 20,
                height: 20,
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => fallbackIcon ?? const SizedBox(width: 20, height: 20),
              ),
              const SizedBox(width: 12),
              Text(
                text,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primaryBlack,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
