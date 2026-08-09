import 'package:flutter/material.dart';

class AppColors {
  // Primary Palette
  static const Color background = Color(0xFFFCFBF8);
  static const Color primaryBlack = Color(0xFF0B0B0B);
  static const Color secondaryText = Color(0xFF555555);
  static const Color mutedText = Color(0xFF8A8A8A);
  static const Color border = Color(0xFFE7E3DD);
  static const Color borderSubtle = Color(0xFFE7E3DD);
  static const Color warmAccent = Color(0xFFA76F45);
  static const Color warmAccentSecondary = Color(0xFFC8895B);
  static const Color lightDecorAccent = Color(0xFFF3E5D8);

  // Additional Helper Aliases
  static const Color cardFill = Colors.white;
  static const Color inputBackground = Colors.white;
  static const Color textDark = Color(0xFF111111);
  static const Color textGrey = Color(0xFF555555);
  static const Color textPrimary = Color(0xFF0B0B0B);
  static const Color textSecondary = Color(0xFF555555);
  static const Color goldAccent = Color(0xFFA76F45);
  static const Color goldStart = Color(0xFFC8895B);
  static const Color goldMiddle = Color(0xFFC8895B);
  static const Color goldLightBg = Color(0xFFF3E5D8);
  static const Color dark = Color(0xFF0B0B0B);

  static const LinearGradient goldGradient = LinearGradient(
    colors: [Color(0xFFC8895B), Color(0xFFA76F45)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );
}

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.warmAccent,
        primary: AppColors.primaryBlack,
        secondary: AppColors.warmAccent,
        surface: Colors.white,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        hintStyle: const TextStyle(
          color: AppColors.mutedText,
          fontSize: 13,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.border, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.border, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.primaryBlack, width: 1.5),
        ),
      ),
    );
  }
}
