// ChatBubble — Bolha de mensagem WhatsApp-style
//
// OUT: bg=#D9FDD3 (light)/#005C4B (dark), align direita, radius 10,10,2,10
// IN:  bg=#FFFFFF (light)/#202C33 (dark), align esquerda, radius 2,10,10,10
// Horário + ✓✓ azul (#53BDEB) no rodapé
//
// Referência: ClaudeDesign/components/app-screens-b.jsx → ChatScreen

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ChatBubble extends StatelessWidget {
  final String text;
  final bool outgoing;
  final String time;
  final bool isDark;

  const ChatBubble({
    super.key,
    required this.text,
    required this.outgoing,
    required this.time,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final bg = outgoing
        ? (isDark ? const Color(0xFF005C4B) : const Color(0xFFD9FDD3))
        : (isDark ? const Color(0xFF202C33) : Colors.white);
    final textColor = isDark ? const Color(0xFFE9EDEF) : const Color(0xFF111B21);
    final metaColor = const Color(0xFF667781);

    final radius = outgoing
        ? const BorderRadius.only(
            topLeft: Radius.circular(10),
            topRight: Radius.circular(10),
            bottomLeft: Radius.circular(10),
            bottomRight: Radius.circular(2),
          )
        : const BorderRadius.only(
            topLeft: Radius.circular(2),
            topRight: Radius.circular(10),
            bottomLeft: Radius.circular(10),
            bottomRight: Radius.circular(10),
          );

    return Padding(
      padding: EdgeInsets.only(
        bottom: 4,
        left: outgoing ? 48 : 0,
        right: outgoing ? 0 : 48,
      ),
      child: Align(
        alignment: outgoing ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          padding: const EdgeInsets.fromLTRB(10, 8, 10, 6),
          decoration: BoxDecoration(color: bg, borderRadius: radius),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                text,
                style: GoogleFonts.inter(fontSize: 14, color: textColor),
              ),
              const SizedBox(height: 3),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    time,
                    style: GoogleFonts.inter(fontSize: 10, color: metaColor),
                  ),
                  if (outgoing) ...[
                    const SizedBox(width: 3),
                    const Text(
                      '✓✓',
                      style: TextStyle(
                        fontSize: 11,
                        color: Color(0xFF53BDEB), // azul WhatsApp
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
