// PromoBanner — Banner promocional da Home
//
// Tokens: AGColors.surfaceFeature / surfaceDarkFeat, brandGreenSoft / brandGreenDark
// Referência: ClaudeDesign/components/app-screens.jsx → HomeScreen → Promo banner

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/ag_tokens.dart';

class PromoBanner extends StatelessWidget {
  const PromoBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.surfaceDarkFeat : AGColors.surfaceFeature;
    final borderColor = isDark ? AGColors.brandGreenDark : AGColors.brandGreenSoft;
    final titleColor = isDark ? AGColors.brandGreen : AGColors.brandGreenDark;
    final subColor = isDark ? AGColors.muted : AGColors.slate;
    final chevronColor = isDark ? AGColors.brandGreen : AGColors.brandGreenDark;

    return Container(
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AGRadius.xl - 4),
        border: Border.all(color: borderColor),
      ),
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          const Text('🎁', style: TextStyle(fontSize: 24)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '10% off no primeiro pedido',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: titleColor,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Use AGRAPH10 no chat',
                  style: GoogleFonts.inter(fontSize: 11, color: subColor),
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right_rounded, size: 14, color: chevronColor),
        ],
      ),
    );
  }
}
