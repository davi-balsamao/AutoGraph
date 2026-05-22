// AdminOrdersScreen — Histórico de pedidos admin (mobile)
//
// Referência: ClaudeDesign/components/admin-mobile-screens-b.jsx → AdmMobileOrders
//
// Reutiliza: OsService().fetchOrdensServico()

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/services/os_service.dart';
import '../../../core/widgets/ag_theme_toggle.dart';
import '../../../core/models/ordem_servico.dart';
import '../../../core/services/chat_service.dart';
import '../shared/adm_badge.dart';

class AdminOrdersScreen extends StatefulWidget {
  const AdminOrdersScreen({super.key});

  @override
  State<AdminOrdersScreen> createState() => _AdminOrdersScreenState();
}

class _AdminOrdersScreenState extends State<AdminOrdersScreen> {
  List<OrdemServico> _orders = [];
  bool _loading = true;
  late String _selectedMes;
  StatusOS? _selectedStatus;
  String _selectedProduto = 'Todos';
  StreamSubscription<OsEvent>? _osSub;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    _selectedMes = '${meses[now.month - 1]} ${now.year}';
    _load();
    _osSub = ChatService().osEventStream.listen((event) {
      if (event.tipo == OsEventTipo.nova || event.tipo == OsEventTipo.atualizada) {
        _load();
      }
    });
  }

  @override
  void dispose() {
    _osSub?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final items = await OsService().fetchOrdensServico();
      if (mounted) setState(() { _orders = items; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  int get _pedidosMes {
    final now = DateTime.now();
    return _orders.where((o) => o.criadoEm.year == now.year && o.criadoEm.month == now.month).length;
  }

  double get _receitaMes {
    final now = DateTime.now();
    return _orders
        .where((o) =>
            o.status != StatusOS.cancelada &&
            o.status != StatusOS.criada &&
            o.status != StatusOS.aguardandoOrcamento &&
            o.criadoEm.year == now.year &&
            o.criadoEm.month == now.month)
        .fold(0.0, (sum, o) => sum + o.total);
  }

  double get _ticketMedioMes {
    final now = DateTime.now();
    final active = _orders
        .where((o) =>
            o.status != StatusOS.cancelada &&
            o.status != StatusOS.criada &&
            o.status != StatusOS.aguardandoOrcamento &&
            o.criadoEm.year == now.year &&
            o.criadoEm.month == now.month)
        .toList();
    if (active.isEmpty) return 0.0;
    return active.fold(0.0, (sum, o) => sum + o.total) / active.length;
  }

  List<String> get _mesesDisponiveis {
    final set = <String>{'Todos'};
    const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    final now = DateTime.now();
    set.add('${meses[now.month - 1]} ${now.year}');
    for (var o in _orders) {
      set.add('${meses[o.criadoEm.month - 1]} ${o.criadoEm.year}');
    }
    return set.toList();
  }

  List<StatusOS?> get _statusDisponiveis => [null, ...StatusOS.values];

  List<String> get _produtosDisponiveis {
    final set = <String>{'Todos'};
    for (var o in _orders) {
      set.add(o.produtoResumo);
    }
    return set.toList();
  }

  List<OrdemServico> get _filteredOrders {
    return _orders.where((o) {
      const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      final mesOs = '${meses[o.criadoEm.month - 1]} ${o.criadoEm.year}';
      if (_selectedMes != 'Todos' && mesOs != _selectedMes) return false;
      if (_selectedStatus != null && o.status != _selectedStatus) return false;
      if (_selectedProduto != 'Todos' && o.produtoResumo != _selectedProduto) return false;
      return true;
    }).toList();
  }

  Widget _buildFilterDropdown<T>({
    required T value,
    required List<T> items,
    required ValueChanged<T?> onChanged,
    required Color surfaceBg,
    required Color borderColor,
    required Color textColor,
    String Function(T)? labelBuilder,
  }) {
    return Container(
      height: 32,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: surfaceBg,
        borderRadius: BorderRadius.circular(AGRadius.sm),
        border: Border.all(color: borderColor),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: items.contains(value) ? value : items.first,
          icon: Icon(Icons.arrow_drop_down, color: textColor, size: 16),
          dropdownColor: surfaceBg,
          isDense: true,
          style: GoogleFonts.inter(fontSize: 12, color: textColor),
          onChanged: onChanged,
          items: items.map((item) {
            final label = labelBuilder != null ? labelBuilder(item) : item.toString();
            return DropdownMenuItem<T>(
              value: item,
              child: Text(label),
            );
          }).toList(),
        ),
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
                          const ThemeToggleIcon(size: 36),
                      const SizedBox(width: 8),
                      Icon(Icons.download_outlined,
                              color: mutedColor, size: 20),
                        ],
                      ),
                      Text('${_orders.length} pedidos totais',
                          style: GoogleFonts.inter(
                              fontSize: 11, color: mutedColor)),
                    ],
                  ),
                ),

                // Mini KPIs scroll
                SizedBox(
                  height: 88,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: [
                      _MiniKpi('PEDIDOS MÊS', '$_pedidosMes', 'este mês',
                          AGColors.brandGreenMid, cardBg, borderColor,
                          textColor, mutedColor),
                      _MiniKpi('RECEITA MÊS', 'R\$ ${_receitaMes.toStringAsFixed(2).replaceAll('.', ',')}', 'este mês',
                          AGColors.brandGreenMid, cardBg, borderColor,
                          textColor, mutedColor),
                      _MiniKpi('TICKET MÉDIO', 'R\$ ${_ticketMedioMes.toStringAsFixed(2).replaceAll('.', ',')}', 'este mês',
                          AGColors.brandGreenMid, cardBg, borderColor,
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
                    children: [
                      _buildFilterDropdown<String>(
                        value: _selectedMes,
                        items: _mesesDisponiveis,
                        onChanged: (val) => setState(() => _selectedMes = val!),
                        surfaceBg: surfaceBg,
                        borderColor: borderColor,
                        textColor: textColor,
                      ),
                      const SizedBox(width: 8),
                      _buildFilterDropdown<StatusOS?>(
                        value: _selectedStatus,
                        items: _statusDisponiveis,
                        labelBuilder: (val) => val == null ? 'Status: todos' : 'Status: ${val.label}',
                        onChanged: (val) => setState(() => _selectedStatus = val),
                        surfaceBg: surfaceBg,
                        borderColor: borderColor,
                        textColor: textColor,
                      ),
                      const SizedBox(width: 8),
                      _buildFilterDropdown<String>(
                        value: _selectedProduto,
                        items: _produtosDisponiveis,
                        labelBuilder: (val) => val == 'Todos' ? 'Produto: todos' : 'Produto: $val',
                        onChanged: (val) => setState(() => _selectedProduto = val!),
                        surfaceBg: surfaceBg,
                        borderColor: borderColor,
                        textColor: textColor,
                      ),
                    ],
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
                : _filteredOrders.isEmpty
                    ? _EmptyState()
                    : ListView.builder(
                        padding: EdgeInsets.only(
                          left: 16, right: 16, top: 8,
                          bottom: 100 + MediaQuery.of(context).padding.bottom,
                        ),
                        itemCount: _filteredOrders.length,
                        itemBuilder: (ctx, i) => _OrderCard(
                          os: _filteredOrders[i],
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
      StatusOS.aguardandoOrcamento  => AdmBadge('AGUARD.', AdmBadgeStyle.gray),
      StatusOS.aprovado             => AdmBadge('APROVADO', AdmBadgeStyle.blue),
      StatusOS.emProducao           => AdmBadge('PROGRESSO', AdmBadgeStyle.orange),
      StatusOS.prontaParaRetirada   => AdmBadge('REVISÃO', AdmBadgeStyle.blue),
      StatusOS.entregue             => AdmBadge('CONCLUÍDO', AdmBadgeStyle.soft),
      StatusOS.cancelada            => AdmBadge('CANCELADO', AdmBadgeStyle.danger),
      _                             => AdmBadge('CRIADA', AdmBadgeStyle.gray),
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
              Text(
                os.total > 0
                    ? 'R\$ ${os.total.toStringAsFixed(2).replaceAll('.', ',')}'
                    : 'A definir',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: textColor,
                ),
              ),
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
