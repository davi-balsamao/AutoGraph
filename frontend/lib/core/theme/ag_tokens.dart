// Autograph — Design Tokens (Flutter / Dart)
//
// Tokens espelham o design system MongoDB-style usado nos mockups HTML.
// Fonte: frontend/handoff/design_tokens.dart
//
// Uso:
//   Container(
//     color: AGColors.brandGreen,
//     padding: const EdgeInsets.all(AGSpacing.xl),
//     child: Text('Olá', style: AGType.heading3),
//   )

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ─────────────────────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────────────────────
class AGColors {
  AGColors._();

  // Brand
  static const brandGreen      = Color(0xFF00ED64); // CTA principal
  static const brandGreenDark  = Color(0xFF00684A); // links, accents escuros
  static const brandGreenMid   = Color(0xFF00A35C);
  static const brandGreenSoft  = Color(0xFFC3F0D2); // bg de badges sucesso
  static const brandTealDeep   = Color(0xFF001E2B); // hero, footer, dark bg
  static const brandTeal       = Color(0xFF003D4F);
  static const brandTealMid    = Color(0xFF00684A);

  // Pressed states
  static const primaryDeep     = Color(0xFF00B545);
  static const primaryPressed  = Color(0xFF008C34);
  static const onPrimary       = Color(0xFF001E2B);

  // Category accents — usar APENAS para tags de produto/categoria
  static const accentPurple    = Color(0xFF7B3FF2);
  static const accentOrange    = Color(0xFFFA6E39);
  static const accentPink      = Color(0xFFF06BB8);
  static const accentBlue      = Color(0xFF3D4F9F);

  // Semantic
  static const warningBg       = Color(0xFFFFF8E0);
  static const warningText     = Color(0xFF946F3F);
  static const danger          = Color(0xFFD64545);

  // Surface — LIGHT
  static const canvas          = Color(0xFFFFFFFF);
  static const surface         = Color(0xFFF9FBFA);
  static const surfaceSoft     = Color(0xFFF4F7F6);
  static const surfaceFeature  = Color(0xFFE3FCEF);

  // Surface — DARK
  static const canvasDark      = Color(0xFF001E2B); // tealDeep
  static const bgDarkDeep      = Color(0xFF001017); // mais escuro que tealDeep
  static const surfaceDark     = Color(0xFF0A2C3A);
  static const surfaceDarkSoft = Color(0xFF11364A);
  static const surfaceDarkFeat = Color(0xFF003D2A);

  // Hairlines — LIGHT
  static const hairline        = Color(0xFFE1E5E8);
  static const hairlineSoft    = Color(0xFFECEFF1);
  static const hairlineStrong  = Color(0xFFC1CCD6);

  // Hairlines — DARK
  static const hairlineDark    = Color(0xFF1C2D38);
  static const hairlineDarkSoft= Color(0xFF162631);
  static const hairlineDarkStr = Color(0xFF2A3D4A);

  // Text — LIGHT
  static const ink             = Color(0xFF001E2B);
  static const charcoal        = Color(0xFF1C2D38);
  static const slate           = Color(0xFF3D4F5B);
  static const steel           = Color(0xFF5C6C7A);
  static const stone           = Color(0xFF7C8C9A);
  static const muted           = Color(0xFFA8B3BC);

  // Text — DARK
  static const onDark          = Color(0xFFFFFFFF);
  static const onDarkMuted     = Color(0xFFA8B3BC);
}

// ─────────────────────────────────────────────────────────────
// SPACING (4px base, 8px primary increment)
// ─────────────────────────────────────────────────────────────
class AGSpacing {
  AGSpacing._();

  static const double xxs       = 4;
  static const double xs        = 8;
  static const double sm        = 12;
  static const double md        = 16;
  static const double lg        = 20;
  static const double xl        = 24;
  static const double xxl       = 32;
  static const double xxxl      = 40;
  static const double sectionSm = 48;
  static const double section   = 64;
  static const double sectionLg = 96;
  static const double hero      = 120;
}

// ─────────────────────────────────────────────────────────────
// BORDER RADIUS
// ─────────────────────────────────────────────────────────────
class AGRadius {
  AGRadius._();

  static const double xs   = 4;
  static const double sm   = 6;
  static const double md   = 8;
  static const double lg   = 12;
  static const double xl   = 16;
  static const double xxl  = 24;
  static const double full = 9999;

