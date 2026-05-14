import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Instância global do gerenciador de tema para acesso simplificado
final themeNotifier = ThemeNotifier();

class ThemeNotifier extends ChangeNotifier {
  static const String _themeKey = 'selected_theme_mode';
  ThemeMode _themeMode = ThemeMode.system;

  ThemeMode get themeMode => _themeMode;

  ThemeNotifier() {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedMode = prefs.getString(_themeKey);
      if (savedMode != null) {
        _themeMode = ThemeMode.values.firstWhere(
          (e) => e.name == savedMode,
          orElse: () => ThemeMode.system,
        );
        notifyListeners();
      }
    } catch (_) {
      // Em caso de erro no SharedPreferences, mantém o padrão do sistema
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    if (_themeMode == mode) return;
    _themeMode = mode;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_themeKey, mode.name);
    } catch (_) {
      // Ignora exceções de I/O na persistência
    }
  }

  void toggleTheme() {
    if (_themeMode == ThemeMode.light || _themeMode == ThemeMode.system) {
      setThemeMode(ThemeMode.dark);
    } else {
      setThemeMode(ThemeMode.light);
    }
  }
}
