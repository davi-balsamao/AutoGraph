// OrdersScreen — Tela de Pedidos do cliente (06 · Pedidos)
//
// Referência: ClaudeDesign/components/app-screens-b.jsx → OrdersScreen

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/widgets/ag_product_glyph.dart';
import '../../../core/services/os_service.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/models/ordem_servico.dart';

enum _OrderFilter { todos, emAndamento, concluidos }

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  _OrderFilter _filter = _OrderFilter.todos;
  List<OrdemServico> _orders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final list = await OsService().fetchOrdensServico();
      final client = AuthService().currentUser;
      if (client != null) {
        // Filtrar apenas pedidos deste cliente
        _orders = list.where((o) => o.clienteId == client.id).toList();
      } else {
        _orders = [];
      }
    } catch (_) {
      _orders = [];
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _cancelarPedido(OrdemServico os) async {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.surfaceDark : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: bg,
        title: Text('Cancelar Pedido', style: TextStyle(color: textColor)),
        content: Text(
          'Deseja realmente cancelar este pedido? Esta ação não pode ser desfeita.',
          style: TextStyle(color: textColor),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Voltar'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AGColors.danger),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Confirmar Cancelamento', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _loading = true);
    try {
      await OsService().updateStatus(os.id, StatusOS.cancelada);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pedido cancelado com sucesso!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao cancelar: $e')),
        );
      }
    } finally {
      _load();
    }
  }

  Future<void> _showAddOrderDialog({String? initialProduct}) async {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.surfaceDark : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final borderColor = isDark ? AGColors.hairlineDarkStr : AGColors.hairline;

    String selectedProduct = initialProduct ?? 'Panfleto A5';
    final qtyCtrl = TextEditingController(text: '1000');
    final obsCtrl = TextEditingController();
    PlatformFile? selectedFile;

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              backgroundColor: bg,
              title: Text(
                'Novo Pedido',
                style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: textColor),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Produto', style: TextStyle(color: mutedColor, fontSize: 12)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      initialValue: selectedProduct,
                      dropdownColor: bg,
                      style: TextStyle(color: textColor),
                      items: [
                        'Panfleto A5',
                        'Panfleto A6',
                        'Banner Lona 440g',
                        'Banner Oxford',
                        'Bloco 50fls 1 via'
                      ].map((p) {
                        return DropdownMenuItem<String>(
                          value: p,
                          child: Text(p, style: TextStyle(color: textColor, fontSize: 13)),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setStateDialog(() => selectedProduct = val ?? 'Panfleto A5');
                      },
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text('Quantidade', style: TextStyle(color: mutedColor, fontSize: 12)),
                    const SizedBox(height: 4),
                    TextField(
                      controller: qtyCtrl,
                      keyboardType: TextInputType.number,
                      style: TextStyle(color: textColor),
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text('Arte do Pedido (opcional)', style: TextStyle(color: mutedColor, fontSize: 12)),
                    const SizedBox(height: 4),
                    GestureDetector(
                      onTap: () async {
                        final result = await FilePicker.platform.pickFiles(
                          type: FileType.any,
                        );
                        if (result != null && result.files.isNotEmpty) {
                          setStateDialog(() {
                            selectedFile = result.files.first;
                          });
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isDark ? AGColors.surfaceDark : AGColors.surfaceSoft,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: selectedFile != null ? AGColors.brandGreen : borderColor,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              selectedFile != null ? Icons.check_circle_outline : Icons.cloud_upload_outlined,
                              color: selectedFile != null ? AGColors.brandGreen : mutedColor,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                selectedFile != null ? selectedFile!.name : 'Selecionar arquivo...',
                                style: TextStyle(
                                  color: selectedFile != null ? textColor : mutedColor,
                                  fontSize: 13,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (selectedFile != null)
                              GestureDetector(
                                onTap: () {
                                  setStateDialog(() {
                                    selectedFile = null;
                                  });
                                },
                                child: const Icon(Icons.close, size: 18, color: Colors.red),
                              ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text('Observações', style: TextStyle(color: mutedColor, fontSize: 12)),
                    const SizedBox(height: 4),
                    TextField(
                      controller: obsCtrl,
                      maxLines: 2,
                      style: TextStyle(color: textColor),
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancelar'),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: AGColors.brandGreen),
                  onPressed: () async {
                    final qty = int.tryParse(qtyCtrl.text) ?? 1000;
                    final obs = obsCtrl.text.trim();
                    final client = AuthService().currentUser;

                    if (client == null) return;

                    Navigator.pop(context);
                    setState(() => _loading = true);
                    try {
                      await OsService().createOrdemServico(
                        clienteId: client.id,
                        especificacoes: {
                          'produtoNome': selectedProduct,
                          'quantidade': qty,
                        },
                        observacoes: obs.isNotEmpty ? obs : null,
                        file: selectedFile,
                      );
                      if (mounted) {
                        ScaffoldMessenger.of(this.context).showSnackBar(
                          const SnackBar(content: Text('Pedido criado com sucesso!')),
                        );
                      }
                    } catch (e) {
                      if (mounted) {
                        ScaffoldMessenger.of(this.context).showSnackBar(
                          SnackBar(content: Text('Erro ao criar pedido: $e')),
                        );
                      }
                    } finally {
                      _load();
                    }
                  },
                  child: const Text('Confirmar', style: TextStyle(color: Colors.white)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  List<OrdemServico> get _filtered => switch (_filter) {
    _OrderFilter.emAndamento => _orders.where((o) => o.status != StatusOS.entregue && o.status != StatusOS.cancelada).toList(),
    _OrderFilter.concluidos  => _orders.where((o) => o.status == StatusOS.entregue || o.status == StatusOS.cancelada).toList(),
    _OrderFilter.todos       => _orders,
  };

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.bgDarkDeep : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;

    final emAndamento = _orders.where((o) => o.status != StatusOS.entregue && o.status != StatusOS.cancelada).length;
    final concluidos = _orders.where((o) => o.status == StatusOS.entregue || o.status == StatusOS.cancelada).length;

    return Scaffold(
      backgroundColor: bg,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddOrderDialog,
        backgroundColor: AGColors.brandGreen,
        icon: const Icon(Icons.add, color: AGColors.onPrimary),
        label: const Text('Novo Pedido', style: TextStyle(color: AGColors.onPrimary, fontWeight: FontWeight.w600)),
      ),
      bottomNavigationBar: SizedBox(
        height: 66 + MediaQuery.of(context).padding.bottom,
      ),
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
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AGColors.brandGreen))
                : _filtered.isEmpty
                    ? Center(
                        child: Text('Nenhum pedido encontrado',
                            style: GoogleFonts.inter(
                                fontSize: 14, color: AGColors.stone)))
                    : ListView.builder(
                        padding: const EdgeInsets.only(
                          left: 20, right: 20, top: 8,
                          bottom: 24,
                        ),
                        itemCount: _filtered.length,
                        itemBuilder: (ctx, i) => _OrderCard(
                          order: _filtered[i],
                          isDark: isDark,
                          textColor: textColor,
                          mutedColor: mutedColor,
                          onCancel: () => _cancelarPedido(_filtered[i]),
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

// ── Helpers ────────────────────────────────────────────────────────

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
      (_OrderFilter.emAndamento, 'Ativos'),
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
  final OrdemServico order;
  final bool isDark;
  final Color textColor, mutedColor;
  final VoidCallback onCancel;

  static const _steps = [
    '✓ Aprovado',
    '● Imprimindo',
    '○ Saiu p/ entrega',
    '○ Entregue',
  ];

  const _OrderCard({
    required this.order, required this.isDark,
    required this.textColor, required this.mutedColor,
    required this.onCancel,
  });

  AGProductKind get _kind {
    final name = order.produtoResumo.toLowerCase();
    if (name.contains('banner')) return AGProductKind.banner;
    if (name.contains('bloco')) return AGProductKind.bloco;
    if (name.contains('apostila')) return AGProductKind.apostila;
    return AGProductKind.panfleto;
  }

  String get _title {
    final qty = order.especificacoes['quantidade'] ?? order.especificacoes['qtd'] ?? '';
    final qtyStr = qty.toString().isNotEmpty ? ' ($qty un)' : '';
    return '${order.produtoResumo}$qtyStr';
  }

  String get _date {
    return '${order.criadoEm.day.toString().padLeft(2, '0')}/${order.criadoEm.month.toString().padLeft(2, '0')}';
  }

  double get _total {
    final orcamento = order.especificacoes['orcamento'] as Map?;
    return (orcamento?['total'] as num?)?.toDouble() ?? 0.0;
  }

  bool get _inProgress {
    return order.status != StatusOS.entregue && order.status != StatusOS.cancelada;
  }

  int get _step => switch (order.status) {
    StatusOS.criada => 0,
    StatusOS.aguardandoOrcamento => 0,
    StatusOS.aprovado => 1,
    StatusOS.emProducao => 2,
    StatusOS.prontaParaRetirada => 3,
    _ => 3,
  };

  Color _tagBg() => switch (order.status) {
    StatusOS.criada               => AGColors.muted,
    StatusOS.aguardandoOrcamento => AGColors.accentBlue,
    StatusOS.emProducao           => AGColors.accentOrange,
    StatusOS.aprovado             => AGColors.brandGreenSoft,
    StatusOS.prontaParaRetirada   => AGColors.accentPurple,
    StatusOS.entregue             => AGColors.brandGreenMid,
    StatusOS.cancelada            => Colors.red,
  };

  Color _tagFg() => switch (order.status) {
    StatusOS.aprovado => AGColors.brandGreenDark,
    StatusOS.entregue => Colors.white,
    StatusOS.cancelada => Colors.white,
    _ => Colors.white,
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
                child: AGProductGlyph(kind: _kind, size: 60),
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
                            order.status.label.toUpperCase(),
                            style: GoogleFonts.inter(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.5,
                              color: _tagFg(),
                            ),
                          ),
                        ),
                        const Spacer(),
                        Text(_date,
                            style: GoogleFonts.inter(
                                fontSize: 11, color: mutedColor)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(_title,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: textColor,
                        )),
                    Row(
                      children: [
                        Text(
                          '#${order.id.substring(0, 6).toUpperCase()}',
                          style: GoogleFonts.jetBrainsMono(
                              fontSize: 11, color: mutedColor),
                        ),
                        const Spacer(),
                        if (_total > 0)
                          Text(
                            'R\$ ${_total.toStringAsFixed(2).replaceAll('.', ',')}',
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
          if (_inProgress) ...[
            const SizedBox(height: 12),
            // Barra de progresso
            ClipRRect(
              borderRadius: BorderRadius.circular(2),
              child: LinearProgressIndicator(
                value: (_step + 1) / 4,
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
                final done = i <= _step;
                final current = i == _step;
                return Expanded(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: i == 0
                        ? Alignment.centerLeft
                        : i == 3
                            ? Alignment.centerRight
                            : Alignment.center,
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
                  ),
                );
              }),
            ),
          ],

          // Cancel button if active
          if (order.status != StatusOS.cancelada && order.status != StatusOS.entregue) ...[
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: onCancel,
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.red,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  ),
                  child: Text(
                    'Cancelar Pedido',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ]
        ],
      ),
    );
  }
}