  static const BorderRadius lgRadius = BorderRadius.all(Radius.circular(lg));
  static const BorderRadius xlRadius = BorderRadius.all(Radius.circular(xl));
  static final BorderRadius pill = BorderRadius.circular(full);
}

// ─────────────────────────────────────────────────────────────
// TYPOGRAPHY
// Usa Inter via google_fonts. Para code, JetBrainsMono.
// ─────────────────────────────────────────────────────────────
class AGType {
  AGType._();

  // Hero / display
  static TextStyle get heroDisplay => GoogleFonts.inter(
        fontSize: 72, fontWeight: FontWeight.w600,
        height: 1.10, letterSpacing: -1.5,
      );
  static TextStyle get displayLg => GoogleFonts.inter(
        fontSize: 56, fontWeight: FontWeight.w600,
        height: 1.15, letterSpacing: -1.0,
      );

  // Headings
  static TextStyle get heading1 => GoogleFonts.inter(
        fontSize: 48, fontWeight: FontWeight.w600,
        height: 1.20, letterSpacing: -0.5,
      );
  static TextStyle get heading2 => GoogleFonts.inter(
        fontSize: 36, fontWeight: FontWeight.w600,
        height: 1.08, letterSpacing: -1.0,
      );
  static TextStyle get heading3 => GoogleFonts.inter(
        fontSize: 28, fontWeight: FontWeight.w600,
        height: 1.30,
      );
  static TextStyle get heading4 => GoogleFonts.inter(
        fontSize: 22, fontWeight: FontWeight.w600,
        height: 1.35,
      );
  static TextStyle get heading5 => GoogleFonts.inter(
        fontSize: 18, fontWeight: FontWeight.w600,
        height: 1.40,
      );

  // Body
  static TextStyle get subtitle => GoogleFonts.inter(
        fontSize: 18, fontWeight: FontWeight.w400, height: 1.50,
      );
  static TextStyle get bodyMd => GoogleFonts.inter(
        fontSize: 16, fontWeight: FontWeight.w400, height: 1.55,
      );
  static TextStyle get bodyMdMedium => GoogleFonts.inter(
        fontSize: 16, fontWeight: FontWeight.w500, height: 1.55,
      );
  static TextStyle get bodySm => GoogleFonts.inter(
        fontSize: 14, fontWeight: FontWeight.w400, height: 1.50,
      );
  static TextStyle get bodySmMedium => GoogleFonts.inter(
        fontSize: 14, fontWeight: FontWeight.w500, height: 1.50,
      );

  // Caption / micro
  static TextStyle get caption => GoogleFonts.inter(
        fontSize: 13, fontWeight: FontWeight.w400, height: 1.40,
      );
  static TextStyle get captionBold => GoogleFonts.inter(
        fontSize: 13, fontWeight: FontWeight.w600, height: 1.40,
      );
  static TextStyle get micro => GoogleFonts.inter(
        fontSize: 12, fontWeight: FontWeight.w500, height: 1.40,
      );
  static TextStyle get microUppercase => GoogleFonts.inter(
        fontSize: 11, fontWeight: FontWeight.w600,
        height: 1.40, letterSpacing: 1.0,
      );

  // Button
  static TextStyle get buttonMd => GoogleFonts.inter(
        fontSize: 15, fontWeight: FontWeight.w600, height: 1.30,
      );

  // Code/mono
  static TextStyle get codeMd => GoogleFonts.jetBrainsMono(
        fontSize: 14, fontWeight: FontWeight.w400, height: 1.55,
      );
}

// ─────────────────────────────────────────────────────────────
// ELEVATION (BoxShadow factories)
// ─────────────────────────────────────────────────────────────
class AGShadow {
  AGShadow._();

  /// Subtle — hover-elevated tiles
  static const subtle = [
    BoxShadow(color: Color.fromRGBO(0, 30, 43, 0.04), offset: Offset(0, 1), blurRadius: 2),
  ];

  /// Card — feature cards
  static const card = [
    BoxShadow(color: Color.fromRGBO(0, 30, 43, 0.08), offset: Offset(0, 4), blurRadius: 12),
  ];

  /// Mockup — code mockups on hero
  static const mockup = [
    BoxShadow(color: Color.fromRGBO(0, 30, 43, 0.12), offset: Offset(0, 12), blurRadius: 24, spreadRadius: -4),
  ];

