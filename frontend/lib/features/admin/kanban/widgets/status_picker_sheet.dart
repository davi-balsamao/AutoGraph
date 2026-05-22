import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/ag_tokens.dart';
import '../../../../core/models/ordem_servico.dart';

class StatusPickerSheet extends StatelessWidget {
  final StatusOS currentStatus;
  final Function(StatusOS) onSelected;

  const StatusPickerSheet({
    super.key,
    required this.currentStatus,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.canvasDark : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;

    final availableStatuses = StatusOS.values.where((s) => s != StatusOS.criada).toList();

    return Container(
      decoration: BoxDecoration(
        color: bg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
              child: Text(
                'Mover OS para:',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: textColor,
                ),
              ),
            ),
            const Divider(),
            ...availableStatuses.map((status) {
              final isCurrent = status == currentStatus;
              final isLocked = status == StatusOS.aguardandoOrcamento;

              return ListTile(
                enabled: !isCurrent && !isLocked,
                leading: Icon(
                  _getIconForStatus(status),
                  color: (isCurrent || isLocked) ? mutedColor : _getColorForStatus(status),
                ),
                title: Text(
                  status.label,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: (isCurrent || isLocked) ? mutedColor : textColor,
                    fontWeight: isCurrent ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
                trailing: isCurrent
                    ? const Icon(Icons.check, color: AGColors.brandGreen)
                    : (isLocked ? const Icon(Icons.lock_outline, size: 16) : null),
                onTap: () {
                  if (!isCurrent && !isLocked) {
                    onSelected(status);
                  }
                },
              );
            }),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  IconData _getIconForStatus(StatusOS status) {
    switch (status) {
      case StatusOS.aguardandoOrcamento:
        return Icons.hourglass_empty;
      case StatusOS.aprovado:
        return Icons.thumb_up_outlined;
      case StatusOS.emProducao:
        return Icons.build_circle_outlined;
      case StatusOS.prontaParaRetirada:
        return Icons.inventory_2_outlined;
      case StatusOS.entregue:
        return Icons.check_circle_outline;
      case StatusOS.cancelada:
        return Icons.cancel_outlined;
      default:
        return Icons.circle_outlined;
    }
  }

  Color _getColorForStatus(StatusOS status) {
    switch (status) {
      case StatusOS.aguardandoOrcamento:
        return AGColors.warningText;
      case StatusOS.aprovado:
        return AGColors.accentBlue;
      case StatusOS.emProducao:
        return AGColors.accentOrange;
      case StatusOS.prontaParaRetirada:
        return AGColors.accentPurple;
      case StatusOS.entregue:
        return AGColors.brandGreen;
      case StatusOS.cancelada:
        return Colors.red;
      default:
        return AGColors.steel;
    }
  }
}
