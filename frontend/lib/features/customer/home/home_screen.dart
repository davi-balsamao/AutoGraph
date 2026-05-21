// HomeScreen — Tela inicial do app cliente (02 · Home)
//
// Tokens usados:
//   AGColors (todos via isDark)
//   AGSpacing.lg = 20 (padding horizontal padrão)
//   AGType.heading5 (section labels)
//
// Referência: ClaudeDesign/components/app-screens.jsx → HomeScreen
//
// Nota: dados são estáticos/mockados por enquanto.
// Real: usar AuthService().currentUser + OsService().fetchOrdensServico()

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/widgets/ag_logo.dart';
import '../../../core/widgets/ag_theme_toggle.dart';
import 'widgets/agent_hero_card.dart';
import 'widgets/product_grid.dart';
import 'widgets/last_order_card.dart';
import 'widgets/promo_banner.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.bgDarkDeep : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final linkColor = isDark ? AGColors.brandGreen : AGColors.brandGreenDark;
    final surfaceBg = isDark ? AGColors.surfaceDark : AGColors.surfaceSoft;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;

    final user = AuthService().currentUser;
    final nome = user?.nome.split(' ').first ?? 'você';

    return Scaffold(
      backgroundColor: bg,
      body: ListView(
        padding: EdgeInsets.only(
          bottom: 100 + MediaQuery.of(context).padding.bottom,
        ),
        children: [
          // ── Top bar
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
              child: Row(
                children: [
                  AGLogoMark.themed(context, size: 32),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Olá,',
                            style: GoogleFonts.inter(
                                fontSize: 12, color: mutedColor)),
                        Text(
                          nome,
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: textColor,
                            height: 1.1,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Notificação
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: surfaceBg,
                      shape: BoxShape.circle,
                      border: Border.all(color: borderColor),
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        Icon(Icons.notifications_outlined,
                            size: 18, color: textColor),
                        Positioned(
                          top: 8,
                          right: 9,
                          child: Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: AGColors.accentOrange,
                              shape: BoxShape.circle,
                              border: Border.all(color: bg, width: 2),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  const ThemeToggleIcon(size: 38),
                ],
              ),
            ),
          ),

          // ── Hero card agente
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: const AgentHeroCard(),
          ),

          // ── Section: Imprima agora
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text('Imprima agora',
                    style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: textColor)),
                Text('Ver tudo',
                    style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: linkColor)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: const ProductGrid(),
          ),

          // ── Section: Último pedido
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text('Último pedido',
                    style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: textColor)),
                Text('Histórico',
                    style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: linkColor)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: const LastOrderCard(),
          ),

          // ── Promo banner
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
            child: const PromoBanner(),
          ),
        ],
      ),
    );
  }
}