  /// Modal — modals, dropdowns
  static const modal = [
    BoxShadow(color: Color.fromRGBO(0, 30, 43, 0.16), offset: Offset(0, 16), blurRadius: 48, spreadRadius: -8),
  ];
}

// ─────────────────────────────────────────────────────────────
// FULL THEME — use no MaterialApp(theme: AGTheme.light(), darkTheme: AGTheme.dark())
// ─────────────────────────────────────────────────────────────
class AGTheme {
  AGTheme._();

  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AGColors.brandGreen,
        brightness: Brightness.light,
        primary: AGColors.brandGreen,
        onPrimary: AGColors.onPrimary,
        surface: AGColors.canvas,
        onSurface: AGColors.ink,
      ),
      scaffoldBackgroundColor: AGColors.canvas,
      textTheme: TextTheme(
        displayLarge: AGType.heroDisplay,
        displayMedium: AGType.displayLg,
        headlineLarge: AGType.heading1,
        headlineMedium: AGType.heading2,
        headlineSmall: AGType.heading3,
        titleLarge: AGType.heading4,
        titleMedium: AGType.heading5,
        bodyLarge: AGType.bodyMd.copyWith(color: AGColors.ink),
        bodyMedium: AGType.bodySm.copyWith(color: AGColors.charcoal),
        bodySmall: AGType.caption.copyWith(color: AGColors.steel),
        labelLarge: AGType.buttonMd,
      ),
      dividerColor: AGColors.hairline,
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AGColors.brandGreen,
          foregroundColor: AGColors.onPrimary,
          minimumSize: const Size(0, 48),
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          shape: const StadiumBorder(),
          textStyle: AGType.buttonMd,
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AGColors.ink,
          minimumSize: const Size(0, 48),
          side: const BorderSide(color: AGColors.hairlineStrong),
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          shape: const StadiumBorder(),
          textStyle: AGType.buttonMd,
        ),
      ),
      cardTheme: CardThemeData(
        color: AGColors.canvas,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: AGRadius.lgRadius,
          side: const BorderSide(color: AGColors.hairline),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AGColors.canvas,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AGRadius.md),
          borderSide: const BorderSide(color: AGColors.hairlineStrong),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AGRadius.md),
          borderSide: const BorderSide(color: AGColors.hairlineStrong),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AGRadius.md),
          borderSide: const BorderSide(color: AGColors.brandGreenDark, width: 2),
        ),
      ),
    );
  }

  static ThemeData dark() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AGColors.brandGreen,
        brightness: Brightness.dark,
        primary: AGColors.brandGreen,
        onPrimary: AGColors.onPrimary,
        surface: AGColors.canvasDark,
        onSurface: AGColors.onDark,
      ),
      scaffoldBackgroundColor: AGColors.bgDarkDeep,
      textTheme: TextTheme(
        displayLarge: AGType.heroDisplay.copyWith(color: AGColors.onDark),
        displayMedium: AGType.displayLg.copyWith(color: AGColors.onDark),
        headlineLarge: AGType.heading1.copyWith(color: AGColors.onDark),
        headlineMedium: AGType.heading2.copyWith(color: AGColors.onDark),
        headlineSmall: AGType.heading3.copyWith(color: AGColors.onDark),
        titleLarge: AGType.heading4.copyWith(color: AGColors.onDark),
        titleMedium: AGType.heading5.copyWith(color: AGColors.onDark),
        bodyLarge: AGType.bodyMd.copyWith(color: AGColors.onDark),
        bodyMedium: AGType.bodySm.copyWith(color: AGColors.onDarkMuted),
        bodySmall: AGType.caption.copyWith(color: AGColors.onDarkMuted),
        labelLarge: AGType.buttonMd.copyWith(color: AGColors.onPrimary),
      ),
      dividerColor: AGColors.hairlineDark,
      cardTheme: CardThemeData(
        color: AGColors.canvasDark,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: AGRadius.lgRadius,
          side: const BorderSide(color: AGColors.hairlineDark),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AGColors.surfaceDark,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AGRadius.md),
          borderSide: const BorderSide(color: AGColors.hairlineDarkStr),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AGRadius.md),
          borderSide: const BorderSide(color: AGColors.hairlineDarkStr),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AGRadius.md),
          borderSide: const BorderSide(color: AGColors.brandGreen, width: 2),
        ),
      ),
    );
  }
}
