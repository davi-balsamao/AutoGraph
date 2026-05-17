import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../../core/models/ordem_servico.dart';
import '../../../core/models/produto.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/os_service.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/utils/snackbar_util.dart';
import '../../../core/services/produto_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/theme_notifier.dart';
import 'order_wizard_screen.dart';

class ClientHistoryScreen extends StatefulWidget {
  const ClientHistoryScreen({super.key});

  @override
  State<ClientHistoryScreen> createState() => _ClientHistoryScreenState();
}

class _ClientHistoryScreenState extends State<ClientHistoryScreen> {
  int _currentIndex = 0;

  void switchTab(int index) => setState(() => _currentIndex = index);

  Future<void> _openWhatsApp() async {
    final url = Uri.parse('https://wa.me/5512991789183');
    try {
      if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
        if (mounted) {
          SnackbarUtil.showError(context, 'Não foi possível abrir o WhatsApp.');
        }
      }
    } catch (e) {
      if (mounted) {
        SnackbarUtil.showError(context, 'Erro ao redirecionar para o WhatsApp: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
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
            key: const Key('btn_toggle_theme_client'),
            icon: Icon(
              themeNotifier.themeMode == ThemeMode.dark
                  ? Icons.light_mode
                  : Icons.dark_mode,
            ),
            onPressed: () => themeNotifier.toggleTheme(),
          ),
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
      floatingActionButton: FloatingActionButton.extended(
        key: const Key('fab_whatsapp_client'),
        onPressed: _openWhatsApp,
        backgroundColor: AppColors.whatsappGreen,
        foregroundColor: Colors.white,
        elevation: 3,
        icon: const FaIcon(FontAwesomeIcons.whatsapp, size: 24),
        label: Text(
          'Atendimento',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14),
        ),
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

  void _requestService(dynamic produto) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => OrderWizardScreen(produto: produto),
      ),
    );
    if (result == true && mounted) {
      context.findAncestorStateOfType<_ClientHistoryScreenState>()?.switchTab(1);
    }
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
          margin: const EdgeInsets.only(bottom: 24),
          clipBehavior: Clip.antiAlias,
          elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (p.imagemUrl != null && p.imagemUrl!.isNotEmpty)
                Image.network(
                  p.imagemUrl!,
                  height: 180,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => const SizedBox(height: 0),
                ),
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: isDark ? AppColors.brandGreenDark.withValues(alpha: 0.3) : AppColors.successLight,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text('DISPONÍVEL', style: TextStyle(color: isDark ? AppColors.brandGreen : AppColors.brandGreenDark, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                        ),
                        Flexible(
                          child: Text(
                            'A partir de R\$ ${p.precoBase.toStringAsFixed(2)}',
                            textAlign: TextAlign.end,
                            style: GoogleFonts.outfit(color: cs.onSurface, fontWeight: FontWeight.bold, fontSize: 16),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(p.nome, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 22, color: cs.onSurface)),
                    if (p.descricao != null && p.descricao!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(p.descricao!, style: TextStyle(color: cs.onSurface.withValues(alpha: 0.7), fontSize: 14, height: 1.4)),
                    ],
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: () => _requestService(p),
                        child: const Text('SOLICITAR AGORA', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
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
      final ordens = await OsService().fetchOrdensServico();
      if (mounted) {
        setState(() {
          ordens.sort((a, b) => b.criadoEm.compareTo(a.criadoEm));
          _ordens = ordens;
        });
      }
    } catch (e) {
      if (mounted) SnackbarUtil.showError(context, 'Erro ao buscar histórico: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
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

  String _getMaterial(OrdemServico os) {
    final specs = os.especificacoes;
    if (specs['material'] != null) return specs['material'].toString();
    final reqs = specs['requisitos'] as List<dynamic>?;
    if (reqs != null) {
      for (final r in reqs) {
        if (r['pergunta'].toString().toLowerCase().contains('material')) {
          return r['resposta'].toString();
        }
      }
    }
    return 'Papel Premium Padrão';
  }

  String _getTamanho(OrdemServico os) {
    final specs = os.especificacoes;
    if (specs['tamanho'] != null) return specs['tamanho'].toString();
    if (specs['dimensoes'] is Map) {
      final dim = specs['dimensoes'] as Map;
      final w = dim['largura'] ?? '';
      final h = dim['altura'] ?? '';
      if (w.toString().isNotEmpty && h.toString().isNotEmpty) {
        return '$w x $h';
      }
    }
    final reqs = specs['requisitos'] as List<dynamic>?;
    if (reqs != null) {
      for (final r in reqs) {
        final p = r['pergunta'].toString().toLowerCase();
        if (p.contains('tamanho') || p.contains('dimensão') || p.contains('páginas')) {
          return '${r['pergunta']}: ${r['resposta']}';
        }
      }
    }
    return 'Tamanho Padrão';
  }

  String _getQuantidade(OrdemServico os) {
    final specs = os.especificacoes;
    if (specs['quantidade'] != null) return specs['quantidade'].toString();
    final reqs = specs['requisitos'] as List<dynamic>?;
    if (reqs != null) {
      for (final r in reqs) {
        if (r['pergunta'].toString().toLowerCase().contains('quantidade')) {
          return r['resposta'].toString();
        }
      }
    }
    return '1 unidade';
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

  void _reorder(OrdemServico os) {
    final precoReferencia = (os.especificacoes['precoBaseReferencia'] as num?)?.toDouble() ?? 10.0;
    final produtoId = os.especificacoes['produtoId'] as String? ?? 'prod-custom';
    final produtoNome = os.produtoResumo;
    final dummyProduto = Produto(
      id: produtoId,
      nome: produtoNome,
      precoBase: precoReferencia,
      criadoEm: DateTime.now(),
    );
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => OrderWizardScreen(produto: dummyProduto),
      ),
    ).then((result) {
      if (result == true) {
        _fetchHistory();
      }
    });
  }

  void _showOrderDetails(OrdemServico os, Color statusColor) {
    final material = _getMaterial(os);
    final tamanho = _getTamanho(os);
    final quantidade = _getQuantidade(os);
    final arteUrl = _getArteUrl(os);
    final cs = Theme.of(context).colorScheme;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: cs.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
            left: 24,
            right: 24,
            top: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: cs.onSurface.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      os.produtoResumo,
                      style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: cs.onSurface,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: statusColor.withValues(alpha: 0.5)),
                    ),
                    child: Text(
                      os.status.label.toUpperCase(),
                      style: TextStyle(
                        fontSize: 11,
                        color: statusColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              _DetailRow(label: 'Descrição', value: os.observacoes?.isNotEmpty == true ? os.observacoes! : 'Pedido personalizado enviado via AutoGraph.'),
              const Divider(height: 24),
              _DetailRow(label: 'Material', value: material),
              const Divider(height: 24),
              _DetailRow(label: 'Tamanho', value: tamanho),
              const Divider(height: 24),
              _DetailRow(label: 'Quantidade', value: quantidade),
              const Divider(height: 24),
              _DetailRow(
                label: 'Solicitado em',
                value: '${os.criadoEm.day.toString().padLeft(2, '0')}/${os.criadoEm.month.toString().padLeft(2, '0')}/${os.criadoEm.year} às ${os.criadoEm.hour.toString().padLeft(2, '0')}:${os.criadoEm.minute.toString().padLeft(2, '0')}',
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: arteUrl != null
                      ? () async {
                          final uri = Uri.parse(arteUrl);
                          if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
                            if (ctx.mounted) {
                              SnackbarUtil.showError(ctx, 'Não foi possível abrir a arte.');
                            }
                          }
                        }
                      : null,
                  icon: const Icon(Icons.palette_outlined),
                  label: Text(
                    arteUrl != null ? 'VISUALIZAR ARTE' : 'ARTE NÃO DISPONÍVEL',
                    style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: arteUrl != null ? AppColors.brandGreen : cs.surfaceContainerHighest,
                    foregroundColor: arteUrl != null ? AppColors.brandTealDeep : cs.onSurface.withValues(alpha: 0.4),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }

  Future<void> _solicitarCancelamento(OrdemServico os) async {
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: Colors.orange),
            const SizedBox(width: 10),
            Text('Solicitar Cancelamento', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
          ],
        ),
        content: const Text('Deseja enviar uma solicitação de cancelamento para este pedido? O administrador irá analisar e confirmar.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('NÃO')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true), 
            child: const Text('SIM, SOLICITAR'),
          ),
        ],
      ),
    );

