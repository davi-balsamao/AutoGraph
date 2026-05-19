import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/models/ordem_servico.dart';
import '../../../core/models/produto.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/os_service.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/utils/snackbar_util.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/services/produto_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/theme_notifier.dart';
import '../../admin_chat/presentation/admin_chat_list_tab.dart';
import '../../admin_chat/presentation/admin_chat_conversation_screen.dart';
import 'admin_usuarios_tab.dart';
import 'aprovacoes_tab.dart';
import '../../../core/services/chat_service.dart';
import '../../../core/services/proposta_service.dart';
import '../../../core/services/push_notification_service.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  int _currentIndex = 0;
  final GlobalKey<_KanbanTabState> _kanbanKey = GlobalKey<_KanbanTabState>();
  final GlobalKey<AdminChatListTabState> _chatKey = GlobalKey<AdminChatListTabState>();
  int _propostasPendentes = 0;
  int _conversasEscaladas = 0;
  StreamSubscription? _propostaSub;
  StreamSubscription? _pushTapSub;
  StreamSubscription? _osSub;
  StreamSubscription? _conversaSub;

  @override
  void initState() {
    super.initState();
    _carregarContadorPropostas();
    _propostaSub = ChatService().propostaEventStream.listen((_) {
      _carregarContadorPropostas();
    });
    _pushTapSub = PushNotificationService().onNotificationTap.listen((data) {
      if (!mounted) return;
      if (data['type'] == 'PROPOSTA_PENDENTE') {
        setState(() => _currentIndex = 1);
      }
      if (data['type'] == 'escalation') {
        setState(() => _currentIndex = 2);
      }
    });
    
    // 👇 O DASHBOARD JÁ ESTÁ A OUVIR EVENTOS DA OS A PARTIR DO CHATSERVICE!
    _osSub = ChatService().osEventStream.listen((event) {
      if (!mounted) return;
      // Seja OS nova ou atualizada, mandamos o Kanban recarregar
      _kanbanKey.currentState?.refresh();
    });
    
    _conversaSub = ChatService().conversaEventStream.listen((event) {
      if (!mounted) return;
      setState(() {
        if (event.tipo == ConversaEventTipo.assumida) {
          _conversasEscaladas++;
        } else if (event.tipo == ConversaEventTipo.devolvida && _conversasEscaladas > 0) {
          _conversasEscaladas--;
        }
      });
    });
  }

  @override
  void dispose() {
    _propostaSub?.cancel();
    _pushTapSub?.cancel();
    _osSub?.cancel();
    _conversaSub?.cancel();
    super.dispose();
  }

  Future<void> _carregarContadorPropostas() async {
    try {
      final lista = await PropostaService().listarPendentes();
      if (!mounted) return;
      setState(() => _propostasPendentes = lista.length);
    } catch (_) {}
  }

  Future<void> _addOsManual() async {
    final clienteIdController = TextEditingController(text: 'c1');
    final larguraController = TextEditingController();
    final alturaController = TextEditingController();
    final observacoesController = TextEditingController();
    Produto? produtoSelecionado;
    PlatformFile? arquivoSelecionado;

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setStateDialog) {
          return AlertDialog(
            title: Row(
              children: [
                const Icon(Icons.add_task, color: AppColors.brandGreen, size: 22),
                const SizedBox(width: 10),
                Text('Nova OS Manual', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18)),
              ],
            ),
            backgroundColor: Theme.of(context).colorScheme.surface,
            surfaceTintColor: Colors.transparent,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            content: SingleChildScrollView(
              child: FutureBuilder<List<Produto>>(
                future: ProdutoService().fetchProdutos(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const SizedBox(height: 100, child: Center(child: CircularProgressIndicator()));
                  }
                  final produtos = snapshot.data ?? [];
                  if (produtos.isNotEmpty && produtoSelecionado == null) {
                    produtoSelecionado = produtos.first;
                  }

                  return Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (produtos.isEmpty)
                        const Text('Nenhum produto cadastrado no catálogo.', style: TextStyle(color: Colors.red))
                      else
                        DropdownButtonFormField<Produto>(
                          value: produtoSelecionado,
                          decoration: const InputDecoration(labelText: 'Produto do Catálogo', prefixIcon: Icon(Icons.inventory_2_outlined, size: 18)),
                          items: produtos.map((p) => DropdownMenuItem(value: p, child: Text('${p.nome} (R\$ ${p.precoBase.toStringAsFixed(2)})'))).toList(),
                          onChanged: (val) => setStateDialog(() => produtoSelecionado = val),
                        ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: clienteIdController,
                        decoration: const InputDecoration(labelText: 'ID ou Nome do Cliente', prefixIcon: Icon(Icons.person_outline, size: 18)),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: larguraController,
                              decoration: const InputDecoration(labelText: 'Largura (cm)', prefixIcon: Icon(Icons.straighten, size: 18)),
                              keyboardType: TextInputType.number,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: TextField(
                              controller: alturaController,
                              decoration: const InputDecoration(labelText: 'Altura (cm)', prefixIcon: Icon(Icons.height, size: 18)),
                              keyboardType: TextInputType.number,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      InkWell(
                        onTap: () async {
                          final res = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: ['jpg', 'png', 'pdf'], withData: true);
                          if (res != null && res.files.isNotEmpty) {
                            setStateDialog(() => arquivoSelecionado = res.files.first);
                          }
                        },
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
                          decoration: BoxDecoration(
                            border: Border.all(color: arquivoSelecionado != null ? AppColors.brandGreen : Theme.of(context).dividerColor),
                            borderRadius: BorderRadius.circular(8),
                            color: arquivoSelecionado != null ? AppColors.brandGreen.withValues(alpha: 0.1) : Colors.transparent,
                          ),
                          child: Row(
                            children: [
                              Icon(arquivoSelecionado != null ? Icons.check_circle : Icons.upload_file, color: arquivoSelecionado != null ? AppColors.brandGreen : Colors.grey, size: 20),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(arquivoSelecionado?.name ?? 'Anexar arte pronta (Opcional)', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13)),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: observacoesController,
                        maxLines: 2,
                        decoration: const InputDecoration(labelText: 'Observações / Acabamento', prefixIcon: Icon(Icons.notes, size: 18)),
                      ),
                    ],
                  );
                },
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: Text('CANCELAR', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
              ),
              ElevatedButton(
                onPressed: () async {
                  if (produtoSelecionado == null) return;
                  try {
                    await OsService().createOrdemServico(
                      clienteId: clienteIdController.text.trim().isEmpty ? 'c1' : clienteIdController.text.trim(),
                      especificacoes: {
                        'produtoId': produtoSelecionado!.id,
                        'produtoNome': produtoSelecionado!.nome,
                        'dimensoes': {
                          'largura': larguraController.text.trim(),
                          'altura': alturaController.text.trim(),
                        },
                        'precoBaseReferencia': produtoSelecionado!.precoBase,
                      },
                      observacoes: observacoesController.text.trim(),
                      file: arquivoSelecionado,
                    );
                    if (ctx.mounted) Navigator.pop(ctx, true);
                  } catch (e) {
                    if (ctx.mounted) SnackbarUtil.showError(ctx, 'Erro ao criar pedido: $e');
                  }
                },
                child: const Text('CRIAR PEDIDO'),
              ),
            ],
          );
        },
      ),
    );

    if (result == true) {
      _kanbanKey.currentState?.refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    final brandTealDeep = AppColors.brandTealDeep;
    final brandGreen = AppColors.brandGreen;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.auto_awesome, color: AppColors.brandGreen, size: 24),
            const SizedBox(width: 12),
            Text('AutoGraph', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: brandTealDeep, borderRadius: BorderRadius.circular(4)),
              child: const Text('ADMIN', style: TextStyle(color: AppColors.brandGreen, fontSize: 10, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
        actions: [
          IconButton(
            key: const Key('btn_admin_register_client'),
            icon: const Icon(Icons.person_add_alt_1),
            onPressed: () => Navigator.pushNamed(context, AppRoutes.register, arguments: true),
            tooltip: 'Cadastrar Cliente',
          ),
          IconButton(
            key: const Key('btn_toggle_theme_admin'),
            icon: Icon(
              themeNotifier.themeMode == ThemeMode.dark
                  ? Icons.light_mode
                  : Icons.dark_mode,
            ),
            onPressed: () => themeNotifier.toggleTheme(),
          ),
          IconButton(
            key: const Key('btn_logout'),
            icon: const Icon(Icons.logout),
            onPressed: () async {
              final nav = Navigator.of(context);
              await AuthService().logout();
              if (mounted) {
                nav.pushReplacementNamed(AppRoutes.login);
              }
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          _KanbanTab(key: _kanbanKey),
          const AprovacoesTab(),
          AdminChatListTab(key: _chatKey),
          const _AdminHistoryTab(),
          const _FinancialTab(),
          const _CatalogTab(),
          const AdminUsuariosTab(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        height: 64,
        elevation: 0,
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.view_kanban_outlined),
            selectedIcon: Icon(Icons.view_kanban, color: AppColors.brandGreen),
            label: 'Kanban',
          ),
          NavigationDestination(
            icon: _propostasPendentes > 0
                ? Badge.count(
                    count: _propostasPendentes,
                    backgroundColor: Colors.amber.shade700,
                    child: const Icon(Icons.pending_actions_outlined),
                  )
                : const Icon(Icons.pending_actions_outlined),
            selectedIcon: const Icon(Icons.pending_actions, color: AppColors.brandGreen),
            label: 'Aprovações',
          ),
          NavigationDestination(
            icon: _conversasEscaladas > 0
                ? Badge.count(
                    count: _conversasEscaladas,
                    backgroundColor: Colors.amber.shade700,
                    child: const Icon(Icons.chat_bubble_outline),
                  )
                : const Icon(Icons.chat_bubble_outline),
            selectedIcon: const Icon(Icons.chat_bubble, color: AppColors.brandGreen),
            label: 'Chat',
          ),
          const NavigationDestination(
            icon: Icon(Icons.history_outlined),
            selectedIcon: Icon(Icons.history, color: AppColors.brandGreen),
            label: 'Histórico',
          ),
          const NavigationDestination(
            icon: Icon(Icons.bar_chart_outlined),
            selectedIcon: Icon(Icons.bar_chart, color: AppColors.brandGreen),
            label: 'Financeiro',
          ),
          const NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2, color: AppColors.brandGreen),
            label: 'Catálogo',
          ),
          const NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people, color: AppColors.brandGreen),
            label: 'Usuários',
          ),
        ],
      ),
      floatingActionButton: _currentIndex == 0 ? FloatingActionButton(
        heroTag: 'fab_admin_kanban',
        onPressed: _addOsManual,
        backgroundColor: brandGreen,
        foregroundColor: brandTealDeep,
        shape: const CircleBorder(),
        child: const Icon(Icons.add),
      ) : null,
    );
  }
}

