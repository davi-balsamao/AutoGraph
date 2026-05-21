// FilterPillRow — Pills de filtro horizontal do Catálogo
//
// Tokens: AGColors.ink / brandGreen (active), stone (inactive)
// Referência: ClaudeDesign/components/app-screens.jsx → CatalogScreen → Filter pills

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/ag_tokens.dart';

class FilterPillRow extends StatelessWidget {
  final String selected;
  final ValueChanged<String> onSelect;

  static const filters = ['Tudo', 'Promo', '24h', 'Pequena tiragem', 'Grande tiragem'];

  const FilterPillRow({
    super.key,
    required this.selected,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: filters.length,
        separatorBuilder: (_, i) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final filter = filters[i];
          final isActive = filter == selected;

          // Active: ink (light) / green (dark) | Inactive: transparent
          final activeBg = isDark ? AGColors.brandGreen : AGColors.ink;
          final activeFg = isDark ? AGColors.onPrimary : Colors.white;
          final inactiveFg = isDark ? AGColors.onDarkMuted : AGColors.stone;
          final inactiveBorder = isDark ? AGColors.hairlineDark : AGColors.hairline;

          return GestureDetector(
            onTap: () => onSelect(filter),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: isActive ? activeBg : Colors.transparent,
                borderRadius: BorderRadius.circular(AGRadius.full),
                border: Border.all(
                  color: isActive ? activeBg : inactiveBorder,
                ),
              ),
              child: Text(
                filter,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isActive ? activeFg : inactiveFg,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
