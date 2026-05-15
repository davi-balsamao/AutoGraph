import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  // Brand
  static const Color brandGreen = Color(0xFF00ED64);
  static const Color brandGreenDark = Color(0xFF00684A);
  static const Color brandGreenMid = Color(0xFF00A35C);
  static const Color brandGreenSoft = Color(0xFFC3F0D2);

  static const Color brandTealDeep = Color(0xFF001E2B);
  static const Color brandTeal = Color(0xFF003D4F);

  // Light surfaces
  static const Color canvas = Color(0xFFFFFFFF);
  static const Color surface = Color(0xFFF9FBFA);
  static const Color surfaceSoft = Color(0xFFF4F7F6);
  static const Color hairline = Color(0xFFE1E5E8);
  static const Color hairlineStrong = Color(0xFFC1CCD6);

  // Dark surfaces — deep navy, not gray
  static const Color darkCanvas = Color(0xFF0D1B24);
  static const Color darkSurface = Color(0xFF112433);
  static const Color darkSurfaceLift = Color(0xFF1A3142);
  static const Color darkHairline = Color(0xFF1C3547);
  static const Color darkHairlineStrong = Color(0xFF2A4A60);

  // Text
  static const Color ink = Color(0xFF001E2B);
  static const Color charcoal = Color(0xFF1C2D38);
  static const Color slate = Color(0xFF3D4F5B);
  static const Color steel = Color(0xFF5C6C7A);
  static const Color darkTextPrimary = Color(0xFFEAF4F0);
  static const Color darkTextSecondary = Color(0xFF7FA8C0);

  // Accents
  static const Color purple = Color(0xFF7B3FF2);
  static const Color orange = Color(0xFFFA6E39);
  static const Color whatsappGreen = Color(0xFF25D366);
  static const Color successLight = Color(0xFFE3FCEF);
}

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: const ColorScheme.light(
        primary: AppColors.brandGreen,
        onPrimary: AppColors.brandTealDeep,
        secondary: AppColors.brandTeal,
        onSecondary: Colors.white,
        surface: AppColors.canvas,
        onSurface: AppColors.ink,
        surfaceContainerHighest: AppColors.surfaceSoft,
      ),
      scaffoldBackgroundColor: AppColors.surface,
      dividerColor: AppColors.hairline,
      textTheme: GoogleFonts.outfitTextTheme().copyWith(
        displayLarge: GoogleFonts.outfit(fontWeight: FontWeight.w500, color: AppColors.ink),
        displayMedium: GoogleFonts.outfit(fontWeight: FontWeight.w500, color: AppColors.ink),
        headlineLarge: GoogleFonts.outfit(fontWeight: FontWeight.w500, color: AppColors.ink),
        headlineMedium: GoogleFonts.outfit(fontWeight: FontWeight.w500, color: AppColors.ink),
        titleLarge: GoogleFonts.outfit(fontWeight: FontWeight.w500, color: AppColors.ink),
        bodyLarge: GoogleFonts.outfit(color: AppColors.ink),
        bodyMedium: GoogleFonts.outfit(color: AppColors.ink),
      ),
      cardTheme: CardThemeData(
        color: AppColors.canvas,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: AppColors.hairline),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.brandGreen,
          foregroundColor: AppColors.brandTealDeep,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
          textStyle: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 14),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.ink,
          side: const BorderSide(color: AppColors.hairlineStrong),
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
          textStyle: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 14),
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.canvas,
        foregroundColor: AppColors.ink,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.ink),
        shape: const Border(bottom: BorderSide(color: AppColors.hairline)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.canvas,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.hairlineStrong)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.hairlineStrong)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.brandGreenDark, width: 2)),
        labelStyle: const TextStyle(color: AppColors.steel),
        hintStyle: const TextStyle(color: AppColors.steel),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.canvas,
        indicatorColor: AppColors.brandGreenSoft,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return GoogleFonts.outfit(fontWeight: FontWeight.w600, color: AppColors.brandGreenDark);
          }
          return GoogleFonts.outfit(color: AppColors.steel);
        }),
      ),
      listTileTheme: const ListTileThemeData(tileColor: Colors.transparent),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.brandGreen,
        onPrimary: AppColors.brandTealDeep,
        secondary: AppColors.brandGreenMid,
        onSecondary: Colors.white,
        surface: AppColors.darkSurface,
        onSurface: AppColors.darkTextPrimary,
        surfaceContainerHighest: AppColors.darkSurfaceLift,
        outline: AppColors.darkHairline,
      ),
      scaffoldBackgroundColor: AppColors.darkCanvas,
      dividerColor: AppColors.darkHairline,
      textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme).copyWith(
        displayLarge: GoogleFonts.outfit(fontWeight: FontWeight.w500, color: AppColors.darkTextPrimary),
        displayMedium: GoogleFonts.outfit(fontWeight: FontWeight.w500, color: AppColors.darkTextPrimary),
        headlineLarge: GoogleFonts.outfit(fontWeight: FontWeight.w500, color: AppColors.darkTextPrimary),
        headlineMedium: GoogleFonts.outfit(fontWeight: FontWeight.w500, color: AppColors.darkTextPrimary),
        titleLarge: GoogleFonts.outfit(fontWeight: FontWeight.w500, color: AppColors.darkTextPrimary),
        bodyLarge: GoogleFonts.outfit(color: AppColors.darkTextPrimary),
        bodyMedium: GoogleFonts.outfit(color: AppColors.darkTextSecondary),
      ),
      cardTheme: CardThemeData(
        color: AppColors.darkSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: AppColors.darkHairline),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.brandGreen,
          foregroundColor: AppColors.brandTealDeep,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
          textStyle: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 14),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.darkTextPrimary,
          side: const BorderSide(color: AppColors.darkHairlineStrong),
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
          textStyle: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 14),
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.darkCanvas,
        foregroundColor: AppColors.darkTextPrimary,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.darkTextPrimary),
        shape: const Border(bottom: BorderSide(color: AppColors.darkHairline)),
        iconTheme: const IconThemeData(color: AppColors.darkTextPrimary),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.darkSurfaceLift,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.darkHairline)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.darkHairline)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.brandGreen, width: 2)),
        labelStyle: const TextStyle(color: AppColors.darkTextSecondary),
        hintStyle: const TextStyle(color: AppColors.darkTextSecondary),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.darkCanvas,
        indicatorColor: AppColors.brandGreenDark,
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: AppColors.brandGreen);
          }
          return const IconThemeData(color: AppColors.darkTextSecondary);
        }),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return GoogleFonts.outfit(fontWeight: FontWeight.w600, color: AppColors.brandGreen);
          }
          return GoogleFonts.outfit(color: AppColors.darkTextSecondary);
        }),
      ),
      listTileTheme: const ListTileThemeData(tileColor: Colors.transparent),
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.darkSurface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