    if (confirmar == true) {
      setState(() => _isLoading = true);
      try {
        final novasSpecs = Map<String, dynamic>.from(os.especificacoes);
        novasSpecs['solicitouCancelamento'] = true;
        await OsService().updateOS(os.id, especificacoes: novasSpecs);
        if (mounted) {
          SnackbarUtil.showSuccess(context, 'Solicitação de cancelamento enviada ao administrador.');
          _fetchHistory();
        }
      } catch (e) {
        if (mounted) SnackbarUtil.showError(context, 'Erro ao solicitar cancelamento: $e');
        setState(() => _isLoading = false);
      }
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
          final canCancel = os.status != StatusOS.entregue && os.status != StatusOS.cancelada;
          final solicitouCancelamento = os.especificacoes['solicitouCancelamento'] == true;

          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: () => _showOrderDetails(os, statusColor),
              child: Column(
                children: [
                  ListTile(
                    contentPadding: const EdgeInsets.all(16),
                    leading: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.15), shape: BoxShape.circle),
                      child: Icon(Icons.description_outlined, color: statusColor, size: 24),
                    ),
                    title: Text(os.produtoResumo, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: cs.onSurface)),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Data: ${os.criadoEm.day}/${os.criadoEm.month}/${os.criadoEm.year}',
                            style: TextStyle(fontSize: 13, color: cs.onSurface.withValues(alpha: 0.6)),
                          ),
                          if (solicitouCancelamento)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(
                                'Cancelamento em análise pelo Admin',
                                style: TextStyle(fontSize: 11, color: Colors.orange.shade800, fontWeight: FontWeight.bold),
                              ),
                            ),
                        ],
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
                  const Divider(height: 1, thickness: 1),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        if (canCancel && !solicitouCancelamento)
                          TextButton.icon(
                            onPressed: () => _solicitarCancelamento(os),
                            icon: const Icon(Icons.cancel_outlined, size: 16),
                            label: const Text('Cancelar Pedido', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            style: TextButton.styleFrom(foregroundColor: Colors.red),
                          ),
                        const Spacer(),
                        TextButton.icon(
                          onPressed: () => _reorder(os),
                          icon: const Icon(Icons.refresh, size: 16),
                          label: const Text('Pedir Novamente', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          style: TextButton.styleFrom(
                            foregroundColor: AppColors.brandGreen,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 100,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: cs.onSurface.withValues(alpha: 0.55),
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: cs.onSurface,
            ),
          ),
        ),
      ],
    );
  }
}
