// KanbanScreen — Tela de Kanban de OSs (admin mobile)
//
// Referência: ClaudeDesign/components/admin-mobile-screens-a.jsx → AdmMobileKanban
//
// Reutiliza: OsService().fetchOrdensServico() para buscar OSs reais

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import 'dart:async';
import '../../../core/services/os_service.dart';
import '../../../core/services/chat_service.dart';
import '../../../core/models/ordem_servico.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/widgets/ag_theme_toggle.dart';
import 'widgets/kanban_card.dart';
import '../../../core/models/user_model.dart';
import '../../../core/services/auth_service.dart';

class KanbanScreen extends StatefulWidget {
  const KanbanScreen({super.key});

  @override
  State<KanbanScreen> createState() => _KanbanScreenState();
}

class _KanbanScreenState extends State<KanbanScreen> {
  List<OrdemServico> _all = [];
  bool _loading = true;
  StreamSubscription<OsEvent>? _osSub;

  static const _statusTabs = [
    (StatusOS.aguardandoOrcamento, 'Aguard.'),
    (StatusOS.aprovado,            'Aprov.'),
    (StatusOS.emProducao,          'Progresso'),
    (StatusOS.prontaParaRetirada,  'Revisão'),
    (StatusOS.entregue,            'Concl.'),
  ];

  // Labels e cores dos status (fiel ao Claude Design)
  static const _statusColors = {
    'Aguard.':   AGColors.muted,
    'Aprov.':    AGColors.accentBlue,
    'Progresso': AGColors.accentOrange,
    'Revisão':   AGColors.accentPurple,
    'Concl.':    AGColors.brandGreen,
  };

  int _tabIndex = 0;

