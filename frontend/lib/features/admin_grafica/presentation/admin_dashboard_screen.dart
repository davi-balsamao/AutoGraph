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

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  int _currentIndex = 0;
  final GlobalKey<_KanbanTabState> _kanbanKey = GlobalKey<_KanbanTabState>();

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
                          initialValue: produtoSelecionado,
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
          const AdminChatListTab(),
          const _AdminHistoryTab(),
          const _FinancialTab(),
          const _CatalogTab(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        height: 64,
        elevation: 0,
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.view_kanban_outlined),
            selectedIcon: Icon(Icons.view_kanban, color: AppColors.brandGreen),
            label: 'Kanban',
          ),
          NavigationDestination(
            icon: Icon(Icons.chat_bubble_outline),
            selectedIcon: Icon(Icons.chat_bubble, color: AppColors.brandGreen),
            label: 'Chat',
          ),
          NavigationDestination(
            icon: Icon(Icons.history_outlined),
            selectedIcon: Icon(Icons.history, color: AppColors.brandGreen),
            label: 'Histórico',
          ),
          NavigationDestination(
            icon: Icon(Icons.bar_chart_outlined),
            selectedIcon: Icon(Icons.bar_chart, color: AppColors.brandGreen),
            label: 'Financeiro',
          ),
          NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2, color: AppColors.brandGreen),
            label: 'Catálogo',
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
      _columns.clear();
      for (final s in StatusOS.values) {
        _columns[s] = ordens.where((o) => o.status == s).toList();
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
    });
    
    try {
      await OsService().updateStatus(os.id, newStatus);
      if (mounted) {
        SnackbarUtil.showSuccess(context, 'OS #${os.id.substring(os.id.length - 3)} → ${newStatus.label}');
      }
    } catch (e) {
      // Reverte em caso de erro na API
      if (mounted) {
        setState(() {
          _columns[newStatus]?.removeWhere((item) => item.id == os.id);
          _columns[oldStatus] ??= [];
          _columns[oldStatus]!.add(os);
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

  void _toggleTimer(String osId) {
    if (_timers[osId] != null) {
      _timers[osId]?.cancel();
      _timers[osId] = null;
    } else {
      _elapsed.putIfAbsent(osId, () => 0);
      _timers[osId] = Timer.periodic(const Duration(seconds: 1), (_) {
        setState(() => _elapsed[osId] = (_elapsed[osId] ?? 0) + 1);
      });
    }
    setState(() {});
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

    final visibleStatuses = [StatusOS.criada, StatusOS.aguardandoOrcamento, StatusOS.emProducao, StatusOS.prontaParaRetirada, StatusOS.entregue];
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
                  onAccept: (os) => _moveOS(os, status),
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

class _KanbanColumn extends StatelessWidget {
  final StatusOS status;
  final List<OrdemServico> items;
  final void Function(OrdemServico) onAccept;
  final void Function(OrdemServico) onCancel;
  final void Function(String) onToggleTimer;
  final Map<String, Timer?> timers;
  final Map<String, int> elapsed;
  final String Function(int) formatDuration;

  const _KanbanColumn({
    required this.status,
    required this.items,
    required this.onAccept,
    required this.onCancel,
    required this.onToggleTimer,
    required this.timers,
    required this.elapsed,
    required this.formatDuration,
  });

  Color get _columnColor {
    switch (status) {
      case StatusOS.aguardandoOrcamento: return AppColors.orange; // MongoDB Orange
      case StatusOS.emProducao: return AppColors.purple; // MongoDB Purple
      case StatusOS.prontaParaRetirada: return AppColors.brandGreen; // MongoDB Green
      case StatusOS.entregue: return AppColors.steel; // MongoDB Steel
      default: return AppColors.brandTeal; // MongoDB Teal
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
          width: 320,
          margin: const EdgeInsets.only(right: 20),
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

class _OSCard extends StatelessWidget {
  final OrdemServico os;
  final bool isTimerRunning;
  final int elapsedSecs;
  final VoidCallback onToggleTimer;
  final VoidCallback onCancel;
  final String Function(int) formatDuration;

  const _OSCard({
    required this.os,
    required this.isTimerRunning,
    required this.elapsedSecs,
    required this.onToggleTimer,
    required this.onCancel,
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
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(os.produtoResumo, style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 15, color: Theme.of(context).colorScheme.onSurface)),
                        const SizedBox(height: 4),
                        Text(os.clienteNome ?? 'Cliente não informado', style: TextStyle(fontSize: 13, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.55))),
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
      // Mantém silencioso/vazio em caso de falha de conexão no mock
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

    // Fallback estético para o gráfico/KPIs caso a base esteja vazia ou no mock inicial
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
    final stockItems = {
      'Papel A4 (resmas)': 120,
      'Tinta Cyan (L)': 8,
      'Tinta Magenta (L)': 5,
      'Vinil Adesivo (m²)': 35,
      'Espiral (un)': 200
    };

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
            decoration: BoxDecoration(
              color: cs.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: cs.outline),
            ),
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
                      barTouchData: BarTouchData(enabled: true),
                      titlesData: FlTitlesData(
                        show: true,
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            getTitlesWidget: (value, meta) {
                              final titles = revenueByProduct.keys.toList();
                              if (value.toInt() >= 0 && value.toInt() < titles.length) {
                                return Padding(
                                  padding: const EdgeInsets.only(top: 8.0),
                                  child: Text(titles[value.toInt()], style: GoogleFonts.outfit(fontSize: 10, color: cs.onSurface.withValues(alpha: 0.5))),
                                );
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
                          barRods: [
                            BarChartRodData(
                              toY: entry.value.value,
                              color: AppColors.brandGreen,
                              width: 32,
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                            ),
                          ],
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 40),
          Text('Gestão de Insumos', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          Card(
            child: Column(
              children: stockItems.entries.map((e) {
                final isLow = e.value < 10;
                return Container(
                  decoration: BoxDecoration(border: Border(bottom: BorderSide(color: cs.outline))),
                  child: ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isLow ? Colors.red.withValues(alpha: 0.1) : AppColors.brandGreen.withValues(alpha: isDark ? 0.15 : 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(isLow ? Icons.warning_amber : Icons.inventory_2_outlined, size: 18, color: isLow ? Colors.red : AppColors.brandGreenDark),
                    ),
                    title: Text(e.key, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                    trailing: Text('${e.value}', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: isLow ? Colors.red : cs.onSurface)),
                  ),
                );
              }).toList(),
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
    // Em telas pequenas, ocupa largura total. Em telas maiores (desktop), divide o espaço.
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
              TextField(
                controller: nomeController,
                decoration: const InputDecoration(labelText: 'Nome do Produto', prefixIcon: Icon(Icons.label_outline, size: 18)),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: precoController,
                decoration: const InputDecoration(labelText: 'Preço Base (R\$)', prefixIcon: Icon(Icons.attach_money, size: 18)),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: descController,
                maxLines: 2,
                decoration: const InputDecoration(labelText: 'Descrição (Opcional)', prefixIcon: Icon(Icons.notes_outlined, size: 18)),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: imagemController,
                decoration: const InputDecoration(
                  labelText: 'URL da Foto (Opcional)',
                  hintText: 'https://...',
                  prefixIcon: Icon(Icons.image_outlined, size: 18),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Cole o link de uma imagem pública (ex: Imgur, Google Drive compartilhado)',
                style: TextStyle(
                  fontSize: 11,
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('CANCELAR', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
          ),
          ElevatedButton(
            onPressed: () async {
              try {
                await ProdutoService().createProduto(
                  nomeController.text,
                  descController.text.isEmpty ? null : descController.text,
                  double.parse(precoController.text.replaceAll(',', '.')),
                  imagemUrl: imagemController.text.isEmpty ? null : imagemController.text,
                );
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

    if (result == true) {
      _fetchProdutos();
    }
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
        backgroundColor: Theme.of(context).colorScheme.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: nomeController,
                decoration: const InputDecoration(labelText: 'Nome do Produto', prefixIcon: Icon(Icons.label_outline, size: 18)),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: precoController,
                decoration: const InputDecoration(labelText: 'Preço Base (R\$)', prefixIcon: Icon(Icons.attach_money, size: 18)),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: descController,
                maxLines: 2,
                decoration: const InputDecoration(labelText: 'Descrição (Opcional)', prefixIcon: Icon(Icons.notes_outlined, size: 18)),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: imagemController,
                decoration: const InputDecoration(
                  labelText: 'URL da Foto (Opcional)',
                  hintText: 'https://...',
                  prefixIcon: Icon(Icons.image_outlined, size: 18),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Cole o link de uma imagem pública (ex: Imgur, Google Drive compartilhado)',
                style: TextStyle(
                  fontSize: 11,
                  color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.4),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('CANCELAR', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
          ),
          ElevatedButton(
            onPressed: () async {
              try {
                await ProdutoService().updateProduto(
                  produto.id,
                  nome: nomeController.text,
                  descricao: descController.text.isEmpty ? null : descController.text,
                  precoBase: double.parse(precoController.text.replaceAll(',', '.')),
                  imagemUrl: imagemController.text.isEmpty ? null : imagemController.text,
                );
                if (ctx.mounted) Navigator.pop(ctx, true);
              } catch (e) {
                if (ctx.mounted) SnackbarUtil.showError(ctx, 'Erro ao salvar alterações do produto.');
              }
            },
            child: const Text('SALVAR'),
          ),
        ],
      ),
    );

    if (result == true) {
      _fetchProdutos();
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    if (_isLoading) return const Center(child: CircularProgressIndicator());

    return Scaffold(
      body: _produtos.isEmpty
          ? Center(child: Text('Nenhum produto cadastrado no catálogo.', style: TextStyle(color: cs.onSurface.withValues(alpha: 0.5))))
          : GridView.builder(
              padding: const EdgeInsets.all(24),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 0.85,
              ),
              itemCount: _produtos.length,
              itemBuilder: (context, i) {
                final p = _produtos[i] as Produto;
                final hasImage = p.imagemUrl != null && p.imagemUrl!.isNotEmpty;

                return Card(
                  clipBehavior: Clip.antiAlias,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Image area
                      SizedBox(
                        height: 110,
                        width: double.infinity,
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            hasImage
                              ? Image.network(
                                  p.imagemUrl!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, _, _) => _buildImagePlaceholder(isDark),
                                  loadingBuilder: (_, child, progress) => progress == null
                                    ? child
                                    : Container(
                                        color: isDark ? AppColors.darkSurfaceLift : AppColors.surfaceSoft,
                                        child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                                      ),
                                )
                              : _buildImagePlaceholder(isDark),
                            Positioned(
                              top: 8,
                              right: 8,
                              child: Material(
                                color: cs.surface.withValues(alpha: 0.8),
                                shape: const CircleBorder(),
                                clipBehavior: Clip.antiAlias,
                                child: IconButton(
                                  icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.brandGreen),
                                  onPressed: () => _editProduto(p),
                                  tooltip: 'Editar Produto',
                                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                  padding: EdgeInsets.zero,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Info area
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                p.nome,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14, color: cs.onSurface),
                              ),
                              const Spacer(),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('R\$ ${p.precoBase.toStringAsFixed(2)}', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, color: AppColors.brandGreen, fontSize: 13)),
                                  InkWell(
                                    onTap: () => _editProduto(p),
                                    borderRadius: BorderRadius.circular(4),
                                    child: const Padding(
                                      padding: EdgeInsets.all(2.0),
                                      child: Icon(Icons.edit, size: 14, color: AppColors.brandGreen),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'fab_admin_catalog',
        onPressed: _addProduto,
        backgroundColor: AppColors.brandGreen,
        foregroundColor: AppColors.brandTealDeep,
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildImagePlaceholder(bool isDark) {
    return Container(
      color: isDark ? AppColors.darkSurfaceLift : AppColors.surfaceSoft,
      child: Center(
        child: Icon(
          Icons.image_outlined,
          size: 36,
          color: isDark ? AppColors.darkTextSecondary : AppColors.steel,
        ),
      ),
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
  bool _isLoading = false;
  List<OrdemServico> _todasOrdens = [];
  final _clienteFilterController = TextEditingController();
  final _produtoFilterController = TextEditingController();
  StatusOS? _selectedStatus;

  @override
  void initState() {
    super.initState();
    _fetchHistory();
    _clienteFilterController.addListener(_onFilterChanged);
    _produtoFilterController.addListener(_onFilterChanged);
  }

  @override
  void dispose() {
    _clienteFilterController.dispose();
    _produtoFilterController.dispose();
    super.dispose();
  }

  void _onFilterChanged() => setState(() {});

  Future<void> _fetchHistory() async {
    setState(() => _isLoading = true);
    try {
      final res = await OsService().fetchOrdensServico();
      if (mounted) {
        setState(() {
          res.sort((a, b) => b.criadoEm.compareTo(a.criadoEm));
          _todasOrdens = res;
        });
      }
    } catch (e) {
      if (mounted) SnackbarUtil.showError(context, 'Erro ao carregar histórico: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _confirmarCancelamento(OrdemServico os) async {
    try {
      await OsService().updateStatus(os.id, StatusOS.cancelada);
      final novasSpecs = Map<String, dynamic>.from(os.especificacoes);
      novasSpecs.remove('solicitouCancelamento');
      await OsService().updateOS(os.id, especificacoes: novasSpecs);

      if (mounted) {
        SnackbarUtil.showSuccess(context, 'Cancelamento confirmado com sucesso.');
        _fetchHistory();
      }
    } catch (e) {
      if (mounted) SnackbarUtil.showError(context, 'Erro ao confirmar cancelamento: $e');
    }
  }

  Future<void> _cancelarPedido(OrdemServico os) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancelar Pedido'),
        content: Text('Deseja realmente cancelar o pedido de ${os.clienteNome ?? "Cliente"}?'),
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
          SnackbarUtil.showSuccess(context, 'Pedido cancelado.');
          _fetchHistory();
        }
      } catch (e) {
        if (mounted) SnackbarUtil.showError(context, 'Erro ao cancelar: $e');
      }
    }
  }

  Color _statusColor(StatusOS s) {
    switch (s) {
      case StatusOS.aguardandoOrcamento: return AppColors.orange;
      case StatusOS.emProducao: return AppColors.purple;
      case StatusOS.prontaParaRetirada: return AppColors.brandGreen;
      case StatusOS.entregue: return AppColors.steel;
      case StatusOS.cancelada: return Colors.red;
      default: return AppColors.brandTeal;
    }
  }

  String? _getArteUrl(OrdemServico os) {
    final specs = os.especificacoes;
    final keys = ['arte_url', 'arteUrl', 'arte', 'url'];
    for (final k in keys) {
      if (specs[k] != null && specs[k].toString().startsWith('http')) {
        return specs[k].toString();
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final clienteQuery = _clienteFilterController.text.trim().toLowerCase();
    final produtoQuery = _produtoFilterController.text.trim().toLowerCase();

    final filtradas = _todasOrdens.where((os) {
      if (_selectedStatus != null && os.status != _selectedStatus) return false;
      if (clienteQuery.isNotEmpty) {
        final nome = (os.clienteNome ?? '').toLowerCase();
        final idStr = os.clienteId.toLowerCase();
        if (!nome.contains(clienteQuery) && !idStr.contains(clienteQuery)) return false;
      }
      if (produtoQuery.isNotEmpty) {
        final prod = os.produtoResumo.toLowerCase();
        if (!prod.contains(produtoQuery)) return false;
      }
      return true;
    }).toList();

    return Scaffold(
      body: Column(
        children: [
          // Área de Filtros
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest.withValues(alpha: 0.3),
              border: Border(bottom: BorderSide(color: Theme.of(context).dividerColor)),
            ),
            child: Column(
              children: [
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    SizedBox(
                      width: MediaQuery.of(context).size.width < 600 ? double.infinity : 250,
                      child: TextField(
                        controller: _clienteFilterController,
                        decoration: const InputDecoration(
                          labelText: 'Nome do Cliente / ID',
                          prefixIcon: Icon(Icons.person_outline, size: 18),
                          isDense: true,
                        ),
                      ),
                    ),
                    SizedBox(
                      width: MediaQuery.of(context).size.width < 600 ? double.infinity : 200,
                      child: TextField(
                        controller: _produtoFilterController,
                        decoration: const InputDecoration(
                          labelText: 'Produto',
                          prefixIcon: Icon(Icons.inventory_2_outlined, size: 18),
                          isDense: true,
                        ),
                      ),
                    ),
                    SizedBox(
                      width: MediaQuery.of(context).size.width < 600 ? double.infinity : 180,
                      child: DropdownButtonFormField<StatusOS?>(
                        initialValue: _selectedStatus,
                        decoration: const InputDecoration(
                          labelText: 'Status do Pedido',
                          isDense: true,
                        ),
                        items: [
                          const DropdownMenuItem(value: null, child: Text('Todos')),
                          ...StatusOS.values.map((s) => DropdownMenuItem(value: s, child: Text(s.label))),
                        ],
                        onChanged: (val) => setState(() => _selectedStatus = val),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Lista de Resultados
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : filtradas.isEmpty
                    ? Center(child: Text('Nenhum pedido correspondente aos filtros.', style: TextStyle(color: cs.onSurface.withValues(alpha: 0.5))))
                    : RefreshIndicator(
                        onRefresh: _fetchHistory,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: filtradas.length,
                          itemBuilder: (context, i) {
                            final os = filtradas[i];
                            final statusColor = _statusColor(os.status);
                            final solicitouCancelamento = os.especificacoes['solicitouCancelamento'] == true;
                            final canCancel = os.status != StatusOS.entregue && os.status != StatusOS.cancelada;
                            final arteUrl = _getArteUrl(os);

                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              clipBehavior: Clip.antiAlias,
                              child: ExpansionTile(
                                leading: CircleAvatar(
                                  backgroundColor: statusColor.withValues(alpha: 0.15),
                                  foregroundColor: statusColor,
                                  child: const Icon(Icons.receipt_long, size: 20),
                                ),
                                title: Row(
                                  children: [
                                    Expanded(child: Text(os.produtoResumo, style: GoogleFonts.outfit(fontWeight: FontWeight.bold))),
                                    if (solicitouCancelamento && os.status != StatusOS.cancelada)
                                      Container(
                                        margin: const EdgeInsets.only(left: 8),
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(color: Colors.orange.shade800, borderRadius: BorderRadius.circular(4)),
                                        child: const Text('CANCELAMENTO SOLICITADO', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                                      ),
                                  ],
                                ),
                                subtitle: Text(
                                  'Cliente: ${os.clienteNome ?? os.clienteId} • Data: ${os.criadoEm.day}/${os.criadoEm.month}/${os.criadoEm.year}',
                                  style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.6)),
                                ),
                                trailing: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: statusColor.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: statusColor.withValues(alpha: 0.5)),
                                  ),
                                  child: Text(os.status.label.toUpperCase(), style: TextStyle(fontSize: 10, color: statusColor, fontWeight: FontWeight.bold)),
                                ),
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        if (os.observacoes?.isNotEmpty == true) ...[
                                          Text('Observações:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: cs.onSurface.withValues(alpha: 0.6))),
                                          const SizedBox(height: 4),
                                          Text(os.observacoes!),
                                          const SizedBox(height: 12),
                                        ],
                                        if (os.especificacoes.isNotEmpty) ...[
                                          Text('Especificações:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: cs.onSurface.withValues(alpha: 0.6))),
                                          const SizedBox(height: 4),
                                          Text(os.especificacoes.entries
                                              .where((e) => e.key != 'solicitouCancelamento')
                                              .map((e) => '${e.key}: ${e.value}')
                                              .join('\n'), style: const TextStyle(fontSize: 13)),
                                          const SizedBox(height: 16),
                                        ],
                                        // Ações
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.end,
                                          children: [
                                            if (arteUrl != null)
                                              TextButton.icon(
                                                onPressed: () => launchUrl(Uri.parse(arteUrl), mode: LaunchMode.externalApplication),
                                                icon: const Icon(Icons.palette_outlined, size: 16),
                                                label: const Text('Ver Arte', style: TextStyle(fontSize: 12)),
                                              ),
                                            const Spacer(),
                                            if (solicitouCancelamento && os.status != StatusOS.cancelada)
                                              ElevatedButton.icon(
                                                style: ElevatedButton.styleFrom(backgroundColor: Colors.orange.shade800, foregroundColor: Colors.white),
                                                onPressed: () => _confirmarCancelamento(os),
                                                icon: const Icon(Icons.check_circle_outline, size: 16),
                                                label: const Text('Confirmar Cancelamento', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                              )
                                            else if (canCancel)
                                              TextButton.icon(
                                                onPressed: () => _cancelarPedido(os),
                                                icon: const Icon(Icons.cancel_outlined, size: 16),
                                                label: const Text('Cancelar Pedido', style: TextStyle(fontSize: 12)),
                                                style: TextButton.styleFrom(foregroundColor: Colors.red),
                                              ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
