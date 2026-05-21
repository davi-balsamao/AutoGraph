// AdminMobileHeader — AppBar customizado do painel admin
//
// Referência: ClaudeDesign/components/admin-mobile-shell.jsx → AdminMobileHeader
//
// Uso:
//   AdminMobileHeader(title: 'Ordens de serviço', subtitle: '26 OSs ativas')
//   AdminMobileHeader(title: 'Atendimento', trailing: [IconButton(...)])

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';

class AdminMobileHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final bool showBack;
  final List<Widget> trailing;

  const AdminMobileHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.showBack = false,
    this.trailing = const [],
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.bgDarkDeep : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairlineSoft;

    return Container(
      color: bg,
      padding: EdgeInsets.only(
        left: showBack ? 8 : 20,
        right: 16,
        top: 8,
        bottom: 12,
      ),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: borderColor)),
      ),
      child: Row(
        children: [
          if (showBack)
            IconButton(
              icon: Icon(Icons.arrow_back_rounded, color: textColor, size: 20),
              onPressed: () => Navigator.maybePop(context),
              padding: const EdgeInsets.all(8),
            ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    color: textColor,
                    letterSpacing: -0.3,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 1),
                  Text(
                    subtitle!,
                    style: GoogleFonts.inter(fontSize: 12, color: mutedColor),
                  ),
                ],
              ],
            ),
          ),
          ...trailing,
        ],
      ),
    );
  }
}
