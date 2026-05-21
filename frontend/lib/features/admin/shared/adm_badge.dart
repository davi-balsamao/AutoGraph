// AdmBadge — Badges coloridas do painel admin
//
// Referência: ClaudeDesign/components/admin-mobile-shell.jsx → AdmBadge
//
// Uso:
//   AdmBadge('ESCALADA', AdmBadgeStyle.danger)
//   AdmBadge('VIP', AdmBadgeStyle.purple)

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';

enum AdmBadgeStyle { soft, green, purple, orange, blue, teal, gray, warning, danger }

class AdmBadge extends StatelessWidget {
  final String label;
  final AdmBadgeStyle style;

  const AdmBadge(this.label, this.style, {super.key});

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = _colors(style);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AGRadius.xs),
      ),
      child: Text(
        label.toUpperCase(),
        style: GoogleFonts.inter(
          fontSize: 9,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.6,
          color: fg,
        ),
      ),
    );
  }

  static (Color bg, Color fg) _colors(AdmBadgeStyle s) => switch (s) {
    AdmBadgeStyle.soft    => (AGColors.brandGreenSoft, AGColors.brandGreenDark),
    AdmBadgeStyle.green   => (AGColors.brandGreenMid,  Colors.white),
    AdmBadgeStyle.purple  => (AGColors.accentPurple,   Colors.white),
    AdmBadgeStyle.orange  => (AGColors.accentOrange,   Colors.white),
    AdmBadgeStyle.blue    => (AGColors.accentBlue,     Colors.white),
    AdmBadgeStyle.teal    => (AGColors.brandTealDeep,  AGColors.brandGreen),
    AdmBadgeStyle.gray    => (AGColors.surfaceSoft,    AGColors.slate),
    AdmBadgeStyle.warning => (AGColors.warningBg,      AGColors.warningText),
    AdmBadgeStyle.danger  => (const Color(0xFFFFEBEB), AGColors.danger),
  };
}
