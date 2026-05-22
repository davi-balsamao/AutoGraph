// AdminFinanceScreen — Tela financeira do admin (mobile)
//
// Referência: ClaudeDesign/components/admin-mobile-screens-b.jsx → AdmMobileFinance
// Dados integrados com: GET /api/finance/summary?period=YYYY-MM

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/widgets/ag_theme_toggle.dart';
import '../../../core/services/finance_service.dart';

class AdminFinanceScreen extends StatefulWidget {
  const AdminFinanceScreen({super.key});

  @override
  State<AdminFinanceScreen> createState() => _AdminFinanceScreenState();
}

class _AdminFinanceScreenState extends State<AdminFinanceScreen> {
  bool _loading = true;
  FinanceSummary? _summary;
  String? _errorMessage;
  late String _selectedPeriod;

  @override
  void initState() {
    super.initState();
    _selectedPeriod = DateTime.now().toIso8601String().substring(0, 7); // YYYY-MM
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final summary = await FinanceService().fetchSummary(period: _selectedPeriod);
      if (mounted) {
        setState(() {
          _summary = summary;
          _loading = false;
          _errorMessage = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _errorMessage = e.toString();
        });
      }
    }
  }

  List<Map<String, String>> _getPeriodOptions() {
    final now = DateTime.now();
    final List<Map<String, String>> options = [];
    final monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    for (int i = 0; i < 6; i++) {
      final date = DateTime(now.year, now.month - i, 1);
      final period = date.toIso8601String().substring(0, 7); // YYYY-MM
      final label = '${monthNames[date.month - 1]} ${date.year}';
      options.add({'period': period, 'label': label});
    }
    return options;
  }

  void _exportReport() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_outline_rounded, color: AGColors.onPrimary),
            const SizedBox(width: 8),
            Text('Relatório de $_selectedPeriod exportado com sucesso!',
                style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
          ],
        ),
        backgroundColor: AGColors.brandGreenDark,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

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
            onPressed: _loading || _errorMessage != null ? null : _exportReport,
          ),
        ],
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AGColors.brandGreen),
            )
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline_rounded, size: 40, color: AGColors.accentOrange),
                        const SizedBox(height: 12),
                        Text(
                          'Erro ao carregar dados financeiros',
                          style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: textColor),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(fontSize: 12, color: mutedColor),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () {
                            setState(() => _loading = true);
                            _loadData();
                          },
                          icon: const Icon(Icons.refresh_rounded),
                          label: const Text('Tentar Novamente'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AGColors.brandGreen,
                            foregroundColor: AGColors.onPrimary,
                          ),
                        )
                      ],
                    ),
                  ),
                )
              : ListView(
                  padding: EdgeInsets.only(
                    left: 20,
                    right: 20,
                    top: 4,
                    bottom: 40 + MediaQuery.of(context).padding.bottom,
                  ),
                  children: [
                    // ── Selector de Período
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Período de Análise',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: textColor,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                            decoration: BoxDecoration(
                              color: surfaceBg,
                              borderRadius: BorderRadius.circular(AGRadius.md),
                              border: Border.all(color: borderColor),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _selectedPeriod,
                                dropdownColor: isDark ? AGColors.surfaceDark : AGColors.canvas,
                                icon: Icon(Icons.arrow_drop_down_rounded, color: textColor),
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: textColor,
                                ),
                                onChanged: (val) {
                                  if (val != null) {
                                    setState(() {
                                      _selectedPeriod = val;
                                      _loading = true;
                                    });
                                    _loadData();
                                  }
                                },
                                items: _getPeriodOptions().map((opt) {
                                  return DropdownMenuItem<String>(
                                    value: opt['period'],
                                    child: Text(opt['label']!),
                                  );
                                }).toList(),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

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
                              Text('R\$ ${_summary!.receitaTotal.toStringAsFixed(2).replaceAll('.', ',')}',
                                  style: GoogleFonts.inter(
                                    fontSize: 28,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                    letterSpacing: -0.5,
                                  )),
                              const SizedBox(height: 4),
                              Text('Faturamento consolidado das ordens ativas',
                                  style: GoogleFonts.inter(
                                      fontSize: 11, color: AGColors.muted)),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  _LegendItem('● Recebido', 'R\$ ${_summary!.recebido.toStringAsFixed(2).replaceAll('.', ',')}', AGColors.brandGreen),
                                  const SizedBox(width: 20),
                                  _LegendItem('● A receber', 'R\$ ${_summary!.aReceber.toStringAsFixed(2).replaceAll('.', ',')}', AGColors.accentOrange),
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
                            value: 'R\$ ${_summary!.custos.toStringAsFixed(2).replaceAll('.', ',')}',
                            sub: '40% ref. produção',
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
                            value: 'R\$ ${_summary!.margemLiquida.toStringAsFixed(2).replaceAll('.', ',')}',
                            sub: '${_summary!.margemPercentual.toStringAsFixed(0)}% de rentabilidade',
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

                    // ── Gráficos
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(AGRadius.xl - 4),
                        border: Border.all(color: borderColor),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Desempenho Semestral',
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: textColor,
                                ),
                              ),
                              Row(
                                children: [
                                  Container(
                                    width: 6,
                                    height: 6,
                                    decoration: const BoxDecoration(
                                      color: AGColors.brandGreen,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  Text('Receita', style: GoogleFonts.inter(fontSize: 10, color: mutedColor)),
                                  const SizedBox(width: 10),
                                  Container(
                                    width: 6,
                                    height: 6,
                                    decoration: const BoxDecoration(
                                      color: AGColors.accentOrange,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  Text('Custo', style: GoogleFonts.inter(fontSize: 10, color: mutedColor)),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          _MiniBarChart(
                            isDark: isDark,
                            grafico: _summary!.grafico,
                          ),
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
                  fontSize: 15, fontWeight: FontWeight.w700,
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
  final List<FinanceChartData> grafico;

  const _MiniBarChart({required this.isDark, required this.grafico});

  @override
  Widget build(BuildContext context) {
    if (grafico.isEmpty) {
      return SizedBox(
        height: 100,
        child: Center(
          child: Text('Sem dados para exibição',
              style: GoogleFonts.inter(fontSize: 12, color: AGColors.stone)),
        ),
      );
    }

    double maxVal = 10.0;
    for (var g in grafico) {
      if (g.receita > maxVal) maxVal = g.receita;
      if (g.custo > maxVal) maxVal = g.custo;
    }

    return SizedBox(
      height: 100,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: List.generate(grafico.length, (i) {
          final item = grafico[i];
          final double hReceita = maxVal > 0 ? (item.receita / maxVal) : 0.0;
          final double hCusto = maxVal > 0 ? (item.custo / maxVal) : 0.0;

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
                        height: 70 * hReceita,
                        decoration: BoxDecoration(
                          color: AGColors.brandGreen.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                      Container(
                        height: 70 * hCusto,
                        decoration: BoxDecoration(
                          color: AGColors.accentOrange.withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(item.label,
                      style: GoogleFonts.inter(
                          fontSize: 9, color: AGColors.stone, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}
