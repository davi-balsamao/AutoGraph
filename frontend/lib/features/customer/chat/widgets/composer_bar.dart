// ComposerBar — Barra de composição de mensagem (fixada embaixo)
//
// Referência: ClaudeDesign/components/app-screens-b.jsx → composer

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/ag_tokens.dart';

class ComposerBar extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onSend;
  final bool isDark;

  const ComposerBar({
    super.key,
    required this.controller,
    required this.onSend,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final composerBg = isDark ? const Color(0xFF1F2C33) : const Color(0xFFF0F2F5);
    final inputBg = isDark ? const Color(0xFF2A3942) : Colors.white;
    final hintColor = isDark ? const Color(0xFF8696A0) : const Color(0xFF667781);
    final textColor = isDark ? const Color(0xFFE9EDEF) : const Color(0xFF111B21);

    return Container(
      color: composerBg,
      padding: EdgeInsets.only(
        left: 8,
        right: 8,
        top: 8,
        bottom: MediaQuery.of(context).padding.bottom + 8,
      ),
      child: Row(
        children: [
          // Input
          Expanded(
            child: Container(
              constraints: const BoxConstraints(maxHeight: 120),
              decoration: BoxDecoration(
                color: inputBg,
                borderRadius: BorderRadius.circular(AGRadius.full),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: TextField(
                controller: controller,
                maxLines: null,
                style: GoogleFonts.inter(fontSize: 14, color: textColor),
                decoration: InputDecoration(
                  hintText: 'Mensagem…',
                  hintStyle: GoogleFonts.inter(
                      fontSize: 14, color: hintColor),
                  border: InputBorder.none,
                  isDense: true,
                  contentPadding: EdgeInsets.zero,
                ),
              ),
            ),
          ),

          const SizedBox(width: 8),

          // Botão enviar
          GestureDetector(
            onTap: onSend,
            child: Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                color: AGColors.brandGreen,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.send_rounded,
                color: AGColors.onPrimary,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
