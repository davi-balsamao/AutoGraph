// QuoteCard — Card de orçamento dentro da conversa
//
// Referência: ClaudeDesign/components/app-screens-b.jsx → QuoteBubble

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/ag_tokens.dart';

class QuoteCard extends StatelessWidget {
  final String id;
  final double value;
  final String time;
  final bool isDark;
  final VoidCallback? onApprove;
  final VoidCallback? onReject;

  const QuoteCard({
    super.key,
    required this.id,
    required this.value,
    required this.time,
    required this.isDark,
    this.onApprove,
    this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    final bg = isDark ? const Color(0xFF202C33) : Colors.white;
    final innerBg = isDark ? const Color(0xFF0B1F1A) : const Color(0xFFF7F8FA);
    final textColor = isDark ? const Color(0xFFE9EDEF) : const Color(0xFF111B21);
    final mutedColor = const Color(0xFF667781);

    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.78),
        margin: const EdgeInsets.only(bottom: 4),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(2),
            topRight: Radius.circular(10),
            bottomLeft: Radius.circular(10),
            bottomRight: Radius.circular(10),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header com borda verde
            Container(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
              decoration: BoxDecoration(
                color: innerBg,
                border: const Border(
                  left: BorderSide(color: AGColors.brandGreen, width: 3),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Orçamento #$id',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isDark ? AGColors.brandGreen : AGColors.brandGreenDark,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'R\$ ${value.toStringAsFixed(2).replaceAll('.', ',')}',
                    style: GoogleFonts.inter(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: textColor,
                      letterSpacing: -0.5,
                    ),
                  ),
                  Text(
                    '1.000 panfletos A5 · couché 115g · 4×4',
                    style: GoogleFonts.inter(fontSize: 11, color: mutedColor),
                  ),
                ],
              ),
            ),

            // Botões
            Padding(
              padding: const EdgeInsets.all(10),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: onApprove,
                      child: Container(
                        height: 36,
                        decoration: BoxDecoration(
                          color: AGColors.brandGreen,
                          borderRadius: BorderRadius.circular(AGRadius.full),
                        ),
                        child: Center(
                          child: Text(
                            'Aprovar',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AGColors.onPrimary,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: GestureDetector(
                      onTap: onReject,
                      child: Container(
                        height: 36,
                        decoration: BoxDecoration(
                          color: Colors.transparent,
                          borderRadius: BorderRadius.circular(AGRadius.full),
                          border: Border.all(
                            color: Colors.red.withValues(alpha: 0.5),
                          ),
                        ),
                        child: Center(
                          child: Text(
                            'Cancelar',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Colors.red,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Horário
            Padding(
              padding: const EdgeInsets.only(right: 10, bottom: 6),
              child: Align(
                alignment: Alignment.centerRight,
                child: Text(time,
                    style: GoogleFonts.inter(
                        fontSize: 10, color: mutedColor)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
