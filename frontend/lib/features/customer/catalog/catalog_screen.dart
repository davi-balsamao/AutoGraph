// CatalogScreen — Tela de catálogo de produtos (03 · Catálogo)
//
// Tokens usados:
//   AGColors (via isDark), AGRadius.md (search bar)
//   AGSpacing.lg = 20 (padding)
//
// Referência: ClaudeDesign/components/app-screens.jsx → CatalogScreen

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/widgets/ag_product_glyph.dart';
import '../../../core/widgets/ag_theme_toggle.dart';
import 'widgets/filter_pill_row.dart';
import 'widgets/product_list_card.dart';

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key});

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  String _selectedFilter = 'Tudo';
  String _search = '';

  static const _allProducts = [
    (
      AGProductKind.panfleto,
      'Panfletos',
      'Mais pedido',
      AGProductTag.green,
      'A6, A5, A4 · couché ou offset · 4×4',
      'R\$ 89/milheiro',
    ),
    (
      AGProductKind.banner,
      'Banners',
      'Eventos',
      AGProductTag.orange,
      'Lona 440g, oxford ou vinil adesivo',
      'R\$ 49/m²',
    ),
    (
      AGProductKind.bloco,
      'Blocos',
      'Comércio',
      AGProductTag.purple,
      '1 ou 2 vias, numerado, carbonado',
      'R\$ 12/unidade',
    ),
    (
      AGProductKind.apostila,
      'Apostilas',
      'Escolar',
      AGProductTag.blue,
      'Espiral, wire-o ou costurada',
      'R\$ 18/unidade',
    ),
  ];

  List<dynamic> get _filtered {
    return _allProducts.where((p) {
      final matchesSearch = _search.isEmpty ||
          p.$2.toLowerCase().contains(_search.toLowerCase()) ||
          p.$5.toLowerCase().contains(_search.toLowerCase());
      // Filtro por categoria — expandir conforme necessário
      final matchesFilter = _selectedFilter == 'Tudo' || true;
      return matchesSearch && matchesFilter;
    }).toList();
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
                        '4 produtos · preço fechado por tiragem',
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

                // Filter pills
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
                  child: FilterPillRow(
                    selected: _selectedFilter,
                    onSelect: (f) => setState(() => _selectedFilter = f),
                  ),
                ),
              ],
            ),
          ),

          // Lista de produtos
          Expanded(
            child: ListView.separated(
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
                return ProductListCard(
                  kind: p.$1 as AGProductKind,
                  title: p.$2 as String,
                  tagLabel: p.$3 as String,
                  tagColor: p.$4 as AGProductTag,
                  description: p.$5 as String,
                  price: p.$6 as String,
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
