// ProductGrid — Grid 2×2 de produtos da Home
//
// Tokens: AGColors, AGRadius.xl, AGRadius.md
// Referência: ClaudeDesign/components/app-screens.jsx → HomeScreen → Quick categories

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/ag_tokens.dart';
import '../../../../core/widgets/ag_product_glyph.dart';

class ProductGrid extends StatelessWidget {
  const ProductGrid({super.key});

  static const _products = [
    (AGProductKind.panfleto, 'Panfletos',  'R\$ 89/mil'),
    (AGProductKind.banner,   'Banners',    'R\$ 49/m²'),
    (AGProductKind.bloco,    'Blocos',     'R\$ 12/un.'),
    (AGProductKind.apostila, 'Apostilas',  'R\$ 18/un.'),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AGColors.canvasDark : AGColors.canvas;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;

    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 0.85,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: _products.map((p) {
        final (kind, label, price) = p;
        return Container(
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(AGRadius.xl - 4),
            border: Border.all(color: borderColor),
          ),
          padding: const EdgeInsets.all(12),
          child: LayoutBuilder(
            builder: (context, constraints) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Imagem do produto
                  ClipRRect(
                    borderRadius: BorderRadius.circular(AGRadius.md),
                    child: Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: borderColor),
                        borderRadius: BorderRadius.circular(AGRadius.md),
                      ),
                      child: AGProductGlyph(kind: kind, size: constraints.maxWidth),
                    ),
                  ),

                  const SizedBox(height: 8),

                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      label,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: textColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: 2),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'a partir de $price',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: mutedColor,
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        );
      }).toList(),
    );
  }
}
