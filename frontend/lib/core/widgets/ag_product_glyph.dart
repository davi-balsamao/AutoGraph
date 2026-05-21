// AGProductGlyph — Ilustrações geométricas dos produtos (SVG dinâmico)
//
// Extraído de ProductGlyph em ClaudeDesign/components/app-ui.jsx.
// Usa SvgPicture.string() para suportar dark mode via cores dinâmicas.
//
// Tokens usados: AGColors, via parâmetro dark.
//
// Uso:
//   AGProductGlyph(kind: AGProductKind.panfleto, size: 96)
//   AGProductGlyph(kind: AGProductKind.banner, size: 140, dark: true)

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../theme/ag_tokens.dart';

enum AGProductKind { panfleto, banner, bloco, apostila }

class AGProductGlyph extends StatelessWidget {
  final AGProductKind kind;
  final double size;

  /// Se null, lê automaticamente o tema do contexto.
  final bool? dark;

  const AGProductGlyph({
    super.key,
    required this.kind,
    this.size = 64,
    this.dark,
  });

  static String _hex(Color c) {
    final argb = c.toARGB32();
    final r = (argb >> 16) & 0xFF;
    final g = (argb >> 8) & 0xFF;
    final b = argb & 0xFF;
    return '#${r.toRadixString(16).padLeft(2, '0')}'
        '${g.toRadixString(16).padLeft(2, '0')}'
        '${b.toRadixString(16).padLeft(2, '0')}';
  }

  String _buildSvg(bool isDark) {
    // Cores adaptadas ao tema — espelham exatamente o ProductGlyph do JSX
    final bgFill    = isDark ? '#11364A' : '#F4F7F6'; // surfaceSoft
    final paper     = isDark ? '#1c2d38' : '#ffffff';
    final stroke    = isDark ? '#2A3D4A' : '#C1CCD6'; // hairlineStrong
    final lineMuted = isDark ? '#3d4f5b' : '#A8B3BC'; // muted
    final green     = _hex(AGColors.brandGreen);
    final greenDark = _hex(AGColors.brandGreenDark);
    final greenSoft = _hex(AGColors.brandGreenSoft);
    final tealDeep  = _hex(AGColors.brandTealDeep);
    final teal      = _hex(AGColors.brandTeal);
    final ink       = _hex(AGColors.ink);
    final steel     = _hex(AGColors.steel);
    final muted     = _hex(AGColors.muted);

    switch (kind) {
      case AGProductKind.panfleto:
        final headerFill = isDark ? greenDark : greenSoft;
        final titleFill  = isDark ? '#ffffff' : ink;
        return '''<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 80 60">
  <rect width="80" height="60" fill="$bgFill"/>
  <g transform="translate(40 30) rotate(-6)">
    <rect x="-14" y="-22" width="28" height="44" rx="1.5" fill="$paper" stroke="$stroke" stroke-width=".6"/>
    <rect x="-11" y="-19" width="22" height="12" fill="$headerFill"/>
    <rect x="-11" y="-4" width="14" height="1.5" fill="$titleFill"/>
    <rect x="-11" y="0" width="18" height="1" fill="$lineMuted"/>
    <rect x="-11" y="3" width="16" height="1" fill="$lineMuted"/>
    <rect x="-11" y="12" width="12" height="5" rx="2.5" fill="$green"/>
  </g>
</svg>''';

      case AGProductKind.banner:
        return '''<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 80 60">
  <rect width="80" height="60" fill="$bgFill"/>
  <rect x="14" y="14" width="2" height="40" rx="1" fill="$steel"/>
  <rect x="64" y="14" width="2" height="40" rx="1" fill="$steel"/>
  <rect x="16" y="14" width="48" height="36" fill="$tealDeep"/>
  <rect x="16" y="14" width="48" height="8" fill="$green"/>
  <rect x="20" y="26" width="32" height="2" fill="#ffffff"/>
  <rect x="20" y="30" width="24" height="1.5" fill="$muted"/>
  <rect x="20" y="40" width="14" height="4" rx="2" fill="$green"/>
</svg>''';

      case AGProductKind.bloco:
        final headerTitle = isDark ? '#ffffff' : ink;
        return '''<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 80 60">
  <rect width="80" height="60" fill="$bgFill"/>
  <g transform="translate(40 32)">
    <rect x="-18" y="-18" width="36" height="34" rx="1" fill="$paper" stroke="$stroke" stroke-width=".6"/>
    <rect x="-18" y="-18" width="36" height="4" fill="$tealDeep"/>
    <circle cx="-12" cy="-16" r=".8" fill="$green"/>
    <circle cx="-6" cy="-16" r=".8" fill="$green"/>
    <circle cx="0" cy="-16" r=".8" fill="$green"/>
    <circle cx="6" cy="-16" r=".8" fill="$green"/>
    <circle cx="12" cy="-16" r=".8" fill="$green"/>
    <rect x="-14" y="-10" width="18" height="2" fill="$headerTitle"/>
    <line x1="-14" y1="-4" x2="14" y2="-4" stroke="$stroke" stroke-width=".4"/>
    <line x1="-14" y1="0" x2="14" y2="0" stroke="$stroke" stroke-width=".4"/>
    <line x1="-14" y1="4" x2="14" y2="4" stroke="$stroke" stroke-width=".4"/>
    <line x1="-14" y1="8" x2="14" y2="8" stroke="$stroke" stroke-width=".4"/>
  </g>
</svg>''';

      case AGProductKind.apostila:
        return '''<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 80 60">
  <rect width="80" height="60" fill="$bgFill"/>
  <g transform="translate(40 30)">
    <rect x="-18" y="-19" width="36" height="38" rx="1" fill="$teal"/>
    <rect x="-18" y="-19" width="2" height="38" fill="$tealDeep"/>
    <rect x="-13" y="-13" width="24" height="1.5" fill="$green"/>
    <rect x="-13" y="-9" width="18" height="1" fill="#ffffff"/>
    <rect x="-13" y="-6" width="14" height="1" fill="#ffffff" opacity=".5"/>
    <line x1="-13" y1="2" x2="11" y2="2" stroke="#ffffff" stroke-opacity=".4" stroke-width=".5"/>
    <line x1="-13" y1="6" x2="9" y2="6" stroke="#ffffff" stroke-opacity=".4" stroke-width=".5"/>
    <line x1="-13" y1="10" x2="11" y2="10" stroke="#ffffff" stroke-opacity=".4" stroke-width=".5"/>
    <rect x="18" y="-17" width="2" height="36" fill="#ffffff"/>
  </g>
</svg>''';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = dark ?? (Theme.of(context).brightness == Brightness.dark);
    final h = (size * 0.75).roundToDouble(); // proporção 4:3
    return SvgPicture.string(
      _buildSvg(isDark),
      width: size,
      height: h,
      fit: BoxFit.cover,
    );
  }
}
