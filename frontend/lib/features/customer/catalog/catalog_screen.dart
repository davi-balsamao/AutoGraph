// CatalogScreen — Tela de catálogo de produtos (03 · Catálogo)
//
// Tokens usados:
//   AGColors (via isDark), AGRadius.md (search bar)
//   AGSpacing.lg = 20 (padding)
//
// Referência: ClaudeDesign/components/app-screens.jsx → CatalogScreen

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/widgets/ag_product_glyph.dart';
import '../../../core/widgets/ag_theme_toggle.dart';
import '../../../core/services/os_service.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/produto_service.dart';
import '../../../core/models/produto.dart';

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key});

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  List<Produto> _produtos = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProdutos();
  }

  Future<void> _loadProdutos() async {
    try {
      final produtos = await ProdutoService().fetchProdutos();
      if (mounted) {
        setState(() {
          _produtos = produtos;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  List<Produto> get _filtered {
    return _produtos.where((p) {
      final matchesSearch = _search.isEmpty ||
          p.nome.toLowerCase().contains(_search.toLowerCase()) ||
          (p.descricao?.toLowerCase().contains(_search.toLowerCase()) ?? false);
      return matchesSearch;
    }).toList();
  }

  AGProductKind _inferKind(String nome) {
    final lower = nome.toLowerCase();
    if (lower.contains('panfleto')) return AGProductKind.panfleto;
    if (lower.contains('banner') || lower.contains('lona')) return AGProductKind.banner;
    if (lower.contains('bloco')) return AGProductKind.bloco;
    if (lower.contains('apostila')) return AGProductKind.apostila;
    return AGProductKind.panfleto; // default
  }

  String _inferTagLabel(AGProductKind kind) {
    switch (kind) {
      case AGProductKind.panfleto: return 'Mais pedido';
      case AGProductKind.banner: return 'Eventos';
      case AGProductKind.bloco: return 'Comércio';
      case AGProductKind.apostila: return 'Escolar';
    }
  }

  AGProductTag _inferTagColor(AGProductKind kind) {
    switch (kind) {
      case AGProductKind.panfleto: return AGProductTag.green;
      case AGProductKind.banner: return AGProductTag.orange;
      case AGProductKind.bloco: return AGProductTag.purple;
      case AGProductKind.apostila: return AGProductTag.blue;
    }
  }

  String _formatPrice(double preco) {
    return 'R\$ ${preco.toStringAsFixed(2).replaceAll('.', ',')}';
  }

  Future<void> _fazerPedido(BuildContext context, Produto product) async {
    final title = product.nome;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.surfaceDark : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final borderColor = isDark ? AGColors.hairlineDarkStr : AGColors.hairline;

    final qtyCtrl = TextEditingController(text: '1000');
    final obsCtrl = TextEditingController();
    PlatformFile? selectedFile;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              backgroundColor: bg,
              title: Text('Fazer Pedido de $title', style: TextStyle(color: textColor)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Quantidade', style: TextStyle(color: mutedColor, fontSize: 12)),
                    const SizedBox(height: 4),
                    TextField(
                      controller: qtyCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        border: OutlineInputBorder(),
                      ),
                      style: TextStyle(color: textColor),
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
                      decoration: const InputDecoration(
                        contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        border: OutlineInputBorder(),
                      ),
                      style: TextStyle(color: textColor),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('Cancelar'),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: AGColors.brandGreen),
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('Confirmar', style: TextStyle(color: Colors.white)),
                ),
              ],
            );
          },
        );
      },
    );

    if (confirm != true) return;

    final qty = int.tryParse(qtyCtrl.text) ?? 1000;
    final obs = obsCtrl.text.trim();
    final client = AuthService().currentUser;

    if (client == null) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Você precisa estar logado para fazer um pedido.')),
        );
      }
      return;
    }

    try {
      await OsService().createOrdemServico(
        clienteId: client.id,
        especificacoes: {
          'produtoNome': title,
          'quantidade': qty,
        },
        observacoes: obs.isNotEmpty ? obs : null,
        file: selectedFile,
      );
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pedido criado com sucesso!')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao criar pedido: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.bgDarkDeep : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final searchBg = isDark ? AGColors.surfaceDark : AGColors.surfaceSoft;
    final searchBorder = isDark ? AGColors.hairlineDarkStr : AGColors.hairlineStrong;
    final searchHint = isDark ? AGColors.stone : AGColors.stone;

    return Scaffold(
      backgroundColor: bg,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SafeArea(
            bottom: false,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 4),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              'Catálogo',
                              style: GoogleFonts.inter(
                                fontSize: 28,
                                fontWeight: FontWeight.w600,
                                letterSpacing: -0.6,
                                color: textColor,
                              ),
                            ),
                          ),
                          const ThemeToggleIcon(size: 36),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${_produtos.length} produtos · preço fechado por tiragem',
                        style: GoogleFonts.inter(
                            fontSize: 13, color: mutedColor),
                      ),
                    ],
                  ),
                ),

                // Search bar
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
                  child: Container(
                    height: 44,
                    decoration: BoxDecoration(
                      color: searchBg,
                      borderRadius: BorderRadius.circular(AGRadius.md + 2),
                      border: Border.all(color: searchBorder),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Row(
                      children: [
                        Icon(Icons.search_rounded,
                            size: 16, color: searchHint),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            onChanged: (v) => setState(() => _search = v),
                            style: GoogleFonts.inter(
                                fontSize: 14, color: textColor),
                            decoration: InputDecoration(
                              hintText: 'Buscar produto, papel, formato…',
                              hintStyle: GoogleFonts.inter(
                                  fontSize: 14, color: searchHint),
                              border: InputBorder.none,
                              isDense: true,
                              contentPadding: EdgeInsets.zero,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),


              ],
            ),
          ),

          // Lista de produtos
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.separated(
                    padding: EdgeInsets.only(
                      left: 20,
                      right: 20,
                      top: 16,
                      bottom: 100 + MediaQuery.of(context).padding.bottom,
                    ),
                    itemCount: _filtered.length,
                    separatorBuilder: (_, i) => const SizedBox(height: 12),
                    itemBuilder: (context, i) {
                      final p = _filtered[i];
                      final kind = _inferKind(p.nome);
                      return ProductListCard(
                        kind: kind,
                        title: p.nome,
                        tagLabel: _inferTagLabel(kind),
                        tagColor: _inferTagColor(kind),
                        description: p.descricao ?? '',
                        price: 'a partir de ${_formatPrice(p.precoBase)}',
                        onTap: () => _fazerPedido(context, p),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
