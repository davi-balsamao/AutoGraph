// AgentHeroCard — Card "Agente Online" da Home
//
// Tokens: AGColors.brandTealDeep (bg light), brandGreen (dot, CTA btn)
// Referência: ClaudeDesign/components/app-screens.jsx → HomeScreen hero card

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/ag_tokens.dart';
import '../../../../core/routes/app_routes.dart';

class AgentHeroCard extends StatefulWidget {
  const AgentHeroCard({super.key});

  @override
  State<AgentHeroCard> createState() => _AgentHeroCardState();
}

class _AgentHeroCardState extends State<AgentHeroCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseCtrl;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AGColors.canvasDark : AGColors.brandTealDeep;
    final borderColor = isDark ? AGColors.hairlineDarkStr : Colors.transparent;

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(AGRadius.xl),
        border: Border.all(color: borderColor),
      ),
      padding: const EdgeInsets.all(20),
      child: Stack(
        children: [
          // Gradiente decorativo
          Positioned.fill(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(AGRadius.xl),
              child: DecoratedBox(
                decoration: const BoxDecoration(
                  gradient: RadialGradient(
                    center: Alignment(1.0, -1.0),
                    radius: 0.8,
                    colors: [Color(0x2E00ED64), Colors.transparent],
                  ),
                ),
              ),
            ),
          ),

          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Indicador online
              Row(
                children: [
                  AnimatedBuilder(
                    animation: _pulseCtrl,
                    builder: (ctx, child) => Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: AGColors.brandGreen
                            .withValues(alpha: 0.6 + 0.4 * _pulseCtrl.value),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'AGENTE ONLINE',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.8,
                      color: AGColors.brandGreen,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 8),

              Text(
                'Precisa imprimir algo?',
                style: GoogleFonts.inter(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                  letterSpacing: -0.3,
                  height: 1.2,
                ),
              ),

              const SizedBox(height: 4),

              Text(
                'Conversa rápida, orçamento em 40 s.',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: AGColors.muted,
                  height: 1.5,
                ),
              ),

              const SizedBox(height: 14),

              // CTA
              GestureDetector(
                onTap: () => Navigator.pushNamed(context, AppRoutes.chat),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: AGColors.brandGreen,
                    borderRadius: BorderRadius.circular(AGRadius.full),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.chat_rounded,
                          size: 14, color: AGColors.onPrimary),
                      const SizedBox(width: 6),
                      Text(
                        'Conversar com o agente',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AGColors.onPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
