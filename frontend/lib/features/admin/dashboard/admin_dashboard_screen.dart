// AdminDashboardScreen — Dashboard do painel admin (Geral)
//
// Referência: ClaudeDesign/components/admin-mobile-screens-a.jsx → AdmMobileDashboard
//
// Dados: mockados por enquanto. Real: OsService + PropostaService.

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/services/auth_service.dart';

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.bgDarkDeep : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final cardBg = isDark ? AGColors.canvasDark : AGColors.canvas;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;
    final surfaceBg = isDark ? AGColors.surfaceDark : AGColors.surfaceSoft;

    final user = AuthService().currentUser;
    final nome = user?.nome ?? 'Admin';
    final inicial = nome.isNotEmpty ? nome[0].toUpperCase() : 'A';

    return Scaffold(
      backgroundColor: bg,
      body: ListView(
        padding: EdgeInsets.only(
          bottom: 100 + MediaQuery.of(context).padding.bottom,
        ),
        children: [
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Greeting block
                  Row(
                    children: [
                      // Avatar
                      Container(
                        width: 36,
                        height: 36,
                        decoration: const BoxDecoration(
                          color: AGColors.brandGreen,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            inicial,
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AGColors.onPrimary,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Bom dia,',
                                style: GoogleFonts.inter(
                                    fontSize: 11, color: mutedColor)),
                            Text(
                              nome,
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: textColor,
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Notificação
                      Container(
                        width: 36, height: 36,
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
                              top: 7, right: 8,
                              child: Container(
                                width: 7, height: 7,
                                decoration: BoxDecoration(
                                  color: AGColors.accentOrange,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: bg, width: 1.5),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // ── Hero: Receita hoje
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: isDark ? AGColors.surfaceDark : AGColors.brandTealDeep,
                      borderRadius: BorderRadius.circular(AGRadius.xl - 2),
                      border: isDark
                          ? Border.all(color: AGColors.hairlineDarkStr)
                          : null,
                    ),
                    child: Stack(
                      children: [
                        Positioned.fill(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(AGRadius.xl - 2),
                            child: const DecoratedBox(
                              decoration: BoxDecoration(
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
                            Text(
                              'RECEITA HOJE',
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1,
                                color: AGColors.brandGreen,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  'R\$ 2.840',
                                  style: GoogleFonts.inter(
                                    fontSize: 28,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                    letterSpacing: -0.5,
                                  ),
                                ),
                                Text(
                                  ',40',
                                  style: GoogleFonts.inter(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w500,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.arrow_upward_rounded,
                                    size: 12, color: AGColors.brandGreen),
                                Text(
                                  '18% vs. ontem · 24 pedidos',
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    color: AGColors.muted,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            // Sparkline minimalista
                            _SparkLine(),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),

                  // ── KPI grid 2×2
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 1.7,
                    children: [
                      _KpiCard(
                        label: 'OSS ATIVAS',
                        value: '26',
                        delta: '↑ 4',
                        deltaColor: AGColors.brandGreenMid,
                        cardBg: cardBg,
                        borderColor: borderColor,
                        textColor: textColor,
                        mutedColor: mutedColor,
                      ),
                      _KpiCard(
                        label: 'TICKET MÉDIO',
                        value: 'R\$ 142',
                        delta: '▼ 2,1%',
                        deltaColor: AGColors.danger,
                        cardBg: cardBg,
                        borderColor: borderColor,
                        textColor: textColor,
                        mutedColor: mutedColor,
                      ),
                      _KpiCard(
                        label: 'RESPOSTA AGENTE',
                        value: '38s',
                        delta: '▼ 12s',
                        deltaColor: AGColors.brandGreenMid,
                        cardBg: cardBg,
                        borderColor: borderColor,
                        textColor: textColor,
                        mutedColor: mutedColor,
                      ),
                      _KpiCard(
                        label: 'APROVAR',
                        value: '3',
                        delta: 'urgente',
                        deltaColor: AGColors.accentOrange,
                        cardBg: cardBg,
                        borderColor: borderColor,
                        textColor: textColor,
                        mutedColor: mutedColor,
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // ── Status das OSs
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Status das OSs',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: textColor,
                          )),
                      GestureDetector(
                        child: Text(
                          'Ver Kanban →',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: isDark
                                ? AGColors.brandGreen
                                : AGColors.brandGreenDark,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 10),

                  Container(
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(AGRadius.xl - 4),
                      border: Border.all(color: borderColor),
                    ),
                    child: Column(
                      children: [
                        _StatusRow('Aguardando aprovação', 5,
                            AGColors.muted, isDark, borderColor),
                        _StatusRow('Aprovadas', 4,
                            AGColors.accentBlue, isDark, borderColor),
                        _StatusRow('Em progresso', 8,
                            AGColors.accentOrange, isDark, borderColor),
                        _StatusRow('Em revisão', 3,
                            AGColors.accentPurple, isDark, borderColor),
                        _StatusRow('Concluídas hoje', 6,
                            AGColors.brandGreen, isDark, null),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── KPI Card ──────────────────────────────────────────────────────
class _KpiCard extends StatelessWidget {
  final String label, value, delta;
  final Color deltaColor, cardBg, borderColor, textColor, mutedColor;

  const _KpiCard({
    required this.label, required this.value, required this.delta,
    required this.deltaColor, required this.cardBg, required this.borderColor,
    required this.textColor, required this.mutedColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(AGRadius.xl - 4),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label,
              style: GoogleFonts.inter(
                  fontSize: 9, fontWeight: FontWeight.w600,
                  color: mutedColor, letterSpacing: 0.5)),
          const SizedBox(height: 4),
          Text(value,
              style: GoogleFonts.inter(
                  fontSize: 20, fontWeight: FontWeight.w700,
                  color: textColor, letterSpacing: -0.5)),
          const SizedBox(height: 2),
          Text(delta,
              style: GoogleFonts.inter(
                  fontSize: 11, color: deltaColor, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

// ── Status row ────────────────────────────────────────────────────
class _StatusRow extends StatelessWidget {
  final String label;
  final int count;
  final Color dotColor;
  final bool isDark;
  final Color? borderColor;

  const _StatusRow(this.label, this.count, this.dotColor, this.isDark, this.borderColor);

  @override
  Widget build(BuildContext context) {
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: borderColor != null
          ? BoxDecoration(border: Border(bottom: BorderSide(color: borderColor!)))
          : null,
      child: Row(
        children: [
          Container(
            width: 8, height: 8,
            decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(label,
                style: GoogleFonts.inter(fontSize: 13, color: textColor)),
          ),
          Text('$count',
              style: GoogleFonts.inter(
                  fontSize: 13, fontWeight: FontWeight.w600, color: mutedColor)),
        ],
      ),
    );
  }
}

// ── Sparkline minimalista ─────────────────────────────────────────
class _SparkLine extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    const values = [0.3, 0.5, 0.4, 0.7, 0.6, 0.8, 1.0];
    return SizedBox(
      height: 28,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: values.map((v) {
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 1),
              child: Container(
                height: 28 * v,
                decoration: BoxDecoration(
                  color: v == 1.0
                      ? AGColors.brandGreen
                      : AGColors.brandGreen.withValues(alpha: 0.35),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
