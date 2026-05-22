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

  @override
  Widget build(BuildContext context) {
    final h = (size * 0.75).roundToDouble(); // proporção 4:3
    switch (kind) {
      case AGProductKind.panfleto:
        return SvgPicture.asset(
          'assets/panfleto.svg',
          width: size,
          height: h,
          fit: BoxFit.cover,
        );
      case AGProductKind.banner:
        return SvgPicture.asset(
          'assets/banner.svg',
          width: size,
          height: h,
          fit: BoxFit.cover,
        );
      case AGProductKind.bloco:
        return SvgPicture.asset(
          'assets/bloco.svg',
          width: size,
          height: h,
          fit: BoxFit.cover,
        );
      case AGProductKind.apostila:
        return SvgPicture.asset(
          'assets/apostilas.svg',
          width: size,
          height: h,
          fit: BoxFit.cover,
        );
    }
  }
}