// ─────────────────────────────── KANBAN TAB ───────────────────────────────

class _KanbanTab extends StatefulWidget {
  const _KanbanTab({super.key});
  @override
  State<_KanbanTab> createState() => _KanbanTabState();
}

class _KanbanTabState extends State<_KanbanTab> {
  final Map<StatusOS, List<OrdemServico>> _columns = {};
  final Map<String, Timer?> _timers = {};
  final Map<String, int> _elapsed = {};
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchData();
    // O Socket agora é gerido pelo ChatService, a UI não cria túneis duplicados!
  }

  void refresh() => _fetchData();

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final ordens = await OsService().fetchOrdensServico();
      if (!mounted) return;

      for (final t in _timers.values) {
        t?.cancel();
      }
      _timers.clear();
      _elapsed.clear();

      _columns.clear();
      for (final s in StatusOS.values) {
        _columns[s] = ordens.where((o) => o.status == s).toList();
      }

      for (final o in ordens) {
        if (o.timerStartedAt != null) {
          final now = DateTime.now();
          final elapsedSoFar = now.difference(o.timerStartedAt!).inSeconds + o.durationSeconds;
          _elapsed[o.id] = elapsedSoFar;
          _timers[o.id] = Timer.periodic(const Duration(seconds: 1), (_) {
            if (mounted) {
              setState(() => _elapsed[o.id] = (_elapsed[o.id] ?? 0) + 1);
            }
          });
        } else {
          _elapsed[o.id] = o.durationSeconds;
        }
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    for (final t in _timers.values) {
      t?.cancel();
    }
    super.dispose();
  }

  Future<void> _moveOS(OrdemServico os, StatusOS newStatus) async {
    final oldStatus = os.status;
    setState(() {
      _columns[oldStatus]?.remove(os);
      final updated = os.copyWith(status: newStatus);
      _columns[newStatus] ??= [];
      _columns[newStatus]!.add(updated);

      if (newStatus == StatusOS.emProducao) {
        if (_timers[os.id] == null) {
          _elapsed.putIfAbsent(os.id, () => os.durationSeconds);
          _timers[os.id] = Timer.periodic(const Duration(seconds: 1), (_) {
            if (mounted) {
              setState(() => _elapsed[os.id] = (_elapsed[os.id] ?? 0) + 1);
            }
          });
        }
      } else {
        if (_timers[os.id] != null) {
          _timers[os.id]?.cancel();
          _timers[os.id] = null;
        }
      }
    });
    
    try {
      await OsService().updateStatus(os.id, newStatus);
      if (mounted) {
        SnackbarUtil.showSuccess(context, 'OS #${os.id.substring(os.id.length - 3)} → ${newStatus.label}');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _columns[newStatus]?.removeWhere((item) => item.id == os.id);
          _columns[oldStatus] ??= [];
          _columns[oldStatus]!.add(os);

          if (oldStatus == StatusOS.emProducao) {
            if (_timers[os.id] == null) {
              _timers[os.id] = Timer.periodic(const Duration(seconds: 1), (_) {
                if (mounted) {
                  setState(() => _elapsed[os.id] = (_elapsed[os.id] ?? 0) + 1);
                }
              });
            }
          } else {
            if (_timers[os.id] != null) {
              _timers[os.id]?.cancel();
              _timers[os.id] = null;
            }
          }
        });
        SnackbarUtil.showError(context, 'Erro ao atualizar status na API: $e');
      }
    }
  }

  Future<void> _cancelOS(OrdemServico os) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.cancel, color: Colors.red),
            const SizedBox(width: 10),
            Text('Cancelar Pedido', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text('Deseja realmente cancelar o pedido de ${os.clienteNome ?? "Cliente"} (${os.produtoResumo})?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('NÃO')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('SIM, CANCELAR'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await OsService().updateStatus(os.id, StatusOS.cancelada);
        if (mounted) {
          SnackbarUtil.showSuccess(context, 'Pedido cancelado com sucesso.');
          _fetchData();
        }
      } catch (e) {
        if (mounted) SnackbarUtil.showError(context, 'Erro ao cancelar pedido: $e');
      }
    }
  }

  Future<void> _toggleTimer(String osId) async {
    final currentlyRunning = _timers[osId] != null;
    try {
      if (currentlyRunning) {
        _timers[osId]?.cancel();
        _timers[osId] = null;
        setState(() {});
        await OsService().stopTimer(osId);
      } else {
        _elapsed.putIfAbsent(osId, () => 0);
        _timers[osId] = Timer.periodic(const Duration(seconds: 1), (_) {
          if (mounted) {
            setState(() => _elapsed[osId] = (_elapsed[osId] ?? 0) + 1);
          }
        });
        setState(() {});
        await OsService().startTimer(osId);
      }
    } catch (e) {
      if (mounted) {
        SnackbarUtil.showError(context, 'Erro ao alternar timer: $e');
        _fetchData();
      }
    }
  }

  String _formatDuration(int secs) {
    final h = (secs ~/ 3600).toString().padLeft(2, '0');
    final m = ((secs % 3600) ~/ 60).toString().padLeft(2, '0');
    final s = (secs % 60).toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading && _columns.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null && _columns.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Erro ao carregar', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(_error!),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _fetchData, child: const Text('Tentar novamente')),
          ],
        ),
      );
    }

    final visibleStatuses = [
      StatusOS.criada,
      StatusOS.aguardandoOrcamento,
      StatusOS.emProducao,
      StatusOS.prontaParaRetirada,
      StatusOS.entregue
    ];

    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 700;

    if (isMobile) {
      return DefaultTabController(
        length: visibleStatuses.length,
        child: Column(
          children: [
            TabBar(
              isScrollable: true,
              tabAlignment: TabAlignment.start,
              labelColor: AppColors.brandGreen,
              unselectedLabelColor: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
              indicatorColor: AppColors.brandGreen,
              indicatorWeight: 3,
              labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13),
              tabs: visibleStatuses.map((s) => Tab(text: s.label)).toList(),
            ),
            Expanded(
              child: TabBarView(
                children: visibleStatuses.map((status) {
                  final items = _columns[status] ?? [];
                  return RefreshIndicator(
                    onRefresh: _fetchData,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                      child: _KanbanColumn(
                        status: status,
                        items: items,
                        isMobile: true,
                        onAccept: (os) => _moveOS(os, status),
                        onMoveTo: _moveOS,
                        onCancel: _cancelOS,
                        onToggleTimer: _toggleTimer,
                        timers: _timers,
                        elapsed: _elapsed,
                        formatDuration: _formatDuration,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchData,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverFillRemaining(
            hasScrollBody: true,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.all(16),
              children: visibleStatuses.map((status) {
                final items = _columns[status] ?? [];
                return _KanbanColumn(
                  status: status,
                  items: items,
                  isMobile: false,
                  onAccept: (os) => _moveOS(os, status),
                  onMoveTo: _moveOS,
                  onCancel: _cancelOS,
                  onToggleTimer: _toggleTimer,
                  timers: _timers,
                  elapsed: _elapsed,
                  formatDuration: _formatDuration,
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────── KANBAN COLUMN ───────────────────────────────

class _KanbanColumn extends StatelessWidget {
  final StatusOS status;
  final List<OrdemServico> items;
  final bool isMobile;
  final void Function(OrdemServico) onAccept;
  final void Function(OrdemServico, StatusOS) onMoveTo;
  final void Function(OrdemServico) onCancel;
  final void Function(String) onToggleTimer;
  final Map<String, Timer?> timers;
  final Map<String, int> elapsed;
  final String Function(int) formatDuration;

  const _KanbanColumn({
    required this.status,
    required this.items,
    required this.isMobile,
    required this.onAccept,
    required this.onMoveTo,
    required this.onCancel,
    required this.onToggleTimer,
    required this.timers,
    required this.elapsed,
    required this.formatDuration,
  });

  Color get _columnColor {
    switch (status) {
      case StatusOS.aguardandoOrcamento: return AppColors.orange;
      case StatusOS.emProducao: return AppColors.purple;
      case StatusOS.prontaParaRetirada: return AppColors.brandGreen;
      case StatusOS.entregue: return AppColors.steel;
      default: return AppColors.brandTeal;
    }
  }

  @override
  Widget build(BuildContext context) {
    return DragTarget<OrdemServico>(
      onWillAcceptWithDetails: (details) => details.data.status != status,
      onAcceptWithDetails: (details) => onAccept(details.data),
      builder: (context, candidateData, rejectedData) {
        final isHovering = candidateData.isNotEmpty;
        return Container(
          width: isMobile ? double.infinity : 320,
          margin: isMobile ? EdgeInsets.zero : const EdgeInsets.only(right: 20),
          decoration: BoxDecoration(
            color: isHovering ? AppColors.surfaceSoft : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.only(bottom: 16, top: 8),
                child: Row(children: [
                  Container(
                    width: 4, height: 20,
                    decoration: BoxDecoration(color: _columnColor, borderRadius: BorderRadius.circular(2)),
                  ),
                  const SizedBox(width: 12),
                  Text(status.label.toUpperCase(), style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 1, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: Theme.of(context).colorScheme.surfaceContainerHighest, borderRadius: BorderRadius.circular(999)),
                    child: Text('${items.length}', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
                  ),
                ]),
              ),
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Theme.of(context).dividerColor),
                  ),
                  child: items.isEmpty
                    ? Center(child: Text('Arraste aqui', style: TextStyle(color: Colors.grey.shade400, fontSize: 13)))
                    : ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: items.length,
                        itemBuilder: (_, i) => _OSCard(
                          os: items[i],
                          isTimerRunning: timers[items[i].id] != null,
                          elapsedSecs: elapsed[items[i].id] ?? 0,
                          onToggleTimer: () => onToggleTimer(items[i].id),
                          onCancel: () => onCancel(items[i]),
                          onMove: (newStatus) => onMoveTo(items[i], newStatus),
                          formatDuration: formatDuration,
                        ),
                      ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ─────────────────────────────── OS CARD ───────────────────────────────

class _OSCard extends StatelessWidget {
  final OrdemServico os;
  final bool isTimerRunning;
  final int elapsedSecs;
  final VoidCallback onToggleTimer;
  final VoidCallback onCancel;
  final void Function(StatusOS) onMove;
  final String Function(int) formatDuration;

  const _OSCard({
    required this.os,
    required this.isTimerRunning,
    required this.elapsedSecs,
    required this.onToggleTimer,
    required this.onCancel,
    required this.onMove,
    required this.formatDuration,
  });

  @override
  Widget build(BuildContext context) {
    return Draggable<OrdemServico>(
      data: os,
      feedback: Material(
        elevation: 8,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: 290, padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white, 
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.brandGreen, width: 2),
          ),
          child: Text(os.produtoResumo, style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        ),
      ),
      childWhenDragging: Opacity(opacity: 0.3, child: _buildCard(context)),
      child: _buildCard(context),
    );
  }

  Widget _buildCard(BuildContext context) {
    final solicitouCancelamento = os.especificacoes['solicitouCancelamento'] == true;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => Navigator.pushNamed(context, AppRoutes.osDetails, arguments: os),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (solicitouCancelamento)
                Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.red.shade600,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.warning, color: Colors.white, size: 12),
                      SizedBox(width: 4),
                      Text('CANCELAMENTO SOLICITADO', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded( // 👇 AQUI ESTÁ A CORREÇÃO DE LAYOUT DO RENDERFLEX OVERFLOW
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(os.produtoResumo, 
                          maxLines: 1, 
                          overflow: TextOverflow.ellipsis, 
                          style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 15, color: Theme.of(context).colorScheme.onSurface)
                        ),
                        const SizedBox(height: 4),
                        Text(os.clienteNome ?? 'Cliente não informado', 
                          maxLines: 1, 
                          overflow: TextOverflow.ellipsis, 
                          style: TextStyle(fontSize: 13, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.55))
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.chat_outlined, color: AppColors.brandGreen, size: 20),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => AdminChatConversationScreen(
                            clientId: os.clienteId,
                            clientName: os.clienteNome ?? 'Cliente',
                          ),
                        ),
                      );
                    },
                    tooltip: 'Conversar com Cliente',
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    padding: EdgeInsets.zero,
                  ),
                  IconButton(
                    icon: const Icon(Icons.low_priority, color: AppColors.brandTeal, size: 20),
                    onPressed: () => _showMoveMenu(context),
                    tooltip: 'Mover Pedido',
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    padding: EdgeInsets.zero,
                  ),
                  IconButton(
                    icon: const Icon(Icons.cancel_outlined, color: Colors.red, size: 20),
                    onPressed: onCancel,
                    tooltip: 'Cancelar Pedido',
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    padding: EdgeInsets.zero,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isTimerRunning
                      ? Colors.red.withValues(alpha: 0.12)
                      : Theme.of(context).colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    children: [
                      Icon(isTimerRunning ? Icons.timer : Icons.timer_outlined, size: 12, color: isTimerRunning ? Colors.red : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
                      const SizedBox(width: 4),
                      Text(formatDuration(elapsedSecs), style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isTimerRunning ? Colors.red : Theme.of(context).colorScheme.onSurface)),
                    ],
                  ),
                ),
                const Spacer(),
                SizedBox(
                  height: 28,
                  child: ElevatedButton(
                    onPressed: onToggleTimer,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isTimerRunning ? Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.15) : AppColors.brandGreen,
                      foregroundColor: isTimerRunning ? Theme.of(context).colorScheme.onSurface : AppColors.brandTealDeep,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      textStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                    child: Text(isTimerRunning ? 'PAUSAR' : 'INICIAR'),
                  ),
                ),
              ]),
            ],
          ),
        ),
      ),
    );
  }

  void _showMoveMenu(BuildContext context) {
    final statuses = StatusOS.values.where((s) => s != os.status && s != StatusOS.cancelada).toList();
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Alterar Status', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 8),
              Text('Selecione para onde mover esta OS', style: TextStyle(fontSize: 13, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
              const SizedBox(height: 24),
              ...statuses.map((s) {
                Color color;
                switch (s) {
                  case StatusOS.aguardandoOrcamento: color = AppColors.orange; break;
                  case StatusOS.emProducao: color = AppColors.purple; break;
                  case StatusOS.prontaParaRetirada: color = AppColors.brandGreen; break;
                  case StatusOS.entregue: color = AppColors.steel; break;
                  default: color = AppColors.brandTeal;
                }
                return ListTile(
                  leading: Container(
                    width: 12, height: 12,
                    decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                  ),
                  title: Text(s.label, style: GoogleFonts.outfit(fontWeight: FontWeight.w500, fontSize: 15)),
                  trailing: const Icon(Icons.chevron_right, size: 18),
                  onTap: () {
                    Navigator.pop(ctx);
                    onMove(s);
                  },
                );
              }),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────── FINANCIAL TAB ────────────────────────────

class _FinancialTab extends StatefulWidget {
  const _FinancialTab();

  @override
  State<_FinancialTab> createState() => _FinancialTabState();
}

class _FinancialTabState extends State<_FinancialTab> {
  bool _isLoading = false;
  List<OrdemServico> _ordens = [];

  @override
  void initState() {
    super.initState();
    _fetchOrdens();
  }

  Future<void> _fetchOrdens() async {
    setState(() => _isLoading = true);
    try {
      final ordens = await OsService().fetchOrdensServico();
      if (mounted) setState(() => _ordens = ordens);
    } catch (e) {
      // Silencioso
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    double totalRevenue = 0.0;
    final Map<String, double> revenueByProduct = {};
    int osCompletedCount = 0;

    for (final os in _ordens) {
      if (os.status != StatusOS.cancelada) {
        osCompletedCount++;
        final precoRef = os.especificacoes['precoBaseReferencia'] ?? os.especificacoes['precoBase'];
        double valor = 120.0;
        if (precoRef != null) {
          valor = double.tryParse(precoRef.toString()) ?? 120.0;
        }
        totalRevenue += valor;
        final nome = os.produtoResumo;
        revenueByProduct[nome] = (revenueByProduct[nome] ?? 0.0) + valor;
      }
    }

    if (revenueByProduct.isEmpty) {
      revenueByProduct.addAll({
        'Panfletos': 4500.0,
        'Cartões': 8200.0,
        'Banners': 3100.0,
        'Apostilas': 2800.0,
        'Blocos': 1900.0,
      });
      totalRevenue = revenueByProduct.values.fold(0.0, (a, b) => a + b);
      osCompletedCount = 47;
    }

    final avgTicket = osCompletedCount > 0 ? totalRevenue / osCompletedCount : 0.0;

    return RefreshIndicator(
      onRefresh: _fetchOrdens,
      child: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text('Visão Geral', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: cs.onSurface)),
          const SizedBox(height: 24),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            children: [
              _KpiCard(title: 'FATURAMENTO', value: 'R\$ ${totalRevenue.toStringAsFixed(0)}', icon: Icons.attach_money, color: AppColors.brandGreen),
              _KpiCard(title: 'OS FINALIZADAS', value: '$osCompletedCount', icon: Icons.check_circle_outline, color: AppColors.purple),
              _KpiCard(title: 'TICKET MÉDIO', value: 'R\$ ${avgTicket.toStringAsFixed(0)}', icon: Icons.trending_up, color: AppColors.orange),
            ],
          ),
          const SizedBox(height: 40),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: cs.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: cs.outline)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Receita por Categoria', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 32),
                SizedBox(
                  height: 200,
                  child: BarChart(
                    BarChartData(
                      alignment: BarChartAlignment.spaceAround,
                      maxY: (revenueByProduct.values.isEmpty ? 10000 : revenueByProduct.values.reduce((a, b) => a > b ? a : b)) * 1.2,
                      titlesData: FlTitlesData(
                        show: true,
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            getTitlesWidget: (value, meta) {
                              final titles = revenueByProduct.keys.toList();
                              if (value.toInt() >= 0 && value.toInt() < titles.length) {
                                return Padding(padding: const EdgeInsets.only(top: 8.0), child: Text(titles[value.toInt()], style: GoogleFonts.outfit(fontSize: 10, color: cs.onSurface.withValues(alpha: 0.5))));
                              }
                              return const SizedBox.shrink();
                            },
                            reservedSize: 30,
                          ),
                        ),
                        leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      ),
                      gridData: const FlGridData(show: false),
                      borderData: FlBorderData(show: false),
                      barGroups: revenueByProduct.entries.toList().asMap().entries.map((entry) {
                        return BarChartGroupData(
                          x: entry.key,
                          barRods: [BarChartRodData(toY: entry.value.value, color: AppColors.brandGreen, width: 32, borderRadius: const BorderRadius.vertical(top: Radius.circular(4)))],
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _KpiCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _KpiCard({required this.title, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final cardWidth = width < 600 ? (width - 48) : (width - 48 - 32) / 3;

    return SizedBox(
      width: cardWidth,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: color, size: 24),
              const SizedBox(height: 16),
              Text(value, style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
              const SizedBox(height: 4),
              Text(title, style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5), letterSpacing: 0.5)),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────── CATALOG TAB ────────────────────────────

class _CatalogTab extends StatefulWidget {
  const _CatalogTab();

  @override
  State<_CatalogTab> createState() => _CatalogTabState();
}

class _CatalogTabState extends State<_CatalogTab> {
  bool _isLoading = false;
  List<dynamic> _produtos = [];

  @override
  void initState() {
    super.initState();
    _fetchProdutos();
  }

  Future<void> _fetchProdutos() async {
    setState(() => _isLoading = true);
    try {
      final result = await ProdutoService().fetchProdutos();
      if (mounted) setState(() => _produtos = result);
    } catch (e) {
      if (mounted) SnackbarUtil.showError(context, 'Erro ao carregar catálogo: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _addProduto() async {
    final nomeController = TextEditingController();
    final precoController = TextEditingController();
    final descController = TextEditingController();
    final imagemController = TextEditingController();

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.inventory_2_outlined, size: 20, color: AppColors.brandGreen),
            const SizedBox(width: 10),
            Text('Novo Produto', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
          ],
        ),
        backgroundColor: Theme.of(context).colorScheme.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(controller: nomeController, decoration: const InputDecoration(labelText: 'Nome do Produto', prefixIcon: Icon(Icons.label_outline, size: 18))),
              const SizedBox(height: 16),
              TextField(controller: precoController, decoration: const InputDecoration(labelText: 'Preço Base (R\$)', prefixIcon: Icon(Icons.attach_money, size: 18)), keyboardType: TextInputType.number),
              const SizedBox(height: 16),
              TextField(controller: descController, maxLines: 2, decoration: const InputDecoration(labelText: 'Descrição (Opcional)', prefixIcon: Icon(Icons.notes_outlined, size: 18))),
              const SizedBox(height: 16),
              TextField(controller: imagemController, decoration: const InputDecoration(labelText: 'URL da Foto (Opcional)', hintText: 'https://...', prefixIcon: Icon(Icons.image_outlined, size: 18))),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('CANCELAR')),
          ElevatedButton(
            onPressed: () async {
              try {
                await ProdutoService().createProduto(nomeController.text, descController.text.isEmpty ? null : descController.text, double.parse(precoController.text.replaceAll(',', '.')), imagemUrl: imagemController.text.isEmpty ? null : imagemController.text);
                if (ctx.mounted) Navigator.pop(ctx, true);
              } catch (e) {
                if (ctx.mounted) SnackbarUtil.showError(ctx, 'Erro ao salvar produto.');
              }
            },
            child: const Text('SALVAR'),
          ),
        ],
      ),
    );
    if (result == true) _fetchProdutos();
  }

  Future<void> _editProduto(Produto produto) async {
    final nomeController = TextEditingController(text: produto.nome);
    final precoController = TextEditingController(text: produto.precoBase.toStringAsFixed(2));
    final descController = TextEditingController(text: produto.descricao ?? '');
    final imagemController = TextEditingController(text: produto.imagemUrl ?? '');

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.edit_outlined, size: 20, color: AppColors.brandGreen),
            const SizedBox(width: 10),
            Text('Editar Produto', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('CANCELAR')),
          ElevatedButton(
            onPressed: () async {
              try {
                await ProdutoService().updateProduto(produto.id, nome: nomeController.text, descricao: descController.text.isEmpty ? null : descController.text, precoBase: double.parse(precoController.text.replaceAll(',', '.')), imagemUrl: imagemController.text.isEmpty ? null : imagemController.text);
                if (ctx.mounted) Navigator.pop(ctx, true);
              } catch (e) {
                if (ctx.mounted) SnackbarUtil.showError(ctx, 'Erro ao salvar alterações.');
              }
            },
            child: const Text('SALVAR'),
          ),
        ],
      ),
    );
    if (result == true) _fetchProdutos();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    if (_isLoading) return const Center(child: CircularProgressIndicator());

    return Scaffold(
      body: _produtos.isEmpty
          ? Center(child: Text('Nenhum produto cadastrado.', style: TextStyle(color: cs.onSurface.withValues(alpha: 0.5))))
          : GridView.builder(
              padding: const EdgeInsets.all(24),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 16, mainAxisSpacing: 16, childAspectRatio: 0.85),
              itemCount: _produtos.length,
              itemBuilder: (context, i) {
                final p = _produtos[i] as Produto;
                return Card(
                  clipBehavior: Clip.antiAlias,
                  child: Column(
                    children: [
                      Expanded(child: Center(child: Icon(Icons.inventory_2, size: 40, color: AppColors.brandGreen))),
                      Padding(
                        padding: const EdgeInsets.all(14),
                        child: Text(p.nome, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14)),
                      ),
                    ],
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(onPressed: _addProduto, child: const Icon(Icons.add)),
    );
  }
}

// ─────────────────────────── ADMIN HISTORY TAB ────────────────────────────

class _AdminHistoryTab extends StatefulWidget {
  const _AdminHistoryTab();
  @override
  State<_AdminHistoryTab> createState() => _AdminHistoryTabState();
}

class _AdminHistoryTabState extends State<_AdminHistoryTab> {
  List<OrdemServico> _todasOrdens = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  Future<void> _fetchHistory() async {
    setState(() => _isLoading = true);
    try {
      final res = await OsService().fetchOrdensServico();
      if (mounted) setState(() => _todasOrdens = res);
    } catch (e) {
      // Silencioso
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _isLoading ? const Center(child: CircularProgressIndicator()) : ListView.builder(
      itemCount: _todasOrdens.length,
      itemBuilder: (_, i) => ListTile(title: Text(_todasOrdens[i].produtoResumo)),
    );
  }
}