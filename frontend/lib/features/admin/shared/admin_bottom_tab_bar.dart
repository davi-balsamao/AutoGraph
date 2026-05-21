// AdminBottomTabBar — Tab bar inferior do painel admin
//
// 5 abas: Geral / OSs / Chat / Pedidos / Mais
// Active: brandGreen (igual em light e dark no admin)
// Referência: ClaudeDesign/components/admin-mobile-shell.jsx → AdminTabBar

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';

enum AdminTab { geral, oss, chat, pedidos, mais }

class AdminBottomTabBar extends StatelessWidget {
  final AdminTab current;
  final Map<AdminTab, int> badges;
  final ValueChanged<AdminTab> onTap;

  const AdminBottomTabBar({
    super.key,
    required this.current,
    required this.onTap,
    this.badges = const {},
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final barBg = isDark
        ? const Color(0xEB001017)
        : const Color(0xEBFFFFFF);
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;

    final tabs = [
      (AdminTab.geral,   'Geral',   Icons.grid_view_rounded),
      (AdminTab.oss,     'OSs',     Icons.view_kanban_rounded),
      (AdminTab.chat,    'Chat',    Icons.chat_bubble_outline_rounded),
      (AdminTab.pedidos, 'Pedidos', Icons.list_alt_rounded),
      (AdminTab.mais,    'Mais',    Icons.more_horiz_rounded),
    ];

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          decoration: BoxDecoration(
            color: barBg,
            border: Border(top: BorderSide(color: borderColor)),
          ),
          padding: EdgeInsets.only(
            left: 8, right: 8, top: 8,
            bottom: MediaQuery.of(context).padding.bottom + 8,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: tabs.map((t) {
              final (tab, label, icon) = t;
              final isActive = tab == current;
              final color = isActive ? AGColors.brandGreen : AGColors.stone;
              final badge = badges[tab];

              return Expanded(
                child: GestureDetector(
                  onTap: () => onTap(tab),
                  behavior: HitTestBehavior.opaque,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(height: 6),
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          Icon(icon, size: 22, color: color),
                          if (badge != null && badge > 0)
                            Positioned(
                              top: -4,
                              right: -8,
                              child: Container(
                                constraints: const BoxConstraints(minWidth: 16),
                                height: 16,
                                padding: const EdgeInsets.symmetric(horizontal: 4),
                                decoration: BoxDecoration(
                                  color: AGColors.brandGreen,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: barBg, width: 2),
                                ),
                                child: Center(
                                  child: Text(
                                    '$badge',
                                    style: const TextStyle(
                                      fontSize: 9,
                                      fontWeight: FontWeight.w700,
                                      color: AGColors.onPrimary,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        label,
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                          color: color,
                        ),
                      ),
                      const SizedBox(height: 2),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }
}
