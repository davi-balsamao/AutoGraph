// AGLogoMark — Logo paramétrico do Autograph
//
// Tokens usados: AGColors.brandGreen, AGColors.brandTealDeep
//
// Uso:
//   // Welcome (logo verde):
//   AGLogoMark(size: 56, bg: AGColors.brandGreen, stroke: AGColors.brandTealDeep)
//
//   // Home/Login light (logo escuro):
//   AGLogoMark(size: 32, bg: AGColors.brandTealDeep, stroke: AGColors.brandGreen)
//
//   // Adaptativo ao tema:
//   AGLogoMark.themed(context, size: 32)

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../theme/ag_tokens.dart';

class AGLogoMark extends StatelessWidget {
  final double size;
  final Color bg;
  final Color stroke;

  const AGLogoMark({
    super.key,
    this.size = 28,
    this.bg = AGColors.brandTealDeep,
    this.stroke = AGColors.brandGreen,
  });

  /// Variante que lê o tema atual e escolhe as cores automaticamente.
  /// Light → bg=tealDeep, stroke=green | Dark → bg=green, stroke=tealDeep
  factory AGLogoMark.themed(BuildContext context, {double size = 28}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return AGLogoMark(
      size: size,
      bg: isDark ? AGColors.brandGreen : AGColors.brandTealDeep,
      stroke: isDark ? AGColors.brandTealDeep : AGColors.brandGreen,
    );
  }

  String _hex(Color c) {
    final argb = c.toARGB32();
    final r = (argb >> 16) & 0xFF;
    final g = (argb >> 8) & 0xFF;
    final b = argb & 0xFF;
    return '#${r.toRadixString(16).padLeft(2, '0')}'
        '${g.toRadixString(16).padLeft(2, '0')}'
        '${b.toRadixString(16).padLeft(2, '0')}';
  }

  String _buildSvg() {
    final bgHex = _hex(bg);
    final strokeHex = _hex(stroke);
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect x="2" y="2" width="28" height="28" rx="8" fill="$bgHex"/>
  <path d="M9 22 L16 8 L23 22" stroke="$strokeHex" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M12 18 L20 18" stroke="$strokeHex" stroke-width="2.6" stroke-linecap="round" fill="none"/>
  <path d="M21 23.5 Q23.5 25 25.5 23.2" stroke="$strokeHex" stroke-width="1.6" stroke-linecap="round" fill="none"/>
</svg>''';
  }

  @override
  Widget build(BuildContext context) {
    return SvgPicture.string(
      _buildSvg(),
      width: size,
      height: size,
      semanticsLabel: 'AutoGraph logo',
    );
  }
}
