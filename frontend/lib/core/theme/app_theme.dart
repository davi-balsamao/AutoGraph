import 'package:flutter/material.dart';

abstract class AppColors {
  static const primary = Color(0xFF1A73E8);
  static const primaryDark = Color(0xFF0D47A1);
  static const secondary = Color(0xFF00BFA5);
  static const background = Color(0xFFF5F7FA);
  static const backgroundDark = Color(0xFF121212);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceDark = Color(0xFF1E1E1E);
  static const error = Color(0xFFD32F2F);
  static const onPrimary = Color(0xFFFFFFFF);
  static const onBackground = Color(0xFF1C1C1E);
  static const onBackgroundDark = Color(0xFFE5E5EA);
}

abstract class AppTheme {
  static ThemeData get lightTheme => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          brightness: Brightness.light,
          surface: AppColors.surface,
          error: AppColors.error,
        ),
        scaffoldBackgroundColor: AppColors.background,
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.onPrimary,
          elevation: 0,
        ),
        textTheme: const TextTheme(
          displayLarge: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: AppColors.onBackground,
          ),
          bodyMedium: TextStyle(fontSize: 14, color: AppColors.onBackground),
        ),
      );

  static ThemeData get darkTheme => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          brightness: Brightness.dark,
          surface: AppColors.surfaceDark,
          error: AppColors.error,
        ),
        scaffoldBackgroundColor: AppColors.backgroundDark,
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.primaryDark,
          foregroundColor: AppColors.onPrimary,
          elevation: 0,
        ),
        textTheme: const TextTheme(
          displayLarge: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: AppColors.onBackgroundDark,
          ),
          bodyMedium: TextStyle(fontSize: 14, color: AppColors.onBackgroundDark),
        ),
      );
}
