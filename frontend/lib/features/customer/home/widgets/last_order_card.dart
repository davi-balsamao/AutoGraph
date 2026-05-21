// LastOrderCard — Card do último pedido na Home
//
// Tokens: AGColors, AGRadius, AGType
// Referência: ClaudeDesign/components/app-screens.jsx → HomeScreen → Recent order

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/ag_tokens.dart';
import '../../../../core/widgets/ag_product_glyph.dart';

class LastOrderCard extends StatelessWidget {
  const LastOrderCard({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AGColors.canvasDark : AGColors.canvas;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;
    final surfaceBg = isDark ? AGColors.surfaceDark : AGColors.surfaceSoft;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final chevronColor = isDark ? AGColors.stone : AGColors.stone;

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(AGRadius.xl - 4),
        border: Border.all(color: borderColor),
      ),
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          // Thumb do produto
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: surfaceBg,
              borderRadius: BorderRadius.circular(AGRadius.md),
              border: Border.all(color: borderColor),
            ),
            clipBehavior: Clip.hardEdge,
            child: const AGProductGlyph(kind: AGProductKind.panfleto, size: 60),
          ),

          const SizedBox(width: 12),

          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Tag de status
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  decoration: BoxDecoration(
                    color: AGColors.brandGreenSoft,
                    borderRadius: BorderRadius.circular(AGRadius.xs),
                  ),
                  child: Text(
                    'Em produção',
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: AGColors.brandGreenDark,
                    ),
                  ),
                ),

                const SizedBox(height: 6),

                Text(
                  '1.000 panfletos A5',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: textColor,
                  ),
                ),

                const SizedBox(height: 2),

                Text(
                  '#A-2847 · entrega qui.',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 12,
                    color: mutedColor,
                  ),
                ),
              ],
            ),
          ),

          Icon(Icons.chevron_right_rounded, size: 16, color: chevronColor),
        ],
      ),
    );
  }
}
