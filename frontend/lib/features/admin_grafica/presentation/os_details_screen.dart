import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/models/ordem_servico.dart';
import '../../../core/services/os_service.dart';
import '../../../core/utils/snackbar_util.dart';
import '../../../core/theme/app_theme.dart';
import 'package:intl/intl.dart';
import '../../admin_chat/presentation/admin_chat_conversation_screen.dart';

class OsDetailsScreen extends StatefulWidget {
  final OrdemServico os;

  const OsDetailsScreen({super.key, required this.os});

  @override
  State<OsDetailsScreen> createState() => _OsDetailsScreenState();
}

class _OsDetailsScreenState extends State<OsDetailsScreen> {
  late TextEditingController _specsController;
  late TextEditingController _obsController;
  late TextEditingController _artUrlController;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    // Preparar JSON das especificações
    final specsCopy = Map<String, dynamic>.from(widget.os.especificacoes);
    final artUrl = specsCopy.remove('arte_url') as String? ?? '';

    _specsController = TextEditingController(text: const JsonEncoder.withIndent('  ').convert(specsCopy));
    _obsController = TextEditingController(text: widget.os.observacoes ?? '');
    _artUrlController = TextEditingController(text: artUrl);
  }

  @override
  void dispose() {
    _specsController.dispose();
    _obsController.dispose();
    _artUrlController.dispose();
    super.dispose();
  }

  Future<void> _saveData() async {
    setState(() => _isSaving = true);
    try {
      final specsMap = jsonDecode(_specsController.text) as Map<String, dynamic>;
      
      // Adiciona a arte de volta nas especificações, se houver
      if (_artUrlController.text.trim().isNotEmpty) {
        specsMap['arte_url'] = _artUrlController.text.trim();
      }

      await OsService().updateOS(
        widget.os.id,
        especificacoes: specsMap,
        observacoes: _obsController.text.trim(),
      );
      
      if (mounted) SnackbarUtil.showSuccess(context, 'Dados salvos com sucesso!');
    } catch (e) {
      if (mounted) SnackbarUtil.showError(context, 'Erro ao salvar: O JSON pode estar inválido.');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final DateFormat dateFormat = DateFormat('dd/MM/yyyy HH:mm');
    final brandGreen = AppColors.brandGreen;

    return Scaffold(
      appBar: AppBar(
        title: Text('ORDER DETAILS', style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: cs.onSurface.withValues(alpha: 0.5))),
        actions: [
          _isSaving 
            ? const Padding(padding: EdgeInsets.all(16), child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)))
            : TextButton.icon(
                onPressed: _saveData,
                icon: const Icon(Icons.check, size: 18),
                label: const Text('SAVE CHANGES'),
                style: TextButton.styleFrom(foregroundColor: brandGreen, textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Badge and ID
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    'OS #${widget.os.id.split('-').last.toUpperCase()}',
                    style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.bold, color: cs.onSurface),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(widget.os.status).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: _getStatusColor(widget.os.status).withValues(alpha: 0.5)),
                  ),
                  child: Text(
                    widget.os.status.label.toUpperCase(),
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: _getStatusColor(widget.os.status)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => AdminChatConversationScreen(
                        clientId: widget.os.clienteId,
                        clientName: widget.os.clienteNome ?? 'Cliente',
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.chat_outlined),
                label: const Text('CONVERSAR COM CLIENTE (WHATSAPP)'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brandGreen,
                  foregroundColor: AppColors.brandTealDeep,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  textStyle: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const SizedBox(height: 32),
            
            // Core Information Grid
            _SectionHeader(title: 'General Information'),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: cs.outline),
              ),
              child: Column(
                children: [
                   _InfoRow(label: 'Product', value: widget.os.produtoResumo),
                  const Divider(height: 24),
                  _InfoRow(label: 'Customer', value: widget.os.clienteNome ?? 'Not provided'),
                  _InfoRow(label: 'Phone', value: widget.os.clienteTelefone ?? 'Not provided'),
                  const Divider(height: 24),
                  _InfoRow(
                    label: 'Delivery Type',
                    value: widget.os.especificacoes['opcaoEntrega'] == 'entrega' ? 'Delivery (Entrega em Casa)' : 'Store Pickup (Retirada na Loja)',
                  ),
                  if (widget.os.especificacoes['opcaoEntrega'] == 'entrega') ...[
                    _InfoRow(
                      label: 'Delivery Address',
                      value: widget.os.especificacoes['enderecoEntrega'] ?? widget.os.clienteEnderecoCompleto ?? 'Not provided',
                    ),
                    _InfoRow(
                      label: 'Reference Point',
                      value: widget.os.especificacoes['referenciaEntrega'] ?? widget.os.clienteEnderecoReferencia ?? 'Not provided',
                    ),
                  ],
                  const Divider(height: 24),
                  _InfoRow(label: 'Created', value: dateFormat.format(widget.os.criadoEm)),
                  _InfoRow(label: 'Last Update', value: dateFormat.format(widget.os.atualizadoEm)),
                  if (widget.os.durationSeconds > 0) ...[
                    const Divider(height: 24),
                    _InfoRow(label: 'Production Time', value: widget.os.durationFormatted),
                  ],
                ],
              ),
            ),
            
            const SizedBox(height: 40),
            _SectionHeader(title: 'Customer Assets'),
            const SizedBox(height: 16),
            TextField(
              controller: _artUrlController,
              decoration: InputDecoration(
                labelText: 'Artwork URL (Google Drive / Dropbox)',
                labelStyle: const TextStyle(fontSize: 13, color: AppColors.steel),
                prefixIcon: const Icon(Icons.link, size: 20),
                fillColor: cs.surfaceContainerHighest,
                filled: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),

            const SizedBox(height: 40),
            _SectionHeader(title: 'Technical Specifications (JSON)'),
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(
                color: AppColors.brandTealDeep,
                borderRadius: BorderRadius.circular(8),
              ),
              child: TextField(
                controller: _specsController,
                maxLines: 8,
                style: const TextStyle(fontFamily: 'Courier', fontSize: 13, color: AppColors.brandGreen),
                decoration: const InputDecoration(
                  contentPadding: EdgeInsets.all(16),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                ),
              ),
            ),

            const SizedBox(height: 40),
            _SectionHeader(title: 'Internal Observations'),
            const SizedBox(height: 16),
            TextField(
              controller: _obsController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'Add private notes for the production team...',
                fillColor: cs.surfaceContainerHighest,
                filled: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),

            if (widget.os.mensagemSugerida != null && widget.os.mensagemSugerida!.isNotEmpty) ...[
              const SizedBox(height: 40),
              _SectionHeader(title: 'AI Suggested Response'),
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.brandGreenDark.withValues(alpha: 0.25) : AppColors.successLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.brandGreen.withValues(alpha: 0.3)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.auto_awesome, color: AppColors.brandGreenDark, size: 20),
                    const SizedBox(width: 16),
                    Expanded(
                      child: SelectableText(
                        widget.os.mensagemSugerida!,
                        style: GoogleFonts.outfit(color: cs.onSurface, fontSize: 15, height: 1.5),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(StatusOS status) {
    switch (status) {
      case StatusOS.aguardandoOrcamento: return AppColors.orange;
      case StatusOS.emProducao: return AppColors.purple;
      case StatusOS.prontaParaRetirada: return AppColors.brandGreen;
      case StatusOS.entregue: return AppColors.steel;
      case StatusOS.cancelada: return Colors.red;
      default: return AppColors.brandTeal;
    }
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title.toUpperCase(),
      style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5), letterSpacing: 0.5),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(fontWeight: FontWeight.w500, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.55), fontSize: 13),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurface, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}
