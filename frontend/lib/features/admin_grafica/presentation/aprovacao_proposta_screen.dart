import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/models/proposta_pendente.dart';
import '../../../core/services/proposta_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/snackbar_util.dart';
import '../../admin_chat/presentation/admin_chat_conversation_screen.dart';

/// Tela full-screen para revisar a proposta da IA. Permite editar valor e
/// observações antes de aprovar, rejeitar com motivo, ou assumir a conversa
/// no WhatsApp.
class AprovacaoPropostaScreen extends StatefulWidget {
  final PropostaPendente proposta;
  const AprovacaoPropostaScreen({super.key, required this.proposta});

  @override
  State<AprovacaoPropostaScreen> createState() => _AprovacaoPropostaScreenState();
}

class _AprovacaoPropostaScreenState extends State<AprovacaoPropostaScreen> {
  late final TextEditingController _valorController;
  late final TextEditingController _prazoController;
  late final TextEditingController _validadeController;
  late final TextEditingController _detalhesController;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _valorController = TextEditingController(
      text: widget.proposta.orcamento.total.toStringAsFixed(2),
    );
    _prazoController = TextEditingController(text: widget.proposta.orcamento.prazo);
    _validadeController = TextEditingController(text: widget.proposta.orcamento.validade);
    _detalhesController = TextEditingController(text: widget.proposta.orcamento.detalhes ?? '');
  }

  @override
  void dispose() {
    _valorController.dispose();
    _prazoController.dispose();
    _validadeController.dispose();
    _detalhesController.dispose();
    super.dispose();
  }

  OrcamentoProposta? _coletarOrcamentoEditado() {
    final valor = double.tryParse(_valorController.text.replaceAll(',', '.'));
    if (valor == null || valor <= 0) {
      SnackbarUtil.showError(context, 'Valor inválido.');
      return null;
    }
    return OrcamentoProposta(
      total: valor,
      prazo: _prazoController.text.trim(),
      validade: _validadeController.text.trim(),
      detalhes: _detalhesController.text.trim().isEmpty
          ? null
          : _detalhesController.text.trim(),
    );
  }

  bool _orcamentoFoiEditado(OrcamentoProposta novo) {
    final atual = widget.proposta.orcamento;
    return novo.total != atual.total ||
        novo.prazo != atual.prazo ||
        novo.validade != atual.validade ||
        novo.detalhes != atual.detalhes;
  }

  Future<void> _aprovar() async {
    final novo = _coletarOrcamentoEditado();
    if (novo == null) return;
    setState(() => _submitting = true);
    try {
      if (_orcamentoFoiEditado(novo)) {
        await PropostaService().editar(widget.proposta.sessaoId, orcamento: novo);
      }
      await PropostaService().aprovar(widget.proposta.sessaoId);
      if (!mounted) return;
      SnackbarUtil.showSuccess(context, 'Orçamento enviado ao cliente!');
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      SnackbarUtil.showError(context, 'Falha ao aprovar: $e');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _rejeitar() async {
    final motivo = await _perguntarMotivo();
    if (motivo == null) return; // cancelado
    setState(() => _submitting = true);
    try {
      await PropostaService().rejeitar(widget.proposta.sessaoId, motivo: motivo);
      if (!mounted) return;
      SnackbarUtil.showSuccess(context, 'Proposta rejeitada. Conversa transferida.');
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      SnackbarUtil.showError(context, 'Falha ao rejeitar: $e');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<String?> _perguntarMotivo() async {
    final controller = TextEditingController();
    final motivo = await showDialog<String?>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Motivo da rejeição'),
        content: TextField(
          controller: controller,
          maxLines: 3,
          decoration: const InputDecoration(hintText: 'Opcional — para registro interno'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(null),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.of(ctx).pop(controller.text.trim()),
            child: const Text('Rejeitar'),
          ),
        ],
      ),
    );
    return motivo;
  }

  Future<void> _assumirConversa() async {
    setState(() => _submitting = true);
    try {
      await ConversaService().assumir(widget.proposta.clienteId);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => AdminChatConversationScreen(
            clientId: widget.proposta.clienteId,
            clientName: widget.proposta.clienteNome,
            clientPhone: widget.proposta.clienteTelefone,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      SnackbarUtil.showError(context, 'Falha ao assumir: $e');
      setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Revisar orçamento',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
      ),
      body: AbsorbPointer(
        absorbing: _submitting,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _ClienteHeader(proposta: widget.proposta),
              const SizedBox(height: 20),
              Text(
                'Especificações',
                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              _RequisitosList(requisitos: widget.proposta.especificacoes.requisitos),
              const SizedBox(height: 24),
              Text(
                'Orçamento (editável)',
                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _valorController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
                ],
                decoration: const InputDecoration(
                  labelText: 'Valor total (R\$)',
                  prefixIcon: Icon(Icons.attach_money),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _prazoController,
                      decoration: const InputDecoration(
                        labelText: 'Prazo',
                        prefixIcon: Icon(Icons.schedule),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _validadeController,
                      decoration: const InputDecoration(
                        labelText: 'Validade',
                        prefixIcon: Icon(Icons.event),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _detalhesController,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Detalhes (opcional)',
                  prefixIcon: Icon(Icons.notes),
                ),
              ),
              const SizedBox(height: 24),
              _ActionButtons(
                submitting: _submitting,
                onAprovar: _aprovar,
                onRejeitar: _rejeitar,
                onAssumir: _assumirConversa,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ClienteHeader extends StatelessWidget {
  final PropostaPendente proposta;
  const _ClienteHeader({required this.proposta});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.brandGreen.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: AppColors.brandGreen,
            child: Text(
              proposta.clienteNome.isNotEmpty
                  ? proposta.clienteNome[0].toUpperCase()
                  : '?',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  proposta.clienteNome,
                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                if (proposta.clienteTelefone.isNotEmpty)
                  Text(
                    proposta.clienteTelefone,
                    style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
                  ),
                Text(
                  proposta.especificacoes.produto,
                  style: GoogleFonts.outfit(fontSize: 13, color: Colors.grey.shade800),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RequisitosList extends StatelessWidget {
  final List<RequisitoProposta> requisitos;
  const _RequisitosList({required this.requisitos});

  @override
  Widget build(BuildContext context) {
    if (requisitos.isEmpty) {
      return Text('Nenhum requisito informado.', style: TextStyle(color: Colors.grey.shade600));
    }
    return Column(
      children: requisitos.map((r) {
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.chevron_right, size: 16, color: Colors.grey),
              Expanded(
                child: RichText(
                  text: TextSpan(
                    style: DefaultTextStyle.of(context).style,
                    children: [
                      TextSpan(
                        text: '${r.pergunta}: ',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      TextSpan(text: r.resposta),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _ActionButtons extends StatelessWidget {
  final bool submitting;
  final VoidCallback onAprovar;
  final VoidCallback onRejeitar;
  final VoidCallback onAssumir;

  const _ActionButtons({
    required this.submitting,
    required this.onAprovar,
    required this.onRejeitar,
    required this.onAssumir,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            icon: submitting
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.check_circle),
            label: const Text('Aprovar e enviar ao cliente'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.brandGreen,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: submitting ? null : onAprovar,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                icon: const Icon(Icons.cancel_outlined),
                label: const Text('Rejeitar'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red,
                  side: const BorderSide(color: Colors.red),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                onPressed: submitting ? null : onRejeitar,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: OutlinedButton.icon(
                icon: const Icon(Icons.headset_mic),
                label: const Text('Assumir'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                onPressed: submitting ? null : onAssumir,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
