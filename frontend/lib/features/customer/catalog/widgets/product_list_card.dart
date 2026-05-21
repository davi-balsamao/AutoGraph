// ProductListCard — Card de produto na lista do Catálogo
//
// Tokens: AGColors, AGRadius.xl, AGRadius.xs
// Referência: ClaudeDesign/components/app-screens.jsx → CatalogScreen → Cards

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/ag_tokens.dart';
import '../../../../core/widgets/ag_product_glyph.dart';

enum AGProductTag { green, orange, purple, blue }

class ProductListCard extends StatelessWidget {
  final AGProductKind kind;
  final String title;
  final String tagLabel;
  final AGProductTag tagColor;
  final String description;
  final String price;
  final VoidCallback? onTap;

  const ProductListCard({
    super.key,
    required this.kind,
    required this.title,
    required this.tagLabel,
    required this.tagColor,
    required this.description,
    required this.price,
    this.onTap,
  });

  Color _tagBg() => switch (tagColor) {
    AGProductTag.green  => AGColors.brandGreenMid,
    AGProductTag.orange => AGColors.accentOrange,
    AGProductTag.purple => AGColors.accentPurple,
    AGProductTag.blue   => AGColors.accentBlue,
  };

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AGColors.canvasDark : AGColors.canvas;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final priceColor = isDark ? AGColors.brandGreen : AGColors.brandGreenDark;
    final btnBg = isDark ? AGColors.brandGreen : AGColors.ink;
    final btnFg = isDark ? AGColors.onPrimary : Colors.white;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(AGRadius.xl - 4),
          border: Border.all(color: borderColor),
        ),
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Glyph
            ClipRRect(
              borderRadius: BorderRadius.circular(AGRadius.md),
              child: Container(
                width: 96,
                decoration: BoxDecoration(
                  border: Border.all(color: borderColor),
                  borderRadius: BorderRadius.circular(AGRadius.md),
                ),
                child: AGProductGlyph(kind: kind, size: 130),
              ),
            ),

            const SizedBox(width: 12),

            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Tag
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: _tagBg(),
                      borderRadius: BorderRadius.circular(AGRadius.xs),
                    ),
                    child: Text(
                      tagLabel.toUpperCase(),
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.8,
                        color: Colors.white,
                      ),
                    ),
                  ),

                  const SizedBox(height: 6),

                  Text(
                    title,
                    style: GoogleFonts.inter(
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                      letterSpacing: -0.2,
                      color: textColor,
                    ),
                  ),

                  const SizedBox(height: 2),

                  Text(
                    description,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: mutedColor,
                      height: 1.4,
                    ),
                  ),

                  const SizedBox(height: 8),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        price,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: priceColor,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: btnBg,
                          borderRadius: BorderRadius.circular(AGRadius.full),
                        ),
                        child: Text(
                          'Pedir',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: btnFg,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
