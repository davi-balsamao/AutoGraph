import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/models/ordem_servico.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/utils/snackbar_util.dart';
import '../../../core/services/produto_service.dart';
import '../../../core/theme/app_theme.dart';

class ClientHistoryScreen extends StatefulWidget {
  const ClientHistoryScreen({super.key});

  @override
  State<ClientHistoryScreen> createState() => _ClientHistoryScreenState();
}

class _ClientHistoryScreenState extends State<ClientHistoryScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.auto_awesome, color: AppColors.brandGreen, size: 24),
            const SizedBox(width: 12),
            Text('AutoGraph', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          IconButton(
            key: const Key('btn_logout_client'),
            icon: const Icon(Icons.logout),
            onPressed: () async {
              final nav = Navigator.of(context);
              await AuthService().logout();
              if (mounted) nav.pushReplacementNamed(AppRoutes.login);
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: const [
          _ClientCatalogTab(),
          _HistoryTab(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        height: 64,
        elevation: 0,
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.shopping_bag_outlined),
            selectedIcon: Icon(Icons.shopping_bag, color: AppColors.brandGreen),
            label: 'Catálogo',
          ),
          NavigationDestination(
            icon: Icon(Icons.history_outlined),
            selectedIcon: Icon(Icons.history, color: AppColors.brandGreen),
            label: 'Histórico',
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────── CATALOG TAB ────────────────────────────

class _ClientCatalogTab extends StatefulWidget {
  const _ClientCatalogTab();

  @override
  State<_ClientCatalogTab> createState() => _ClientCatalogTabState();
}

class _ClientCatalogTabState extends State<_ClientCatalogTab> {
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

  void _requestService(dynamic produto) {
    SnackbarUtil.showSuccess(context, 'Em breve: Tela de Wizard para solicitar ${produto.nome}');
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_isLoading) return const Center(child: CircularProgressIndicator());

    if (_produtos.isEmpty) {
      return Center(child: Text('Nenhum produto disponível no momento.', style: TextStyle(color: cs.onSurface.withValues(alpha: 0.6))));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(24),
      itemCount: _produtos.length,
      itemBuilder: (context, i) {
        final p = _produtos[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.brandGreenDark.withValues(alpha: 0.3) : const Color(0xFFE3FCEF),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text('DISPONÍVEL', style: TextStyle(color: isDark ? AppColors.brandGreen : AppColors.brandGreenDark, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1)),
                    ),
                    Text(
                      'A partir de R\$ ${p.precoBase.toStringAsFixed(2)}',
                      style: GoogleFonts.outfit(color: cs.onSurface, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(p.nome, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 20, color: cs.onSurface)),
                if (p.descricao != null && p.descricao!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(p.descricao!, style: TextStyle(color: cs.onSurface.withValues(alpha: 0.6), fontSize: 14)),
                ],
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () => _requestService(p),
                    child: const Text('SOLICITAR AGORA', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// ─────────────────────────── HISTORY TAB ────────────────────────────

class _HistoryTab extends StatefulWidget {
  const _HistoryTab();

  @override
  State<_HistoryTab> createState() => _HistoryTabState();
}

class _HistoryTabState extends State<_HistoryTab> {
  bool _isLoading = false;
  List<OrdemServico> _ordens = [];

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  Future<void> _fetchHistory() async {
    setState(() => _isLoading = true);
    try {
      await Future.delayed(const Duration(milliseconds: 600));
      final now = DateTime.now();
      _ordens = [
        OrdemServico(id: 'os-001', clienteId: 'c1', status: StatusOS.emProducao, especificacoes: {'produto': 'Panfletos', 'requisitos': [{'pergunta': 'Quantidade', 'resposta': '500 un'}]}, criadoEm: now.subtract(const Duration(days: 2)), atualizadoEm: now),
        OrdemServico(id: 'os-004', clienteId: 'c1', status: StatusOS.entregue, especificacoes: {'produto': 'Apostila', 'requisitos': [{'pergunta': 'Páginas', 'resposta': '50'}]}, criadoEm: now.subtract(const Duration(days: 10)), atualizadoEm: now.subtract(const Duration(days: 3))),
        OrdemServico(id: 'os-005', clienteId: 'c1', status: StatusOS.prontaParaRetirada, especificacoes: {'produto': 'Cartão de Visita', 'requisitos': [{'pergunta': 'Quantidade', 'resposta': '1000 un'}]}, criadoEm: now.subtract(const Duration(days: 5)), atualizadoEm: now.subtract(const Duration(days: 1))),
      ];
    } catch (e) {
      if (mounted) SnackbarUtil.showError(context, 'Erro ao buscar histórico');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Color _statusColor(StatusOS s) {
    switch (s) {
      case StatusOS.aguardandoOrcamento: return const Color(0xFFFA6E39);
      case StatusOS.emProducao: return const Color(0xFF7B3FF2);
      case StatusOS.prontaParaRetirada: return AppColors.brandGreen;
      case StatusOS.entregue: return const Color(0xFF5C6C7A);
      case StatusOS.cancelada: return const Color(0xFFEF4444);
      default: return const Color(0xFF003D4F);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_ordens.isEmpty) return const Center(child: Text('Nenhuma OS encontrada.'));

    return RefreshIndicator(
      onRefresh: _fetchHistory,
      child: ListView.builder(
        padding: const EdgeInsets.all(24),
        itemCount: _ordens.length,
        itemBuilder: (context, i) {
          final os = _ordens[i];
          final statusColor = _statusColor(os.status);
          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            child: ListTile(
              contentPadding: const EdgeInsets.all(16),
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.15), shape: BoxShape.circle),
                child: Icon(Icons.description_outlined, color: statusColor, size: 24),
              ),
              title: Text(os.produtoResumo, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: cs.onSurface)),
              subtitle: Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  'Data: ${os.criadoEm.day}/${os.criadoEm.month}/${os.criadoEm.year}',
                  style: TextStyle(fontSize: 13, color: cs.onSurface.withValues(alpha: 0.6)),
                ),
              ),
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: statusColor.withValues(alpha: 0.5)),
                ),
                child: Text(os.status.label.toUpperCase(), style: TextStyle(fontSize: 10, color: statusColor, fontWeight: FontWeight.bold)),
              ),
            ),
          );
        },
      ),
    );
  }
}
