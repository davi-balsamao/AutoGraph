// AdminOrdersScreen — Histórico de pedidos admin (mobile)
//
// Referência: ClaudeDesign/components/admin-mobile-screens-b.jsx → AdmMobileOrders
//
// Reutiliza: OsService().fetchOrdensServico()

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/services/os_service.dart';
import '../../../core/models/ordem_servico.dart';
import '../shared/adm_badge.dart';

class AdminOrdersScreen extends StatefulWidget {
  const AdminOrdersScreen({super.key});

  @override
  State<AdminOrdersScreen> createState() => _AdminOrdersScreenState();
}

class _AdminOrdersScreenState extends State<AdminOrdersScreen> {
  List<OrdemServico> _orders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final items = await OsService().fetchOrdensServico();
      if (mounted) setState(() { _orders = items; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
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
      body: Column(
        children: [
          SafeArea(
            bottom: false,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text('Pedidos',
                                style: GoogleFonts.inter(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w600,
                                  color: textColor,
                                  letterSpacing: -0.3,
                                )),
                          ),
                          Icon(Icons.download_outlined,
                              color: mutedColor, size: 20),
                        ],
                      ),
                      Text('847 em 2025 · R\$ 124.380 totais',
                          style: GoogleFonts.inter(
                              fontSize: 11, color: mutedColor)),
                    ],
                  ),
                ),

                // Mini KPIs scroll
                SizedBox(
                  height: 70,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: [
                      _MiniKpi('PEDIDOS MÊS', '187', '↑ 24',
                          AGColors.brandGreenMid, cardBg, borderColor,
                          textColor, mutedColor),
                      _MiniKpi('RECEITA MÊS', 'R\$ 28,1k', '↑ R\$ 3,2k',
                          AGColors.brandGreenMid, cardBg, borderColor,
                          textColor, mutedColor),
                      _MiniKpi('TICKET MÉDIO', 'R\$ 150', 'estimado',
                          mutedColor, cardBg, borderColor,
                          textColor, mutedColor),
                    ],
                  ),
                ),

                const SizedBox(height: 8),

                // Filtros
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: ['Maio 2025 ▾', 'Status: todos ▾', 'Produto: todos ▾']
                        .map((f) => Container(
                              margin: const EdgeInsets.only(right: 8),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: surfaceBg,
                                borderRadius:
                                    BorderRadius.circular(AGRadius.sm),
                                border: Border.all(color: borderColor),
                              ),
                              child: Text(f,
                                  style: GoogleFonts.inter(
                                      fontSize: 12, color: textColor)),
                            ))
                        .toList(),
                  ),
                ),

                const SizedBox(height: 4),
              ],
            ),
          ),

          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(
                        color: AGColors.brandGreen))
                : _orders.isEmpty
                    ? _EmptyState()
                    : ListView.builder(
                        padding: EdgeInsets.only(
                          left: 16, right: 16, top: 8,
                          bottom: 100 + MediaQuery.of(context).padding.bottom,
                        ),
                        itemCount: _orders.length,
                        itemBuilder: (ctx, i) => _OrderCard(
                          os: _orders[i],
                          cardBg: cardBg,
                          borderColor: borderColor,
                          textColor: textColor,
                          mutedColor: mutedColor,
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _MiniKpi extends StatelessWidget {
  final String label, value, delta;
  final Color deltaColor, cardBg, borderColor, textColor, mutedColor;

  const _MiniKpi(this.label, this.value, this.delta, this.deltaColor,
      this.cardBg, this.borderColor, this.textColor, this.mutedColor);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 130,
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(AGRadius.md),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label,
              style: GoogleFonts.inter(
                  fontSize: 9, fontWeight: FontWeight.w600,
                  color: mutedColor, letterSpacing: 0.4)),
          const SizedBox(height: 3),
          Text(value,
              style: GoogleFonts.inter(
                  fontSize: 16, fontWeight: FontWeight.w700,
                  color: textColor, letterSpacing: -0.3)),
          Text(delta,
              style: GoogleFonts.inter(
                  fontSize: 10, color: deltaColor, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final OrdemServico os;
  final Color cardBg, borderColor, textColor, mutedColor;

  const _OrderCard({
    required this.os, required this.cardBg, required this.borderColor,
    required this.textColor, required this.mutedColor,
  });

  @override
  Widget build(BuildContext context) {
    final statusBadge = switch (os.status) {
      StatusOS.emProducao         => AdmBadge('EM PRODUÇÃO', AdmBadgeStyle.orange),
      StatusOS.aguardandoOrcamento => AdmBadge('AGUARD.', AdmBadgeStyle.gray),
      StatusOS.entregue           => AdmBadge('ENTREGUE', AdmBadgeStyle.soft),
      StatusOS.cancelada          => AdmBadge('CANCELADA', AdmBadgeStyle.danger),
      _                           => AdmBadge('APROVADO', AdmBadgeStyle.blue),
    };

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(AGRadius.xl - 4),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              statusBadge,
              const Spacer(),
              Text(
                '${os.criadoEm.day.toString().padLeft(2,'0')}/${os.criadoEm.month.toString().padLeft(2,'0')} ${os.criadoEm.hour.toString().padLeft(2,'0')}:${os.criadoEm.minute.toString().padLeft(2,'0')}',
                style: GoogleFonts.inter(fontSize: 11, color: mutedColor),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(os.produtoResumo,
              style: GoogleFonts.inter(
                fontSize: 14, fontWeight: FontWeight.w600, color: textColor)),
          const SizedBox(height: 4),
          Row(
            children: [
              Text(os.clienteNome ?? '—',
                  style: GoogleFonts.inter(fontSize: 12, color: mutedColor)),
              const Spacer(),
              Text('R\$ —',
                  style: GoogleFonts.inter(
                    fontSize: 14, fontWeight: FontWeight.w700, color: textColor)),
            ],
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text('Nenhum pedido encontrado',
          style: GoogleFonts.inter(fontSize: 14, color: AGColors.stone)),
    );
  }
}
