// AdminFinanceScreen — Tela financeira do admin (mobile)
//
// Referência: ClaudeDesign/components/admin-mobile-screens-b.jsx → AdmMobileFinance
// Dados mockados. Real: GET /finance/summary?period=2025-05

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/widgets/ag_theme_toggle.dart';

class AdminFinanceScreen extends StatelessWidget {
  const AdminFinanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.bgDarkDeep : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final cardBg = isDark ? AGColors.canvasDark : AGColors.canvas;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;
    final surfaceBg = isDark ? AGColors.surfaceDark : AGColors.surfaceSoft;

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_rounded, color: textColor),
          onPressed: () => Navigator.maybePop(context),
        ),
        title: Text('Financeiro',
            style: GoogleFonts.inter(
                fontSize: 17, fontWeight: FontWeight.w600, color: textColor)),
        actions: [
          const ThemeToggleIcon(size: 36),
          IconButton(
            icon: Icon(Icons.download_outlined, color: mutedColor),
            onPressed: () {},
          ),
        ],
      ),
      body: ListView(
        padding: EdgeInsets.only(
          left: 20, right: 20, top: 4,
          bottom: 40 + MediaQuery.of(context).padding.bottom,
        ),
        children: [
          // ── Hero receita
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: isDark ? AGColors.surfaceDark : AGColors.brandTealDeep,
              borderRadius: BorderRadius.circular(AGRadius.xl - 2),
            ),
            child: Stack(
              children: [
                const Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: RadialGradient(
                        center: Alignment(1.0, -1.0),
                        radius: 0.9,
                        colors: [Color(0x2E00ED64), Colors.transparent],
                      ),
                    ),
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('RECEITA NO MÊS',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1,
                          color: AGColors.brandGreen,
                        )),
                    const SizedBox(height: 4),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('R\$ 28.140',
                            style: GoogleFonts.inter(
                              fontSize: 28,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                              letterSpacing: -0.5,
                            )),
                        Text(',40',
                            style: GoogleFonts.inter(
                                fontSize: 18, color: Colors.white)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.arrow_upward_rounded,
                            size: 12, color: AGColors.brandGreen),
                        Text('12,8% vs. abril',
                            style: GoogleFonts.inter(
                                fontSize: 11, color: AGColors.muted)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _LegendItem('● Recebido', 'R\$ 24.310',
                            AGColors.brandGreen),
                        const SizedBox(width: 20),
                        _LegendItem('● A receber', 'R\$ 3.830',
                            AGColors.accentOrange),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // ── Custos + Margem
          Row(
            children: [
              Expanded(
                child: _InfoCard(
                  label: 'CUSTOS MÊS',
                  value: 'R\$ 9.840',
                  sub: 'Insumos · R\$ 5.420\nLogística · R\$ 1.840',
                  cardBg: cardBg,
                  borderColor: borderColor,
                  textColor: textColor,
                  mutedColor: mutedColor,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _InfoCard(
                  label: 'MARGEM LÍQUIDA',
                  value: '65,0%',
                  sub: 'R\$ 18.300 lucro',
                  cardBg: cardBg,
                  borderColor: borderColor,
                  textColor: textColor,
                  mutedColor: AGColors.brandGreenMid,
                  subColor: AGColors.brandGreenMid,
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // ── Fluxo de caixa (placeholder chart)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(AGRadius.xl - 4),
              border: Border.all(color: borderColor),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Fluxo de caixa',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: textColor,
                    )),
                Text('Últimos 6 meses',
                    style: GoogleFonts.inter(
                        fontSize: 11, color: mutedColor)),
                const SizedBox(height: 16),
                _MiniBarChart(isDark: isDark),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _LegendItem('● Receita', '', AGColors.brandGreen),
                    const SizedBox(width: 16),
                    _LegendItem('● Custos', '', AGColors.accentOrange),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // ── Por método (placeholder)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(AGRadius.xl - 4),
              border: Border.all(color: borderColor),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Por método',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: textColor,
                    )),
                const SizedBox(height: 12),
                ...['Pix', 'Cartão', 'Boleto'].map((m) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Text(m,
                          style: GoogleFonts.inter(
                              fontSize: 13, color: textColor)),
                      const Spacer(),
                      Container(
                        width: 120, height: 6,
                        decoration: BoxDecoration(
                          color: surfaceBg,
                          borderRadius: BorderRadius.circular(3),
                        ),
                        child: FractionallySizedBox(
                          alignment: Alignment.centerLeft,
                          widthFactor: m == 'Pix'
                              ? 0.6
                              : m == 'Cartão'
                                  ? 0.3
                                  : 0.1,
                          child: Container(
                            decoration: BoxDecoration(
                              color: AGColors.brandGreen,
                              borderRadius: BorderRadius.circular(3),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                )),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LegendItem extends StatelessWidget {
  final String label, sub;
  final Color color;

  const _LegendItem(this.label, this.sub, this.color);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: GoogleFonts.inter(
                fontSize: 11, color: color, fontWeight: FontWeight.w600)),
        if (sub.isNotEmpty)
          Text(sub,
              style: GoogleFonts.inter(
                  fontSize: 12,
                  color: Colors.white,
                  fontWeight: FontWeight.w700)),
      ],
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String label, value, sub;
  final Color cardBg, borderColor, textColor, mutedColor;
  final Color? subColor;

  const _InfoCard({
    required this.label, required this.value, required this.sub,
    required this.cardBg, required this.borderColor,
    required this.textColor, required this.mutedColor,
    this.subColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(AGRadius.xl - 4),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: GoogleFonts.inter(
                  fontSize: 9, fontWeight: FontWeight.w600,
                  color: mutedColor, letterSpacing: 0.5)),
          const SizedBox(height: 4),
          Text(value,
              style: GoogleFonts.inter(
                  fontSize: 18, fontWeight: FontWeight.w700,
                  color: textColor, letterSpacing: -0.3)),
          const SizedBox(height: 4),
          Text(sub,
              style: GoogleFonts.inter(
                  fontSize: 11,
                  color: subColor ?? mutedColor,
                  height: 1.4)),
        ],
      ),
    );
  }
}

class _MiniBarChart extends StatelessWidget {
  final bool isDark;

  const _MiniBarChart({required this.isDark});

  @override
  Widget build(BuildContext context) {
    final months = ['Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai'];
    final revenue = [0.5, 0.6, 0.55, 0.7, 0.75, 1.0];
    final costs = [0.3, 0.35, 0.3, 0.4, 0.38, 0.45];

    return SizedBox(
      height: 80,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: List.generate(6, (i) {
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Stack(
                    alignment: Alignment.bottomCenter,
                    children: [
                      Container(
                        height: 60 * revenue[i],
                        decoration: BoxDecoration(
                          color: AGColors.brandGreen.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                      Container(
                        height: 60 * costs[i],
                        decoration: BoxDecoration(
                          color: AGColors.accentOrange.withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(months[i],
                      style: GoogleFonts.inter(
                          fontSize: 9, color: AGColors.stone)),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}
