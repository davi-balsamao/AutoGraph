// AdminCatalogScreen — Catálogo admin (mobile)
//
// Referência: ClaudeDesign/components/admin-mobile-screens-b.jsx → AdmMobileCatalog
// Dados mockados. Real: GET /catalog/products

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/widgets/ag_product_glyph.dart';

class AdminCatalogScreen extends StatefulWidget {
  const AdminCatalogScreen({super.key});

  @override
  State<AdminCatalogScreen> createState() => _AdminCatalogScreenState();
}

class _AdminCatalogScreenState extends State<AdminCatalogScreen> {
  String _filter = 'Todos';

  static final _products = [
    _Prod('Panfleto A5', 'PNF-A5-115', 'Panfleto', AGProductKind.panfleto,
        0.12, 68, 284, true),
    _Prod('Panfleto A6', 'PNF-A6-115', 'Panfleto', AGProductKind.panfleto,
        0.06, 65, 142, true),
    _Prod('Banner Lona 440g', 'BNR-LN-440', 'Banner', AGProductKind.banner,
        49.0, 62, 64, true),
    _Prod('Banner Oxford', 'BNR-DX', 'Banner', AGProductKind.banner,
        79.0, 64, 22, true),
    _Prod('Bloco 50fls 1 via', 'BLC-50-1V', 'Bloco', AGProductKind.bloco,
        12.0, 58, 45, false),
  ];

  List<_Prod> get _filtered => _filter == 'Todos'
      ? _products
      : _products.where((p) => p.categoria == _filter).toList();

  final _categories = ['Todos', 'Panfleto', 'Banner', 'Bloco', 'Apostila'];

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
            Text('10 SKUs · margem média 68%',
                style: GoogleFonts.inter(
                    fontSize: 11, color: mutedColor)),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            width: 32, height: 32,
            decoration: const BoxDecoration(
              color: AGColors.brandGreen,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.add_rounded,
                color: AGColors.onPrimary, size: 18),
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
            child: ListView.separated(
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
                  onToggle: () => setState(() => p.ativo = !p.ativo),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _Prod {
  final String nome, sku, categoria;
  final AGProductKind kind;
  final double preco, margem;
  final int vendas;
  bool ativo;

  _Prod(this.nome, this.sku, this.categoria, this.kind,
      this.preco, this.margem, this.vendas, this.ativo);
}

class _ProductRow extends StatelessWidget {
  final _Prod prod;
  final Color cardBg, textColor, mutedColor;
  final VoidCallback onToggle;

  const _ProductRow({
    required this.prod, required this.cardBg,
    required this.textColor, required this.mutedColor,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          // Glyph
          Container(
            width: 44, height: 36,
            clipBehavior: Clip.hardEdge,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AGRadius.md),
            ),
            child: AGProductGlyph(kind: prod.kind, size: 60),
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
                    Text('${prod.sku} · 24h',
                        style: GoogleFonts.inter(
                            fontSize: 11, color: mutedColor)),
                  ],
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Text(
                      'R\$ ${prod.preco.toStringAsFixed(prod.preco < 10 ? 2 : 0)}',
                      style: GoogleFonts.inter(
                        fontSize: 13, fontWeight: FontWeight.w700,
                        color: textColor,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'margem ${prod.margem.toStringAsFixed(0)}%',
                      style: GoogleFonts.inter(
                        fontSize: 11, color: AGColors.brandGreenMid,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const Spacer(),
                    Text('${prod.vendas} vendas',
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
            value: prod.ativo,
            onChanged: (_) => onToggle(),
            activeThumbColor: AGColors.brandGreen,
            activeTrackColor: AGColors.brandGreenSoft,
          ),
        ],
      ),
    );
  }
}
