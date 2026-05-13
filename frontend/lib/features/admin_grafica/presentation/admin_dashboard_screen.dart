import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/models/ordem_servico.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/utils/snackbar_util.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard do Administrador'),
        actions: [
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
        children: const [
          _KanbanTab(),
          _FinancialTab(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.view_kanban), label: 'Kanban'),
          NavigationDestination(icon: Icon(Icons.bar_chart), label: 'Financeiro'),
        ],
      ),
    );
  }
}

// ─────────────────────────────── KANBAN TAB ───────────────────────────────

class _KanbanTab extends StatefulWidget {
  const _KanbanTab();
  @override
  State<_KanbanTab> createState() => _KanbanTabState();
}

class _KanbanTabState extends State<_KanbanTab> {
  final Map<StatusOS, List<OrdemServico>> _columns = {};
  final Map<String, Timer?> _timers = {};
  final Map<String, int> _elapsed = {};

  @override
  void initState() {
    super.initState();
    _loadMockData();
  }

  @override
  void dispose() {
    for (final t in _timers.values) {
      t?.cancel();
    }
    super.dispose();
  }

  void _loadMockData() {
    final now = DateTime.now();
    final mockOrdens = [
      OrdemServico(id: 'os-001', clienteId: 'c1', status: StatusOS.aguardandoOrcamento, especificacoes: {'produto': 'Panfletos', 'requisitos': [{'pergunta': 'Quantidade', 'resposta': '500 unidades'}]}, criadoEm: now.subtract(const Duration(days: 2)), atualizadoEm: now, clienteNome: 'João Silva', clienteTelefone: '11999001122'),
      OrdemServico(id: 'os-002', clienteId: 'c2', status: StatusOS.emProducao, especificacoes: {'produto': 'Cartão de Visita', 'requisitos': [{'pergunta': 'Quantidade', 'resposta': '1000 unidades'}]}, criadoEm: now.subtract(const Duration(days: 1)), atualizadoEm: now, clienteNome: 'Maria Souza', clienteTelefone: '11999003344'),
      OrdemServico(id: 'os-003', clienteId: 'c3', status: StatusOS.criada, especificacoes: {'produto': 'Banner', 'requisitos': [{'pergunta': 'Tamanho', 'resposta': '2x1m'}]}, criadoEm: now, atualizadoEm: now, clienteNome: 'Carlos Lima', clienteTelefone: '11999005566'),
      OrdemServico(id: 'os-004', clienteId: 'c1', status: StatusOS.prontaParaRetirada, especificacoes: {'produto': 'Apostila', 'requisitos': [{'pergunta': 'Páginas', 'resposta': '50 páginas'}]}, criadoEm: now.subtract(const Duration(days: 5)), atualizadoEm: now, clienteNome: 'João Silva', clienteTelefone: '11999001122'),
    ];
    for (final s in StatusOS.values) {
      _columns[s] = mockOrdens.where((o) => o.status == s).toList();
    }
    setState(() {});
  }

  void _moveOS(OrdemServico os, StatusOS newStatus) {
    setState(() {
      _columns[os.status]?.remove(os);
      final updated = os.copyWith(status: newStatus);
      _columns[newStatus] ??= [];
      _columns[newStatus]!.add(updated);
    });
    SnackbarUtil.showSuccess(context, 'OS #${os.id.substring(os.id.length - 3)} → ${newStatus.label}');
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
    final visibleStatuses = [StatusOS.aguardandoOrcamento, StatusOS.emProducao, StatusOS.prontaParaRetirada, StatusOS.entregue];
    return ListView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.all(12),
      children: visibleStatuses.map((status) {
        final items = _columns[status] ?? [];
        return _KanbanColumn(
          status: status,
          items: items,
          onAccept: (os) => _moveOS(os, status),
          onToggleTimer: _toggleTimer,
          timers: _timers,
          elapsed: _elapsed,
          formatDuration: _formatDuration,
        );
      }).toList(),
    );
  }
}

class _KanbanColumn extends StatelessWidget {
  final StatusOS status;
  final List<OrdemServico> items;
  final void Function(OrdemServico) onAccept;
  final void Function(String) onToggleTimer;
  final Map<String, Timer?> timers;
  final Map<String, int> elapsed;
  final String Function(int) formatDuration;

  const _KanbanColumn({
    required this.status,
    required this.items,
    required this.onAccept,
    required this.onToggleTimer,
    required this.timers,
    required this.elapsed,
    required this.formatDuration,
  });

