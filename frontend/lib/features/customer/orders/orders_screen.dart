// OrdersScreen — Tela de Pedidos do cliente (06 · Pedidos)
//
// Referência: ClaudeDesign/components/app-screens-b.jsx → OrdersScreen
// Dados mockados. Real: OsService().fetchOrdensServico(clienteId: ...)

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/widgets/ag_product_glyph.dart';

enum _OrderFilter { todos, emAndamento, concluidos }

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  _OrderFilter _filter = _OrderFilter.todos;

  static final _orders = [
    _Order(
      id: 'A-2847',
      kind: AGProductKind.panfleto,
      title: '1.000 panfletos A5',
      status: 'Em produção',
      date: '12/05',
      total: 189.0,
      inProgress: true,
      step: 1,
    ),
    _Order(
      id: 'A-2831',
      kind: AGProductKind.banner,
      title: 'Banner LED 3×2m',
      status: 'Arte aprovada',
      date: '10/05',
      total: 320.0,
      inProgress: true,
      step: 0,
    ),
    _Order(
      id: 'A-2790',
      kind: AGProductKind.bloco,
      title: 'Bloco RPA 2 vias',
      status: 'Concluído',
      date: '02/05',
      total: 240.0,
      inProgress: false,
      step: 3,
    ),
    _Order(
      id: 'A-2755',
      kind: AGProductKind.apostila,
      title: 'Apostila espiral 80p',
      status: 'Concluído',
      date: '20/04',
      total: 145.0,
      inProgress: false,
      step: 3,
    ),
  ];

  List<_Order> get _filtered => switch (_filter) {
    _OrderFilter.emAndamento => _orders.where((o) => o.inProgress).toList(),
    _OrderFilter.concluidos  => _orders.where((o) => !o.inProgress).toList(),
    _OrderFilter.todos       => _orders,
  };

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.bgDarkDeep : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;

    final emAndamento = _orders.where((o) => o.inProgress).length;
    final concluidos = _orders.where((o) => !o.inProgress).length;

    return Scaffold(
      backgroundColor: bg,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Pedidos',
                      style: GoogleFonts.inter(
                        fontSize: 28,
                        fontWeight: FontWeight.w600,
                        letterSpacing: -0.6,
                        color: textColor,
                      )),
                  const SizedBox(height: 2),
                  Text(
                    '$emAndamento em andamento · $concluidos concluídos',
                    style: GoogleFonts.inter(fontSize: 13, color: mutedColor),
                  ),
                  const SizedBox(height: 14),
                  // Segmented control
                  _SegmentedControl(
                    selected: _filter,
                    onSelect: (f) => setState(() => _filter = f),
                    isDark: isDark,
                  ),
                ],
              ),
            ),
          ),

          Expanded(
            child: _filtered.isEmpty
                ? Center(
                    child: Text('Nenhum pedido encontrado',
                        style: GoogleFonts.inter(
                            fontSize: 14, color: AGColors.stone)))
                : ListView.builder(
                    padding: EdgeInsets.only(
                      left: 20, right: 20, top: 8,
                      bottom: 100 + MediaQuery.of(context).padding.bottom,
                    ),
                    itemCount: _filtered.length,
                    itemBuilder: (ctx, i) => _OrderCard(
                      order: _filtered[i],
                      isDark: isDark,
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

// ── Modelos e helpers ─────────────────────────────────────────────

class _Order {
  final String id, title, status, date;
  final AGProductKind kind;
  final double total;
  final bool inProgress;
  final int step; // 0-3

  const _Order({
    required this.id, required this.kind, required this.title,
    required this.status, required this.date, required this.total,
    required this.inProgress, required this.step,
  });
}

class _SegmentedControl extends StatelessWidget {
  final _OrderFilter selected;
  final ValueChanged<_OrderFilter> onSelect;
  final bool isDark;

  const _SegmentedControl({
    required this.selected,
    required this.onSelect,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final options = [
      (_OrderFilter.todos, 'Todos'),
      (_OrderFilter.emAndamento, 'Em andamento'),
      (_OrderFilter.concluidos, 'Concluídos'),
    ];

    final activeBg = isDark ? AGColors.brandGreen : AGColors.ink;
    final activeFg = isDark ? AGColors.onPrimary : Colors.white;
    final inactiveFg = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final pillBg = isDark ? AGColors.surfaceDark : AGColors.surfaceSoft;
    final pillBorder = isDark ? AGColors.hairlineDark : AGColors.hairline;

    return Container(
      height: 38,
      decoration: BoxDecoration(
        color: pillBg,
        borderRadius: BorderRadius.circular(AGRadius.full),
        border: Border.all(color: pillBorder),
      ),
      padding: const EdgeInsets.all(3),
      child: Row(
        children: options.map((opt) {
          final (filter, label) = opt;
          final isActive = filter == selected;
          return Expanded(
            child: GestureDetector(
              onTap: () => onSelect(filter),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                decoration: BoxDecoration(
                  color: isActive ? activeBg : Colors.transparent,
                  borderRadius: BorderRadius.circular(AGRadius.full),
                ),
                child: Center(
                  child: Text(
                    label,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isActive ? activeFg : inactiveFg,
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final _Order order;
  final bool isDark;
  final Color textColor, mutedColor;

  static const _steps = [
    '✓ Aprovado',
    '● Imprimindo',
    '○ Saiu p/ entrega',
    '○ Entregue',
  ];

  const _OrderCard({
    required this.order, required this.isDark,
    required this.textColor, required this.mutedColor,
  });

  Color _tagBg() => switch (order.status) {
    'Em produção'    => AGColors.accentOrange,
    'Arte aprovada'  => AGColors.brandGreenSoft,
    'Concluído'      => AGColors.brandGreenMid,
    _                => AGColors.surfaceSoft,
  };

  Color _tagFg() => switch (order.status) {
    'Arte aprovada' => AGColors.brandGreenDark,
    'Concluído'     => Colors.white,
    _               => Colors.white,
  };

  @override
  Widget build(BuildContext context) {
    final cardBg = isDark ? AGColors.canvasDark : AGColors.canvas;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(AGRadius.xl - 4),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Linha principal
          Row(
            children: [
              // Glyph
              Container(
                width: 48, height: 48,
                clipBehavior: Clip.hardEdge,
                decoration: BoxDecoration(
                  color: isDark ? AGColors.surfaceDark : AGColors.surfaceSoft,
                  borderRadius: BorderRadius.circular(AGRadius.md),
                  border: Border.all(color: borderColor),
                ),
                child: AGProductGlyph(kind: order.kind, size: 60),
              ),
              const SizedBox(width: 12),

              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Tag + data
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 3),
                          decoration: BoxDecoration(
                            color: _tagBg(),
                            borderRadius: BorderRadius.circular(AGRadius.xs),
                          ),
                          child: Text(
                            order.status.toUpperCase(),
                            style: GoogleFonts.inter(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.5,
                              color: _tagFg(),
                            ),
                          ),
                        ),
                        const Spacer(),
                        Text(order.date,
                            style: GoogleFonts.inter(
                                fontSize: 11, color: mutedColor)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(order.title,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: textColor,
                        )),
                    Row(
                      children: [
                        Text(
                          '#${order.id}',
                          style: GoogleFonts.jetBrainsMono(
                              fontSize: 11, color: mutedColor),
                        ),
                        const Spacer(),
                        Text(
                          'R\$ ${order.total.toStringAsFixed(2).replaceAll('.', ',')}',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: textColor,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Progress steps (se em andamento)
          if (order.inProgress) ...[
            const SizedBox(height: 12),
            // Barra de progresso
            ClipRRect(
              borderRadius: BorderRadius.circular(2),
              child: LinearProgressIndicator(
                value: (order.step + 1) / 4,
                backgroundColor:
                    isDark ? AGColors.hairlineDark : AGColors.hairline,
                color: AGColors.brandGreen,
                minHeight: 3,
              ),
            ),
            const SizedBox(height: 8),
            // Steps
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(4, (i) {
                final done = i <= order.step;
                final current = i == order.step;
                return Expanded(
                  child: Text(
                    _steps[i],
                    style: GoogleFonts.inter(
                      fontSize: 9,
                      fontWeight: current
                          ? FontWeight.w700
                          : FontWeight.w400,
                      color: done
                          ? (isDark
                              ? AGColors.brandGreen
                              : AGColors.brandGreenDark)
                          : mutedColor,
                    ),
                    textAlign: i == 0
                        ? TextAlign.left
                        : i == 3
                            ? TextAlign.right
                            : TextAlign.center,
                  ),
                );
              }),
            ),
          ],
        ],
      ),
    );
  }
}
