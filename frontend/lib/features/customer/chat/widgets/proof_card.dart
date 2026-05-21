// ProofCard — Card de prova digital dentro da conversa
//
// Referência: ClaudeDesign/components/app-screens-b.jsx → ProofBubble

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/ag_tokens.dart';

class ProofCard extends StatelessWidget {
  final String time;
  final bool isDark;

  const ProofCard({super.key, required this.time, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final bg = isDark ? const Color(0xFF202C33) : Colors.white;
    final proofBg = isDark ? const Color(0xFF0B1F1A) : AGColors.brandTealDeep;
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
            // Preview da arte
            Container(
              height: 120,
              decoration: BoxDecoration(
                color: proofBg,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(2),
                  topRight: Radius.circular(10),
                ),
              ),
              child: Stack(
                children: [
                  // Gradiente decorativo
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: RadialGradient(
                          center: Alignment.topRight,
                          radius: 0.8,
                          colors: [
                            AGColors.brandGreen.withValues(alpha: 0.2),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  ),
                  // Label PRÉ-VISUALIZAÇÃO
                  Positioned(
                    bottom: 8, left: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'PRÉ-VISUALIZAÇÃO',
                        style: GoogleFonts.inter(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: AGColors.brandGreen,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ),
                  ),
                  // Ícone central
                  const Center(
                    child: Icon(
                      Icons.image_outlined,
                      size: 36,
                      color: Colors.white54,
                    ),
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
                    child: Container(
                      height: 36,
                      decoration: BoxDecoration(
                        color: AGColors.brandGreen,
                        borderRadius: BorderRadius.circular(AGRadius.full),
                      ),
                      child: Center(
                        child: Text(
                          'Aprovar prova',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AGColors.onPrimary,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Container(
                      height: 36,
                      decoration: BoxDecoration(
                        color: Colors.transparent,
                        borderRadius: BorderRadius.circular(AGRadius.full),
                        border: Border.all(
                          color: isDark
                              ? AGColors.hairlineDarkStr
                              : AGColors.hairlineStrong,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          'Pedir ajuste',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: isDark ? AGColors.onDark : AGColors.ink,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

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
