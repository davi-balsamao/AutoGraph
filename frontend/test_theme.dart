import 'package:flutter/material.dart';

void main() {
  final theme = ThemeData(
    cardTheme: const CardThemeData(
      color: Colors.white,
    ),
  );
  debugPrint(theme.toString());
}
