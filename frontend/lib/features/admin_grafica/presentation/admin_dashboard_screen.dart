import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/models/ordem_servico.dart';
import '../../../core/models/produto.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/os_service.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/utils/snackbar_util.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../core/services/produto_service.dart';
import '../../../core/theme/app_theme.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final brandTealDeep = const Color(0xFF001E2B);
    final brandGreen = const Color(0xFF00ED64);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.auto_awesome, color: Color(0xFF00ED64), size: 24),
            const SizedBox(width: 12),
            Text('AutoGraph', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: brandTealDeep, borderRadius: BorderRadius.circular(4)),
              child: const Text('ADMIN', style: TextStyle(color: Color(0xFF00ED64), fontSize: 10, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
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
          _CatalogTab(),
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
        onPressed: () {
          // TODO: Open manual OS creation
        },
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
  const _KanbanTab();
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

    final visibleStatuses = [StatusOS.aguardandoOrcamento, StatusOS.emProducao, StatusOS.prontaParaRetirada, StatusOS.entregue];
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
      case StatusOS.aguardandoOrcamento: return const Color(0xFFFA6E39); // MongoDB Orange
      case StatusOS.emProducao: return const Color(0xFF7B3FF2); // MongoDB Purple
      case StatusOS.prontaParaRetirada: return const Color(0xFF00ED64); // MongoDB Green
      case StatusOS.entregue: return const Color(0xFF5C6C7A); // MongoDB Steel
      default: return const Color(0xFF003D4F); // MongoDB Teal
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return DragTarget<OrdemServico>(
      onWillAcceptWithDetails: (details) => details.data.status != status,
      onAcceptWithDetails: (details) => onAccept(details.data),
      builder: (context, candidateData, rejectedData) {
        final isHovering = candidateData.isNotEmpty;
        return Container(
          width: 320,
          margin: const EdgeInsets.only(right: 20),
          decoration: BoxDecoration(
            color: isHovering ? const Color(0xFFF4F7F6) : Colors.transparent,
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
  final String Function(int) formatDuration;

  const _OSCard({required this.os, required this.isTimerRunning, required this.elapsedSecs, required this.onToggleTimer, required this.formatDuration});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
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
            border: Border.all(color: const Color(0xFF00ED64), width: 2),
          ),
          child: Text(os.produtoResumo, style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        ),
      ),
      childWhenDragging: Opacity(opacity: 0.3, child: _buildCard(context)),
      child: _buildCard(context),
    );
  }

  Widget _buildCard(BuildContext context) {
    final theme = Theme.of(context);
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
              Text(os.produtoResumo, style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 15, color: Theme.of(context).colorScheme.onSurface)),
              const SizedBox(height: 4),
              Text(os.clienteNome ?? 'Cliente não informado', style: TextStyle(fontSize: 13, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.55))),
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
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final revenueByProduct = {'Panfletos': 4500.0, 'Cartões': 8200.0, 'Banners': 3100.0, 'Apostilas': 2800.0, 'Blocos': 1900.0};
    final totalRevenue = revenueByProduct.values.fold(0.0, (a, b) => a + b);
    final osCompletedCount = 47;
    final avgTicket = totalRevenue / osCompletedCount;
    final stockItems = {'Papel A4 (resmas)': 120, 'Tinta Cyan (L)': 8, 'Tinta Magenta (L)': 5, 'Vinil Adesivo (m²)': 35, 'Espiral (un)': 200};

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Visão Geral', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: cs.onSurface)),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(child: _KpiCard(title: 'FATURAMENTO', value: 'R\$ ${totalRevenue.toStringAsFixed(0)}', icon: Icons.attach_money, color: const Color(0xFF00ED64))),
            const SizedBox(width: 16),
            Expanded(child: _KpiCard(title: 'OS FINALIZADAS', value: '$osCompletedCount', icon: Icons.check_circle_outline, color: const Color(0xFF7B3FF2))),
            const SizedBox(width: 16),
            Expanded(child: _KpiCard(title: 'TICKET MÉDIO', value: 'R\$ ${avgTicket.toStringAsFixed(0)}', icon: Icons.trending_up, color: const Color(0xFFFA6E39))),
          ],
        ),
        const SizedBox(height: 40),
        
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: cs.outline ?? Theme.of(context).dividerColor),
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
                    maxY: 10000,
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
                            color: const Color(0xFF00ED64),
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
                decoration: BoxDecoration(border: Border(bottom: BorderSide(color: cs.outline ?? Theme.of(context).dividerColor))),
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
                SnackbarUtil.showError(ctx, 'Erro ao salvar produto.');
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
                childAspectRatio: 1.0,
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
                        child: hasImage
                          ? Image.network(
                              p.imagemUrl!,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => _buildImagePlaceholder(isDark),
                              loadingBuilder: (_, child, progress) => progress == null
                                ? child
                                : Container(
                                    color: isDark ? AppColors.darkSurfaceLift : const Color(0xFFF4F7F6),
                                    child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                                  ),
                            )
                          : _buildImagePlaceholder(isDark),
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
                                  const Icon(Icons.arrow_forward, size: 14, color: AppColors.brandGreen),
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
      color: isDark ? AppColors.darkSurfaceLift : const Color(0xFFF4F7F6),
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
