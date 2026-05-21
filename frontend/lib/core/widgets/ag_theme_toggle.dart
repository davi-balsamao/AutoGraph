// ThemeToggleIcon — Botão circular sol/lua para alternar tema
//
// Tokens usados: AGColors.surfaceSoft, AGColors.surfaceDark,
//                AGColors.hairline, AGColors.hairlineDark,
//                AGColors.ink, AGColors.onDark
//
// Dois estilos conforme contexto:
//   onDarkBackground: true  → fundo translúcido branco (Welcome, headers teal)
//   onDarkBackground: false → fundo surface com borda hairline (Home, Login)

import 'package:flutter/material.dart';
import '../theme/ag_tokens.dart';
import '../theme/theme_notifier.dart';

class ThemeToggleIcon extends StatelessWidget {
  /// Tamanho do botão circular (default: 36dp)
  final double size;

  /// true quando o widget está sobre fundo escuro fixo (Welcome, AppBar teal).
  /// false para fundo adaptativo claro/escuro (Home, Login, etc.).
  final bool onDarkBackground;

  const ThemeToggleIcon({
    super.key,
    this.size = 36,
    this.onDarkBackground = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final Color bg;
    final Color border;
    final Color iconColor;

    if (onDarkBackground) {
      // Sempre sobre fundo escuro — estilo translúcido
      bg = const Color(0x0FFFFFFF);          // rgba(255,255,255,0.06)
      border = const Color(0x1AFFFFFF);      // rgba(255,255,255,0.10)
      iconColor = Colors.white;
    } else {
      // Adapta ao tema atual
      bg = isDark ? AGColors.surfaceDark : AGColors.surfaceSoft;
      border = isDark ? AGColors.hairlineDark : AGColors.hairline;
      iconColor = isDark ? AGColors.onDark : AGColors.ink;
    }

    return GestureDetector(
      onTap: themeNotifier.toggleTheme,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: bg,
          shape: BoxShape.circle,
          border: Border.all(color: border),
        ),
        child: Icon(
          isDark ? Icons.wb_sunny_outlined : Icons.nightlight_round_outlined,
          color: iconColor,
          size: size * 0.44,
        ),
      ),
    );
  }
}

/// ThemeToggleSwitch — Segmented control com 3 opções: Claro / Escuro / Auto
/// Usado na tela Conta (Account) nas Preferências.
///
/// Tokens: AGColors.brandTealDeep (light active), AGColors.brandGreen (dark active)
class ThemeToggleSwitch extends StatelessWidget {
  const ThemeToggleSwitch({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currentMode = themeNotifier.themeMode;

    final bg = isDark ? AGColors.surfaceDark : AGColors.surfaceSoft;
    final border = isDark ? AGColors.hairlineDark : AGColors.hairline;

    final options = [
      (ThemeMode.light, '☀', 'Claro'),
      (ThemeMode.dark, '🌙', 'Escuro'),
      (ThemeMode.system, '⌁', 'Auto'),
    ];

    return Container(
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AGRadius.full),
        border: Border.all(color: border),
      ),
      padding: const EdgeInsets.all(3),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: options.map((opt) {
          final (mode, icon, label) = opt;
          final isActive = currentMode == mode;
          final activeBg = isDark ? AGColors.brandGreen : AGColors.brandTealDeep;
          final activeText = isDark ? AGColors.brandTealDeep : Colors.white;
          final inactiveText = isDark ? AGColors.onDarkMuted : AGColors.steel;

          return GestureDetector(
            onTap: () => themeNotifier.setThemeMode(mode),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: isActive ? activeBg : Colors.transparent,
                borderRadius: BorderRadius.circular(AGRadius.full),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(icon, style: const TextStyle(fontSize: 11)),
                  const SizedBox(width: 4),
                  Text(
                    label,
                    style: AGType.microUppercase.copyWith(
                      color: isActive ? activeText : inactiveText,
                      letterSpacing: 0.2,
                    ),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
