// ProductGrid — Grid 2×2 de produtos da Home
//
// Tokens: AGColors, AGRadius.xl, AGRadius.md
// Referência: ClaudeDesign/components/app-screens.jsx → HomeScreen → Quick categories

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/ag_tokens.dart';
import '../../../../core/widgets/ag_product_glyph.dart';

class ProductGrid extends StatelessWidget {
  final ValueChanged<String>? onTapProduct;
  const ProductGrid({super.key, this.onTapProduct});

  static const _products = [
    (AGProductKind.panfleto, 'Panfleto A5',  'R\$ 0,12'),
    (AGProductKind.banner,   'Banner Lona 440g', 'R\$ 49,00'),
    (AGProductKind.bloco,    'Bloco 50fls 1 via', 'R\$ 12,00'),
    (AGProductKind.banner,   'Banner Oxford', 'R\$ 79,00'),
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
        return GestureDetector(
          onTap: () => onTapProduct?.call(label),
          child: Container(
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(AGRadius.xl - 4),
              border: Border.all(color: borderColor),
            ),
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Imagem do produto
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(AGRadius.md),
                    child: Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        border: Border.all(color: borderColor),
                        borderRadius: BorderRadius.circular(AGRadius.md),
                      ),
                      child: FittedBox(
                        fit: BoxFit.cover,
                        child: AGProductGlyph(kind: kind, size: 140),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 8),

                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: textColor,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'a partir de $price',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: mutedColor,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}
