// AdminCatalogScreen — Catálogo admin (mobile)
//
// Referência: ClaudeDesign/components/admin-mobile-screens-b.jsx → AdmMobileCatalog
// Dados reais da API: GET /api/produtos

import 'dart:io' as io;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/widgets/ag_product_glyph.dart';
import '../../../core/widgets/ag_theme_toggle.dart';
import '../../../core/models/produto.dart';
import '../../../core/services/produto_service.dart';

class AdminCatalogScreen extends StatefulWidget {
  const AdminCatalogScreen({super.key});

  @override
  State<AdminCatalogScreen> createState() => _AdminCatalogScreenState();
}

class _AdminCatalogScreenState extends State<AdminCatalogScreen> {
  String _filter = 'Todos';
  List<Produto> _produtos = [];
  bool _isLoading = true;
  String _errorMessage = '';
  final Map<String, bool> _activeMap = {};

  final _categories = ['Todos', 'Panfleto', 'Banner', 'Bloco', 'Apostila', 'Cartão'];

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });
    try {
      final prods = await ProdutoService().fetchProdutos();
      setState(() {
        _produtos = prods;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  List<Produto> get _filtered {
    if (_filter == 'Todos') return _produtos;
    return _produtos.where((p) {
      final nome = p.nome.toLowerCase();
      final cat = _filter.toLowerCase();
      if (cat == 'cartão' && nome.contains('cartão')) return true;
      if (cat == 'panfleto' && nome.contains('panfleto')) return true;
      if (cat == 'banner' && (nome.contains('banner') || nome.contains('lona'))) return true;
      if (cat == 'bloco' && nome.contains('bloco')) return true;
      if (cat == 'apostila' && nome.contains('apostila')) return true;
      return false;
    }).toList();
  }

  bool _isProductActive(String id) {
    return _activeMap[id] ?? true;
  }

  void _toggleProductActive(String id) {
    setState(() {
      _activeMap[id] = !(_activeMap[id] ?? true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.bgDarkDeep : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final cardBg = isDark ? AGColors.canvasDark : AGColors.canvas;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_rounded, color: textColor),
          onPressed: () => Navigator.maybePop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Catálogo',
                style: GoogleFonts.inter(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    color: textColor)),
            Text('${_produtos.length} SKUs · margem média 65%',
                style: GoogleFonts.inter(
                    fontSize: 11, color: mutedColor)),
          ],
        ),
        actions: [
          const ThemeToggleIcon(size: 36),
          GestureDetector(
            onTap: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: bg,
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(AGRadius.xl)),
                ),
                builder: (context) => _AddProductSheet(
                  onProductAdded: _loadProducts,
                ),
              );
            },
            child: Container(
              margin: const EdgeInsets.only(right: 12, left: 4),
              width: 32, height: 32,
              decoration: const BoxDecoration(
                color: AGColors.brandGreen,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.add_rounded,
                  color: AGColors.onPrimary, size: 18),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter pills
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _categories.length,
              separatorBuilder: (_, i) => const SizedBox(width: 8),
              itemBuilder: (ctx, i) {
                final cat = _categories[i];
                final isActive = cat == _filter;
                return GestureDetector(
                  onTap: () => setState(() => _filter = cat),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: isActive
                          ? AGColors.brandTealDeep
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(AGRadius.full),
                      border: Border.all(
                        color: isActive
                            ? AGColors.brandTealDeep
                            : borderColor,
                      ),
                    ),
                    child: Text(cat,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: isActive ? Colors.white : mutedColor,
                        )),
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 4),

          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: AGColors.brandGreen,
                    ),
                  )
                : _errorMessage.isNotEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                _errorMessage,
                                style: GoogleFonts.inter(color: AGColors.danger),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 12),
                              ElevatedButton(
                                onPressed: _loadProducts,
                                child: const Text('Tentar Novamente'),
                              )
                            ],
                          ),
                        ),
                      )
                    : _filtered.isEmpty
                        ? Center(
                            child: Text(
                              'Nenhum produto cadastrado.',
                              style: GoogleFonts.inter(color: mutedColor),
                            ),
                          )
                        : ListView.separated(
                            padding: EdgeInsets.only(
                              left: 16, right: 16, top: 8,
                              bottom: 40 + MediaQuery.of(context).padding.bottom,
                            ),
                            itemCount: _filtered.length,
                            separatorBuilder: (_, i) =>
                                Divider(height: 1, color: borderColor),
                            itemBuilder: (ctx, i) {
                              final p = _filtered[i];
                              return _ProductRow(
                                prod: p,
                                cardBg: cardBg,
                                textColor: textColor,
                                mutedColor: mutedColor,
                                isActive: _isProductActive(p.id),
                                onToggle: () => _toggleProductActive(p.id),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}

class _ProductRow extends StatelessWidget {
  final Produto prod;
  final Color cardBg, textColor, mutedColor;
  final bool isActive;
  final VoidCallback onToggle;

  const _ProductRow({
    required this.prod,
    required this.cardBg,
    required this.textColor,
    required this.mutedColor,
    required this.isActive,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    final kind = _getKind(prod.nome);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          // Glyph / Image
          Container(
            width: 44, height: 36,
            clipBehavior: Clip.hardEdge,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AGRadius.md),
              border: Border.all(color: borderColor),
            ),
            child: _buildProductImage(prod.imagemUrl, kind),
          ),

          const SizedBox(width: 12),

          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(prod.nome,
                    style: GoogleFonts.inter(
                      fontSize: 14, fontWeight: FontWeight.w600,
                      color: textColor,
                    )),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text('SKU-${prod.id.substring(0, 5).toUpperCase()} · 24h',
                        style: GoogleFonts.inter(
                            fontSize: 11, color: mutedColor)),
                  ],
                ),
                const SizedBox(height: 3),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Text(
                            'R\$ ${prod.precoBase.toStringAsFixed(prod.precoBase < 10 ? 2 : 0)}',
                            style: GoogleFonts.inter(
                              fontSize: 13, fontWeight: FontWeight.w700,
                              color: textColor,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'margem 65%',
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(
                                fontSize: 11, color: AGColors.brandGreenMid,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text('0 vendas',
                        style: GoogleFonts.inter(
                            fontSize: 11, color: mutedColor)),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(width: 12),

          // Toggle ativo
          Switch.adaptive(
            value: isActive,
            onChanged: (_) => onToggle(),
            activeThumbColor: AGColors.brandGreen,
            activeTrackColor: AGColors.brandGreenSoft,
          ),
        ],
      ),
    );
  }
}

