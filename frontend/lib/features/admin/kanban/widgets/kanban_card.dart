// KanbanCard — Card de OS no Kanban admin
//
// Referência: ClaudeDesign/components/admin-mobile-screens-a.jsx → KanbanCard

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/ag_tokens.dart';
import '../../../../core/models/ordem_servico.dart';
import '../../shared/adm_badge.dart';

class KanbanCard extends StatelessWidget {
  final OrdemServico os;
  final VoidCallback? onTap;

  const KanbanCard({super.key, required this.os, this.onTap});

  static AdmBadgeStyle _tagStyle(String produto) {
    final p = produto.toLowerCase();
    if (p.contains('banner')) return AdmBadgeStyle.orange;
    if (p.contains('panfleto')) return AdmBadgeStyle.green;
    if (p.contains('bloco')) return AdmBadgeStyle.purple;
    if (p.contains('apostila')) return AdmBadgeStyle.blue;
    return AdmBadgeStyle.gray;
  }

  bool get _isLocked => os.status == StatusOS.aguardandoOrcamento;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? AGColors.canvasDark : AGColors.canvas;
    final borderColor = _isLocked
        ? AGColors.warningText.withValues(alpha: 0.4)
        : (isDark ? AGColors.hairlineDark : AGColors.hairline);
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;

    final produto = (os.especificacoes['produtoNome'] ?? os.especificacoes['produto']) as String? ?? 'Produto';
    final cliente = os.clienteNome ?? 'Cliente';
    final orcamento = os.especificacoes['orcamento'] as Map?;
    final total = (orcamento?['total'] as num?)?.toDouble();

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(AGRadius.xl - 4),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Tag produto + ID
            Row(
              children: [
                AdmBadge(produto, _tagStyle(produto)),
                const SizedBox(width: 8),
                Text(
                  '#${os.id.substring(0, 6).toUpperCase()}',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 11, color: mutedColor),
                ),
                const Spacer(),
                // Badge bloqueado (aguardando aprovação do cliente)
                if (_isLocked) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                    decoration: BoxDecoration(
                      color: AGColors.warningBg,
                      borderRadius: BorderRadius.circular(3),
                    ),
                    child: Text('🔒 AGUARDANDO',
                        style: GoogleFonts.inter(
                          fontSize: 8, fontWeight: FontWeight.w700,
                          color: AGColors.warningText, letterSpacing: 0.3)),
                  ),
                ] else ...[
                  // Indicador prioridade
                  Container(
                    width: 8, height: 8,
                    decoration: const BoxDecoration(
                      color: AGColors.accentOrange,
                      shape: BoxShape.circle,
                    ),
                  ),
                ],
              ],
            ),

            const SizedBox(height: 8),

            // Título da OS
            Text(
              os.produtoResumo,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: textColor,
                letterSpacing: -0.2,
              ),
            ),

            const SizedBox(height: 4),

            // Cliente
            Row(
              children: [
                Container(
                  width: 16, height: 16,
                  decoration: BoxDecoration(
                    color: AGColors.brandGreen.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      cliente.isNotEmpty ? cliente[0].toUpperCase() : '?',
                      style: GoogleFonts.inter(
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        color: AGColors.brandGreenDark,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Text(cliente,
                    style: GoogleFonts.inter(
                        fontSize: 12, color: mutedColor)),
              ],
            ),

            const SizedBox(height: 10),

            // Footer: timer + valor
            Row(
              children: [
                Icon(Icons.timer_outlined, size: 14, color: mutedColor),
                const SizedBox(width: 4),
                Text('—',
                    style: GoogleFonts.inter(
                        fontSize: 11, color: mutedColor)),
                const Spacer(),
                if (total != null)
                  Text(
                    'R\$ ${total.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')}',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: textColor,
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