  Color get _columnColor {
    switch (status) {
      case StatusOS.aguardandoOrcamento: return Colors.orange;
      case StatusOS.emProducao: return Colors.blue;
      case StatusOS.prontaParaRetirada: return Colors.green;
      case StatusOS.entregue: return Colors.grey;
      default: return Colors.blueGrey;
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
          width: 280,
          margin: const EdgeInsets.only(right: 12),
          decoration: BoxDecoration(
            color: isHovering ? _columnColor.withAlpha(30) : Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _columnColor.withAlpha(100)),
          ),
          child: Column(
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: _columnColor.withAlpha(40), borderRadius: const BorderRadius.vertical(top: Radius.circular(12))),
                child: Row(children: [
                  CircleAvatar(backgroundColor: _columnColor, radius: 6),
                  const SizedBox(width: 8),
                  Expanded(child: Text(status.label, style: const TextStyle(fontWeight: FontWeight.bold))),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: _columnColor.withAlpha(60), borderRadius: BorderRadius.circular(12)),
                    child: Text('${items.length}', style: TextStyle(fontSize: 12, color: _columnColor)),
                  ),
                ]),
              ),
              Expanded(
                child: items.isEmpty
                    ? const Center(child: Text('Arraste aqui', style: TextStyle(color: Colors.grey)))
                    : ListView.builder(
                        padding: const EdgeInsets.all(8),
                        itemCount: items.length,
                        itemBuilder: (_, i) => _OSCard(
                          os: items[i],
                          isTimerRunning: timers[items[i].id] != null,
                          elapsedSecs: elapsed[items[i].id] ?? 0,
                          onToggleTimer: () => onToggleTimer(items[i].id),
                          formatDuration: formatDuration,
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
  final String Function(int) formatDuration;

  const _OSCard({required this.os, required this.isTimerRunning, required this.elapsedSecs, required this.onToggleTimer, required this.formatDuration});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Draggable<OrdemServico>(
      data: os,
      feedback: Material(
        elevation: 6,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          width: 260, padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: theme.colorScheme.surface, borderRadius: BorderRadius.circular(8)),
          child: Text(os.produtoResumo, style: const TextStyle(fontWeight: FontWeight.bold)),
        ),
      ),
      childWhenDragging: Opacity(opacity: 0.3, child: _buildCard(theme)),
      child: _buildCard(theme),
    );
  }

  Widget _buildCard(ThemeData theme) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(os.produtoResumo, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(os.clienteNome ?? 'Cliente', style: TextStyle(fontSize: 12, color: theme.colorScheme.onSurface.withAlpha(150))),
            const SizedBox(height: 8),
            Row(children: [
              Icon(isTimerRunning ? Icons.timer : Icons.timer_outlined, size: 16, color: isTimerRunning ? Colors.red : Colors.grey),
              const SizedBox(width: 4),
              Text(formatDuration(elapsedSecs), style: TextStyle(fontSize: 12, fontFamily: 'monospace', color: isTimerRunning ? Colors.red : Colors.grey)),
              const Spacer(),
              InkWell(
                key: Key('btn_timer_${os.id}'),
                onTap: onToggleTimer,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: isTimerRunning ? Colors.red.withAlpha(30) : Colors.green.withAlpha(30), borderRadius: BorderRadius.circular(4)),
                  child: Text(isTimerRunning ? 'Parar' : 'Iniciar', style: TextStyle(fontSize: 11, color: isTimerRunning ? Colors.red : Colors.green)),
                ),
              ),
            ]),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────── FINANCIAL TAB ────────────────────────────

class _FinancialTab extends StatelessWidget {
  const _FinancialTab();

  @override
  Widget build(BuildContext context) {
    return const _FinancialDashboard();
  }
}

class _FinancialDashboard extends StatelessWidget {
  const _FinancialDashboard();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    // Mock data for financial dashboard
    final revenueByProduct = {'Panfletos': 4500.0, 'Cartões': 8200.0, 'Banners': 3100.0, 'Apostilas': 2800.0, 'Blocos': 1900.0};
    final totalRevenue = revenueByProduct.values.fold(0.0, (a, b) => a + b);
    final osCompletedCount = 47;
    final avgTicket = totalRevenue / osCompletedCount;
    final stockItems = {'Papel A4 (resmas)': 120, 'Tinta Cyan (L)': 8, 'Tinta Magenta (L)': 5, 'Vinil Adesivo (m²)': 35, 'Espiral (un)': 200};

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // KPI Cards
        Row(
          children: [
            Expanded(child: _KpiCard(title: 'Faturamento', value: 'R\$ ${totalRevenue.toStringAsFixed(0)}', icon: Icons.attach_money, color: Colors.green)),
            const SizedBox(width: 12),
            Expanded(child: _KpiCard(title: 'OS Finalizadas', value: '$osCompletedCount', icon: Icons.check_circle, color: Colors.blue)),
            const SizedBox(width: 12),
            Expanded(child: _KpiCard(title: 'Ticket Médio', value: 'R\$ ${avgTicket.toStringAsFixed(0)}', icon: Icons.trending_up, color: Colors.orange)),
          ],
        ),
        const SizedBox(height: 24),

        // Revenue bar chart (simplified with containers)
        Text('Receita por Produto', style: theme.textTheme.titleMedium),
        const SizedBox(height: 12),
        ...revenueByProduct.entries.map((e) {
          final pct = e.value / revenueByProduct.values.reduce((a, b) => a > b ? a : b);
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(children: [
              SizedBox(width: 80, child: Text(e.key, style: const TextStyle(fontSize: 12))),
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(value: pct, minHeight: 20, backgroundColor: theme.colorScheme.primary.withAlpha(30), color: theme.colorScheme.primary),
                ),
              ),
              const SizedBox(width: 8),
              Text('R\$ ${e.value.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            ]),
          );
        }),

        const SizedBox(height: 24),
        Text('Estoque Atual', style: theme.textTheme.titleMedium),
        const SizedBox(height: 12),
        ...stockItems.entries.map((e) {
          final isLow = e.value < 10;
          return ListTile(
            leading: Icon(isLow ? Icons.warning_amber : Icons.inventory_2, color: isLow ? Colors.red : Colors.green),
            title: Text(e.key),
            trailing: Text('${e.value}', style: TextStyle(fontWeight: FontWeight.bold, color: isLow ? Colors.red : null)),
          );
        }),
      ],
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
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 4),
            Text(title, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}
