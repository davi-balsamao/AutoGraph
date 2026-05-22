import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/widgets/ag_theme_toggle.dart';
import '../../../core/services/os_service.dart';
import '../../../core/models/ordem_servico.dart';

class AdminFinanceScreen extends StatefulWidget {
  const AdminFinanceScreen({super.key});

  @override
  State<AdminFinanceScreen> createState() => _AdminFinanceScreenState();
}

class _AdminFinanceScreenState extends State<AdminFinanceScreen> {
  List<OrdemServico> _orders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final list = await OsService().fetchOrdensServico();
      if (mounted) {
        setState(() {
          _orders = list;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  double _calculateOrderValue(OrdemServico os) {
    final String productName = os.produtoResumo.toLowerCase();
    final int qty = (os.especificacoes['quantidade'] ?? os.especificacoes['qtd'] ?? 1) as int;
    double pricePerUnit = 12.0; // default
    if (productName.contains('a5')) {
      pricePerUnit = 0.12;
    } else if (productName.contains('a6')) {
      pricePerUnit = 0.06;
    } else if (productName.contains('lona') || productName.contains('440g')) {
      pricePerUnit = 49.00;
    } else if (productName.contains('oxford')) {
      pricePerUnit = 79.00;
    } else if (productName.contains('bloco')) {
      pricePerUnit = 12.00;
    } else if (productName.contains('panfleto')) {
      pricePerUnit = 0.12;
    } else if (productName.contains('banner')) {
      pricePerUnit = 49.00;
    } else {
      pricePerUnit = 15.00;
    }
    return pricePerUnit * qty;
  }

  double get _totalRevenue {
    double total = 0.0;
    for (final os in _orders) {
      if (os.status != StatusOS.cancelada) {
        total += _calculateOrderValue(os);
      }
    }
    return total;
  }

  double get _totalCosts {
    // 32% cost (68% margin)
    return _totalRevenue * 0.32;
  }

  double get _liquidMargin {
    return _totalRevenue - _totalCosts;
  }

  String _formatCurrency(double val) {
    if (val >= 1000) {
      return 'R\$ ${(val / 1000).toStringAsFixed(1)}k'.replaceAll('.', ',');
    }
    return 'R\$ ${val.toStringAsFixed(2)}'.replaceAll('.', ',');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.bgDarkDeep : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final cardBg = isDark ? AGColors.canvasDark : AGColors.canvas;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;

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
                    Text(_loading ? '...' : _formatCurrency(_totalRevenue),
                        style: GoogleFonts.inter(
                          fontSize: 28,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                          letterSpacing: -0.5,
                        )),
                    const SizedBox(height: 4),
                    Text(
                        _loading
                            ? 'Carregando dados...'
                            : 'Sincronizado com ${_orders.where((o) => o.status != StatusOS.cancelada).length} pedidos ativos',
                        style: GoogleFonts.inter(
                            fontSize: 11, color: AGColors.muted)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _LegendItem(
                          '● Recebido',
                          _loading ? '...' : _formatCurrency(_totalRevenue),
                          AGColors.brandGreen,
                        ),
                        const SizedBox(width: 20),
                        _LegendItem('● A receber', 'R\$ 0,00', AGColors.accentOrange),
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
                  value: _loading ? '...' : _formatCurrency(_totalCosts),
                  sub: 'margem média 68%',
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
                  value: _loading ? '...' : _formatCurrency(_liquidMargin),
                  sub: 'lucro operacional',
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

          // ── Gráficos — sem dados reais ainda
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(AGRadius.xl - 4),
              border: Border.all(color: borderColor),
            ),
            child: Column(
              children: [
                Icon(Icons.bar_chart_rounded, size: 36, color: AGColors.stone),
                const SizedBox(height: 8),
                Text('Gráficos disponíveis em breve',
                    style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: textColor)),
                const SizedBox(height: 4),
                Text(
                  'O módulo financeiro será integrado\nquando o tracking de caixa estiver ativo.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(fontSize: 11, color: mutedColor, height: 1.5),
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