  @override
  void initState() {
    super.initState();
    _load();
    // Listener real-time: recarrega quando nova OS chega ou é atualizada via Socket.io
    _osSub = ChatService().osEventStream.listen((event) {
      if (event.tipo == OsEventTipo.nova || event.tipo == OsEventTipo.atualizada) _load();
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
      if (mounted) setState(() { _all = items; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<OrdemServico> get _filtered {
    if (_all.isEmpty) return [];
    final currentStatus = _statusTabs[_tabIndex].$1;
    if (currentStatus == StatusOS.aguardandoOrcamento) {
      return _all.where((o) => o.status == StatusOS.criada || o.status == StatusOS.aguardandoOrcamento).toList();
    }
    return _all.where((o) => o.status == currentStatus).toList();
  }

  Future<void> _showCreateOsDialog() async {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.surfaceDark : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;

    List<UserModel> clients = [];
    bool loadingClients = true;
    UserModel? selectedClient;
    String selectedProduct = 'Panfletos';
    final qtyCtrl = TextEditingController(text: '1000');
    final priceCtrl = TextEditingController(text: '150');
    final obsCtrl = TextEditingController();

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            if (loadingClients) {
              AuthService().fetchUsers().then((value) {
                if (mounted) {
                  setStateDialog(() {
                    clients = value.where((u) => u.isCliente).toList();
                    loadingClients = false;
                    if (clients.isNotEmpty) {
                      selectedClient = clients.first;
                    }
                  });
                }
              }).catchError((_) {
                if (mounted) {
                  setStateDialog(() {
                    loadingClients = false;
                  });
                }
              });
            }

            return AlertDialog(
              backgroundColor: bg,
              title: Text(
                'Criar Nova OS',
                style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: textColor),
              ),
              content: loadingClients
                  ? const SizedBox(
                      height: 100,
                      child: Center(child: CircularProgressIndicator(color: AGColors.brandGreen)),
                    )
                  : SingleChildScrollView(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Cliente', style: TextStyle(color: mutedColor, fontSize: 12)),
                          const SizedBox(height: 4),
                          DropdownButtonFormField<UserModel>(
                            value: selectedClient,
                            dropdownColor: bg,
                            style: TextStyle(color: textColor),
                            items: clients.map((c) {
                              return DropdownMenuItem<UserModel>(
                                value: c,
                                child: Text('${c.nome} (${c.telefone})', style: TextStyle(color: textColor, fontSize: 13)),
                              );
                            }).toList(),
                            onChanged: (val) {
                              setStateDialog(() => selectedClient = val);
                            },
                            decoration: InputDecoration(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text('Produto', style: TextStyle(color: mutedColor, fontSize: 12)),
                          const SizedBox(height: 4),
                          DropdownButtonFormField<String>(
                            value: selectedProduct,
                            dropdownColor: bg,
                            style: TextStyle(color: textColor),
                            items: ['Panfletos', 'Banners', 'Blocos', 'Apostilas'].map((p) {
                              return DropdownMenuItem<String>(
                                value: p,
                                child: Text(p, style: TextStyle(color: textColor, fontSize: 13)),
                              );
                            }).toList(),
                            onChanged: (val) {
                              setStateDialog(() => selectedProduct = val ?? 'Panfletos');
                            },
                            decoration: InputDecoration(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
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
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Valor Total (R\$)', style: TextStyle(color: mutedColor, fontSize: 12)),
                                    const SizedBox(height: 4),
                                    TextField(
                                      controller: priceCtrl,
                                      keyboardType: TextInputType.number,
                                      style: TextStyle(color: textColor),
                                      decoration: InputDecoration(
                                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
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
                  onPressed: selectedClient == null
                      ? null
                      : () async {
                          final qty = int.tryParse(qtyCtrl.text) ?? 1000;
                          final price = double.tryParse(priceCtrl.text) ?? 0.0;
                          Navigator.pop(context);
                          setState(() => _loading = true);
                          try {
                            await OsService().createOrdemServico(
                              clienteId: selectedClient!.id,
                              especificacoes: {
                                'produtoNome': selectedProduct,
                                'quantidade': qty,
                                'orcamento': {
                                  'total': price,
                                  'prazo': '3 dias úteis',
                                }
                              },
                              observacoes: obsCtrl.text.trim().isNotEmpty ? obsCtrl.text.trim() : null,
                            );
                            if (mounted) {
                              ScaffoldMessenger.of(this.context).showSnackBar(
                                const SnackBar(content: Text('OS criada com sucesso!')),
                              );
                            }
                          } catch (e) {
                            if (mounted) {
                              ScaffoldMessenger.of(this.context).showSnackBar(
                                SnackBar(content: Text('Erro ao criar OS: $e')),
                              );
                            }
                          } finally {
                            _load();
                          }
                        },
                  child: const Text('Criar', style: TextStyle(color: Colors.white)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.bgDarkDeep : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairlineSoft;

    return Scaffold(
      backgroundColor: bg,
      body: Column(
        children: [
          SafeArea(
            bottom: false,
            child: Column(
              children: [
                // ── Header
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 16, 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Ordens de serviço',
                                style: GoogleFonts.inter(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w600,
                                  color: textColor,
                                  letterSpacing: -0.3,
                                )),
                            Text(
                              '${_all.length} OSs ativas · toque longo num card pra mudar status',
                              style: GoogleFonts.inter(
                                  fontSize: 11, color: mutedColor),
                            ),
                          ],
                        ),
                      ),
                      const ThemeToggleIcon(size: 36),
                      const SizedBox(width: 8),
                      // FAB inline
                      GestureDetector(
                        onTap: _showCreateOsDialog,
                        child: Container(
                          width: 36, height: 36,
                          decoration: const BoxDecoration(
                            color: AGColors.brandGreen,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.add_rounded,
                              color: AGColors.onPrimary, size: 20),
                        ),
                      ),
                    ],
                  ),
                ),

                // ── Status tabs horizontal
                Container(
                  decoration: BoxDecoration(
                    border: Border(bottom: BorderSide(color: borderColor)),
                  ),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: List.generate(_statusTabs.length, (i) {
                        final label = _statusTabs[i].$2;
                        final isActive = i == _tabIndex;
                        final dotColor = _statusColors[label] ?? AGColors.muted;

                        return GestureDetector(
                          onTap: () => setState(() => _tabIndex = i),
                          child: Container(
                            padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                            margin: const EdgeInsets.only(right: 4),
                            decoration: BoxDecoration(
                              border: isActive
                                  ? const Border(
                                      bottom: BorderSide(
                                        color: AGColors.brandGreen,
                                        width: 2,
                                      ))
                                  : null,
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 6, height: 6,
                                  decoration: BoxDecoration(
                                    color: dotColor,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  label,
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: isActive
                                        ? FontWeight.w600
                                        : FontWeight.w500,
                                    color: isActive
                                        ? (isDark
                                            ? AGColors.onDark
                                            : AGColors.ink)
                                        : AGColors.stone,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ── Lista de cards
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(
                        color: AGColors.brandGreen))
                : _filtered.isEmpty
                    ? Center(
                        child: Text('Nenhuma OS neste status',
                            style: GoogleFonts.inter(
                                fontSize: 14, color: AGColors.stone)))
                    : ListView.builder(
                        padding: EdgeInsets.only(
                          left: 16,
                          right: 16,
                          top: 12,
                          bottom: 100 + MediaQuery.of(context).padding.bottom,
                        ),
                        itemCount: _filtered.length,
                        itemBuilder: (ctx, i) {
                          final item = _filtered[i];
                          return KanbanCard(
                            os: item,
                            onTap: () => Navigator.pushNamed(
                              ctx,
                              AppRoutes.osDetails,
                              arguments: item,
                            ),
                            onApprove: () async {
                              setState(() => _loading = true);
                              try {
                                await OsService().updateStatus(item.id, StatusOS.aprovado);
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('OS aprovada com sucesso!')),
                                  );
                                }
                              } catch (e) {
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Erro ao aprovar: $e')),
                                  );
                                }
                              } finally {
                                _load();
                              }
                            },
                            onReject: () async {
                              final confirm = await showDialog<bool>(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('Confirmar Recusa/Cancelamento'),
                                  content: const Text('Deseja realmente recusar e cancelar esta OS?'),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(context, false),
                                      child: const Text('Não'),
                                    ),
                                    ElevatedButton(
                                      style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                                      onPressed: () => Navigator.pop(context, true),
                                      child: const Text('Sim, Recusar', style: TextStyle(color: Colors.white)),
                                    ),
                                  ],
                                ),
                              );

                              if (confirm != true) return;

                              setState(() => _loading = true);
                              try {
                                await OsService().updateStatus(item.id, StatusOS.cancelada);
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('OS recusada/cancelada com sucesso!')),
                                  );
                                }
                              } catch (e) {
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Erro ao recusar: $e')),
                                  );
                                }
                              } finally {
                                _load();
                              }
                            },
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