class _AddProductSheet extends StatefulWidget {
  final VoidCallback onProductAdded;

  const _AddProductSheet({required this.onProductAdded});

  @override
  State<_AddProductSheet> createState() => _AddProductSheetState();
}

class _AddProductSheetState extends State<_AddProductSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  final _priceController = TextEditingController();
  PlatformFile? _selectedFile;
  bool _isSaving = false;

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        allowMultiple: false,
      );
      if (!mounted) return;
      if (result != null && result.files.isNotEmpty) {
        setState(() {
          _selectedFile = result.files.first;
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao selecionar imagem: $e')),
      );
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    try {
      final nome = _nameController.text.trim();
      final descricao = _descController.text.trim();
      final preco = double.tryParse(_priceController.text.trim()) ?? 0.0;

      await ProdutoService().createProduto(
        nome,
        descricao.isEmpty ? null : descricao,
        preco,
        file: _selectedFile,
      );

      if (!mounted) return;

      widget.onProductAdded();
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Produto adicionado com sucesso!'),
          backgroundColor: AGColors.brandGreenMid,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao salvar produto: $e'),
          backgroundColor: AGColors.danger,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final borderColor = isDark ? AGColors.hairlineDarkStr : AGColors.hairlineStrong;

    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: 20 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Novo Produto',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: textColor,
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.close, color: textColor),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Nome do Produto',
                  hintText: 'Ex: Cartão de Visita Premium',
                ),
                style: TextStyle(color: textColor),
                validator: (value) =>
                    value == null || value.trim().isEmpty ? 'Insira o nome' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descController,
                decoration: const InputDecoration(
                  labelText: 'Descrição',
                  hintText: 'Ex: Papel Couchê 300g, laminação fosca',
                ),
                style: TextStyle(color: textColor),
                maxLines: 2,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _priceController,
                decoration: const InputDecoration(
                  labelText: 'Preço Base (R\$)',
                  hintText: 'Ex: 45.00',
                ),
                style: TextStyle(color: textColor),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) return 'Insira o preço';
                  if (double.tryParse(value.trim()) == null) return 'Preço inválido';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              GestureDetector(
                onTap: _pickImage,
                child: Container(
                  height: 100,
                  decoration: BoxDecoration(
                    color: isDark ? AGColors.surfaceDark : AGColors.surfaceSoft,
                    borderRadius: BorderRadius.circular(AGRadius.md),
                    border: Border.all(color: borderColor),
                  ),
                  child: _selectedFile != null
                      ? Stack(
                          children: [
                            Positioned.fill(
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(AGRadius.md),
                                child: kIsWeb
                                    ? Image.memory(
                                        _selectedFile!.bytes!,
                                        fit: BoxFit.cover,
                                      )
                                    : Image.file(
                                        io.File(_selectedFile!.path!),
                                        fit: BoxFit.cover,
                                      ),
                              ),
                            ),
                            Positioned(
                              top: 4,
                              right: 4,
                              child: CircleAvatar(
                                backgroundColor: Colors.black.withValues(alpha: 0.6),
                                radius: 14,
                                child: IconButton(
                                  padding: EdgeInsets.zero,
                                  icon: const Icon(Icons.close, size: 16, color: Colors.white),
                                  onPressed: () {
                                    setState(() {
                                      _selectedFile = null;
                                    });
                                  },
                                ),
                              ),
                            ),
                          ],
                        )
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add_a_photo_rounded, color: mutedColor, size: 28),
                            const SizedBox(height: 8),
                            Text(
                              'Selecionar Foto para o Catálogo',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: mutedColor,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isSaving ? null : _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AGColors.brandGreen,
                  foregroundColor: AGColors.onPrimary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AGRadius.full),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: _isSaving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AGColors.onPrimary,
                        ),
                      )
                    : Text(
                        'Adicionar ao Catálogo',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

AGProductKind _getKind(String name) {
  final n = name.toLowerCase();
  if (n.contains('panfleto') || n.contains('flyer')) {
    return AGProductKind.panfleto;
  } else if (n.contains('banner') || n.contains('lona') || n.contains('faixa')) {
    return AGProductKind.banner;
  } else if (n.contains('bloco') || n.contains('talão')) {
    return AGProductKind.bloco;
  } else if (n.contains('apostila') || n.contains('livro') || n.contains('caderno')) {
    return AGProductKind.apostila;
  }
  return AGProductKind.panfleto;
}

Widget _buildProductImage(String? url, AGProductKind fallbackKind) {
  if (url != null && url.isNotEmpty) {
    final fullUrl = url.startsWith('/') ? 'https://prescribe-ocean-tiptoeing.ngrok-free.dev$url' : url;
    return Image.network(
      fullUrl,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) {
        return AGProductGlyph(kind: fallbackKind, size: 60);
      },
    );
  }
  return AGProductGlyph(kind: fallbackKind, size: 60);
}
