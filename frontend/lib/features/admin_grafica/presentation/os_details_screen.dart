import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import '../../../core/models/ordem_servico.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/os_service.dart';
import '../../../core/utils/snackbar_util.dart';
import '../../../core/theme/app_theme.dart';
import 'package:intl/intl.dart';
import '../../admin/chat/admin_chat_conversation_screen.dart';

/// Labels amigáveis para chaves técnicas do `especificacoes`.
const _labelMap = {
  'produto': 'Produto',
  'produtoNome': 'Produto',
  'quantidade': 'Quantidade',
  'tamanho': 'Tamanho',
  'cor': 'Cor',
  'gramatura': 'Gramatura',
  'acabamento': 'Acabamento',
  'observacoes': 'Observações',
  'opcaoEntrega': 'Tipo de entrega',
  'enderecoEntrega': 'Endereço',
  'referenciaEntrega': 'Referência',
  'totalEstimado': 'Total estimado',
};

String _humanLabel(String key) {
  return _labelMap[key] ?? (key[0].toUpperCase() + key.substring(1));
}

String _humanValue(dynamic value) {
  if (value == null) return '—';
  if (value is bool) return value ? 'Sim' : 'Não';
  if (value is num) return value.toString();
  if (value is List) return value.map((e) => '$e').join(', ');
  if (value is Map) return value.entries.map((e) => '${e.key}: ${e.value}').join(' · ');
  return '$value';
}

class OsDetailsScreen extends StatefulWidget {
  final OrdemServico os;

  const OsDetailsScreen({super.key, required this.os});

  @override
  State<OsDetailsScreen> createState() => _OsDetailsScreenState();
}

class _OsDetailsScreenState extends State<OsDetailsScreen> {
  late TextEditingController _obsController;
  late TextEditingController _artUrlController;
  late TextEditingController _totalCtrl;
  late TextEditingController _prazoCtrl;

  bool _isSaving = false;
  bool _isApproving = false;
  bool _isRejecting = false;
  String? _sessaoId;
  late StatusOS _statusAtual;

  bool get _isPendingReview => _statusAtual == StatusOS.aguardandoOrcamento;

  @override
  void initState() {
    super.initState();
    _statusAtual = widget.os.status;
    final artUrl = widget.os.especificacoes['arte_url'] as String? ?? '';
    _obsController = TextEditingController(text: widget.os.observacoes ?? '');
    _artUrlController = TextEditingController(text: artUrl);

    final orcamento = (widget.os.especificacoes['orcamento'] as Map?) ?? {};
    _totalCtrl = TextEditingController(text: '${orcamento['total'] ?? ''}');
    _prazoCtrl = TextEditingController(
        text: '${orcamento['prazo'] ?? '3 dias úteis'}');

    if (_isPendingReview) _loadSessaoId();
  }

  @override
  void dispose() {
    _obsController.dispose();
    _artUrlController.dispose();
    _totalCtrl.dispose();
    _prazoCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadSessaoId() async {
    try {
      final res = await http.get(
        Uri.parse('${AuthService().baseUrl}/propostas'),
        headers: AuthService().authHeaders,
      );
      if (res.statusCode == 200 && mounted) {
        final List<dynamic> data = jsonDecode(res.body);
        final match = data.cast<Map<String, dynamic>>().firstWhere(
              (p) => p['osId'] == widget.os.id,
              orElse: () => {},
            );
        if (match.isNotEmpty) {
          setState(() => _sessaoId = match['sessaoId'] as String?);
        }
      }
    } catch (_) {}
  }

  Future<void> _saveData() async {
    setState(() => _isSaving = true);
    try {
      // Preserva todos os campos existentes; só atualiza arte_url se mudou
      final specsMap = Map<String, dynamic>.from(widget.os.especificacoes);
      final artUrl = _artUrlController.text.trim();
      if (artUrl.isNotEmpty) {
        specsMap['arte_url'] = artUrl;
      } else {
        specsMap.remove('arte_url');
      }
      await OsService().updateOS(
        widget.os.id,
        especificacoes: specsMap,
        observacoes: _obsController.text.trim(),
      );
      if (mounted) SnackbarUtil.showSuccess(context, 'Dados salvos com sucesso!');
    } catch (e) {
      if (mounted) SnackbarUtil.showError(context, 'Erro ao salvar.');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _aprovar() async {
    setState(() => _isApproving = true);
    try {
      final novoTotal = double.tryParse(_totalCtrl.text.replaceAll(',', '.'));
      final novoPrazo = _prazoCtrl.text.trim();

      if (_sessaoId != null) {
        // Salva edições de orçamento antes de aprovar
        if (novoTotal != null || novoPrazo.isNotEmpty) {
          await http.patch(
            Uri.parse('${AuthService().baseUrl}/propostas/$_sessaoId'),
            headers: AuthService().authHeaders,
            body: jsonEncode({
              'proposta': {
                'orcamento': {
                  'total': ?novoTotal,
                  if (novoPrazo.isNotEmpty) 'prazo': novoPrazo,
                }
              }
            }),
          );
        }

        final res = await http.post(
          Uri.parse('${AuthService().baseUrl}/propostas/$_sessaoId/aprovar'),
          headers: AuthService().authHeaders,
        );

        if (res.statusCode == 200 && mounted) {
          SnackbarUtil.showSuccess(context, 'Proposta aprovada! Orçamento enviado ao cliente.');
          Navigator.maybePop(context);
          return;
        }
      }

      // Fallback
      await OsService().updateStatus(widget.os.id, StatusOS.aprovado);
      if (novoTotal != null || novoPrazo.isNotEmpty) {
        final specsMap = Map<String, dynamic>.from(widget.os.especificacoes);
        specsMap['orcamento'] = {
          'total': ?novoTotal,
          if (novoPrazo.isNotEmpty) 'prazo': novoPrazo,
        };
        await OsService().updateOS(widget.os.id, especificacoes: specsMap);
      }
      if (mounted) {
        SnackbarUtil.showSuccess(context, 'Ordem de serviço aprovada com sucesso!');
        Navigator.maybePop(context);
      }
    } catch (e) {
      if (mounted) SnackbarUtil.showError(context, 'Falha ao aprovar: $e');
    } finally {
      if (mounted) setState(() => _isApproving = false);
    }
  }

  Future<void> _rejeitar() async {
    setState(() => _isRejecting = true);
    try {
      if (_sessaoId != null) {
        final res = await http.post(
          Uri.parse('${AuthService().baseUrl}/propostas/$_sessaoId/rejeitar'),
          headers: AuthService().authHeaders,
          body: jsonEncode({'motivo': 'Rejeitado pelo admin'}),
        );
        if (res.statusCode == 200 && mounted) {
          SnackbarUtil.showSuccess(context, 'Proposta rejeitada. Sessão escalada para atendimento humano.');
          Navigator.maybePop(context);
          return;
        }
      }

      // Fallback
      await OsService().updateStatus(widget.os.id, StatusOS.cancelada);
      if (mounted) {
        SnackbarUtil.showSuccess(context, 'Ordem de serviço cancelada com sucesso!');
        Navigator.maybePop(context);
      }
    } catch (e) {
      if (mounted) SnackbarUtil.showError(context, 'Falha ao recusar: $e');
    } finally {
      if (mounted) setState(() => _isRejecting = false);
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
        title: Text(
          'DETALHES DA OS',
          style: GoogleFonts.outfit(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
              color: cs.onSurface.withValues(alpha: 0.5)),
        ),
        actions: [
          _isSaving
              ? const Padding(
                  padding: EdgeInsets.all(16),
                  child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2)))
              : TextButton.icon(
                  onPressed: _saveData,
                  icon: const Icon(Icons.check, size: 18),
                  label: const Text('SALVAR'),
                  style: TextButton.styleFrom(
                    foregroundColor: brandGreen,
                    textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── ID + status
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    'OS #${widget.os.id.substring(0, 8).toUpperCase()}',
                    style: GoogleFonts.outfit(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: cs.onSurface),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(_statusAtual).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(
                        color: _getStatusColor(_statusAtual).withValues(alpha: 0.5)),
                  ),
                  child: Text(
                    _statusAtual.label.toUpperCase(),
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: _getStatusColor(_statusAtual)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ── Botão chat com cliente
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => AdminChatConversationScreen(
                      clienteId: widget.os.clienteId,
                      clienteNome: widget.os.clienteNome ?? 'Cliente',
                      clienteTelefone: widget.os.clienteTelefone,
                    ),
                  ),
                ),
                icon: const Icon(Icons.chat_outlined),
                label: const Text('VER CONVERSA COM CLIENTE'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brandGreen,
                  foregroundColor: AppColors.brandTealDeep,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  textStyle: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // ── Seção Orçamento (editável quando aguardando revisão)
            if (_isPendingReview) ...[
              _SectionHeader(title: 'Orçamento da Proposta'),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: isDark
                      ? AppColors.brandGreenDark.withValues(alpha: 0.15)
                      : AppColors.successLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                      color: AppColors.brandGreen.withValues(alpha: 0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Edite o valor e prazo antes de aprovar:',
                      style: GoogleFonts.outfit(
                          fontSize: 12,
                          color: cs.onSurface.withValues(alpha: 0.6)),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _totalCtrl,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            decoration: InputDecoration(
                              labelText: 'Valor Total (R\$)',
                              labelStyle: const TextStyle(fontSize: 13),
                              prefixText: 'R\$ ',
                              fillColor: cs.surfaceContainerHighest,
                              filled: true,
                              border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8)),
                              enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: _prazoCtrl,
                            decoration: InputDecoration(
                              labelText: 'Prazo de entrega',
                              labelStyle: const TextStyle(fontSize: 13),
                              hintText: '3 dias úteis',
                              fillColor: cs.surfaceContainerHighest,
                              filled: true,
                              border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8)),
                              enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              // Spec requisitos do cliente (leitura rápida)
              _buildRequisitosList(cs),
              const SizedBox(height: 24),
              // Botões Aprovar / Recusar
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _isApproving || _isRejecting ? null : _aprovar,
                      icon: _isApproving
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.check_circle_outline),
                      label: const Text('APROVAR'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.brandGreen,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        textStyle: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _isApproving || _isRejecting ? null : _rejeitar,
                      icon: _isRejecting
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.cancel_outlined),
                      label: const Text('RECUSAR'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        textStyle: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Aprovar envia o orçamento ao cliente via WhatsApp.\nRecusar cancela ou escala a sessão para atendimento humano.',
                style: GoogleFonts.outfit(
                    fontSize: 11, color: cs.onSurface.withValues(alpha: 0.5)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
            ],

            // ── Informações gerais
            _SectionHeader(title: 'Informações Gerais'),
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
                  _InfoRow(label: 'Produto', value: widget.os.produtoResumo),
                  const Divider(height: 24),
                  _InfoRow(
                      label: 'Cliente',
                      value: widget.os.clienteNome ?? 'Não informado'),
                  _InfoRow(
                      label: 'Telefone',
                      value: widget.os.clienteTelefone ?? 'Não informado'),
                  const Divider(height: 24),
                  _InfoRow(
                    label: 'Entrega',
                    value: widget.os.especificacoes['opcaoEntrega'] == 'entrega'
                        ? 'Entrega em casa'
                        : 'Retirada na loja',
                  ),
                  if (widget.os.especificacoes['opcaoEntrega'] == 'entrega') ...[
                    _InfoRow(
                      label: 'Endereço',
                      value: widget.os.especificacoes['enderecoEntrega'] ??
                          widget.os.clienteEnderecoCompleto ??
                          'Não informado',
                    ),
                  ],
                  const Divider(height: 24),
                  _InfoRow(
                      label: 'Criado em',
                      value: dateFormat.format(widget.os.criadoEm)),
                  _InfoRow(
                      label: 'Atualizado',
                      value: dateFormat.format(widget.os.atualizadoEm)),
                  if (widget.os.durationSeconds > 0) ...[
                    const Divider(height: 24),
                    _InfoRow(
                        label: 'Tempo produção',
                        value: widget.os.durationFormatted),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 40),
            _SectionHeader(title: 'Arte do Cliente'),
            const SizedBox(height: 16),
            TextField(
              controller: _artUrlController,
              decoration: InputDecoration(
                labelText: 'URL da Arte (Google Drive / Dropbox)',
                labelStyle: const TextStyle(fontSize: 13, color: AppColors.steel),
                prefixIcon: const Icon(Icons.link, size: 20),
                fillColor: cs.surfaceContainerHighest,
                filled: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                enabledBorder:
                    OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),

            const SizedBox(height: 40),
            _SectionHeader(title: 'Detalhes do Pedido'),
            const SizedBox(height: 16),
            _buildDetalhesPedido(cs),

            const SizedBox(height: 40),
            _SectionHeader(title: 'Observações Internas'),
            const SizedBox(height: 16),
            TextField(
              controller: _obsController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'Notas privadas para a equipe de produção…',
                fillColor: cs.surfaceContainerHighest,
                filled: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                enabledBorder:
                    OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),

            if (widget.os.mensagemSugerida != null &&
                widget.os.mensagemSugerida!.isNotEmpty) ...[
              const SizedBox(height: 40),
              _SectionHeader(title: 'Resposta Sugerida pela IA'),
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: isDark
                      ? AppColors.brandGreenDark.withValues(alpha: 0.25)
                      : AppColors.successLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                      color: AppColors.brandGreen.withValues(alpha: 0.3)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.auto_awesome,
                        color: AppColors.brandGreenDark, size: 20),
                    const SizedBox(width: 16),
                    Expanded(
                      child: SelectableText(
                        widget.os.mensagemSugerida!,
                        style: GoogleFonts.outfit(
                            color: cs.onSurface, fontSize: 15, height: 1.5),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // Botão geral de Cancelar OS
            if (widget.os.status != StatusOS.cancelada && widget.os.status != StatusOS.entregue) ...[
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: _isSaving ? null : () async {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Confirmar Cancelamento'),
                        content: const Text('Tem certeza que deseja cancelar esta Ordem de Serviço?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context, false),
                            child: const Text('Voltar'),
                          ),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
                            onPressed: () => Navigator.pop(context, true),
                            child: const Text('Cancelar Pedido'),
                          ),
                        ],
                      ),
                    );

                    if (confirm != true) return;

                    setState(() => _isSaving = true);
                    try {
                      await OsService().updateStatus(widget.os.id, StatusOS.cancelada);
                      if (context.mounted) {
                        SnackbarUtil.showSuccess(context, 'Ordem de serviço cancelada com sucesso!');
                        Navigator.maybePop(context);
                      }
                    } catch (e) {
                      if (context.mounted) {
                        SnackbarUtil.showError(context, 'Erro ao cancelar ordem de serviço: $e');
                      }
                    } finally {
                      if (context.mounted) setState(() => _isSaving = false);
                    }
                  },
                  icon: const Icon(Icons.cancel, color: Colors.red),
                  label: const Text('CANCELAR ORDEM DE SERVIÇO', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.red),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],

            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }

  /// Renderiza os campos do `especificacoes` em formato chave-valor amigável,
  /// expandindo `requisitos` (specs coletadas pelo agente) como pares pergunta→resposta.
  Widget _buildDetalhesPedido(ColorScheme cs) {
    const keysParaIgnorar = {
      'requisitos',
      'orcamento',
      'arte_url',
      'opcaoEntrega',
      'enderecoEntrega',
      'referenciaEntrega',
    };

    final entries = <MapEntry<String, dynamic>>[];

    // Expande requisitos (pergunta → resposta) antes dos demais campos
    final requisitos = widget.os.especificacoes['requisitos'];
    if (requisitos is List) {
      for (final r in requisitos) {
        if (r is Map && r['pergunta'] != null) {
          entries.add(MapEntry(r['pergunta'] as String, r['resposta'] ?? '—'));
        }
      }
    }

    // Demais campos, excluindo os já exibidos em outras seções
    entries.addAll(
      widget.os.especificacoes.entries
          .where((e) => !keysParaIgnorar.contains(e.key))
          .toList(),
    );

    if (entries.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: cs.outline),
        ),
        child: Text(
          'Sem detalhes adicionais.',
          style: TextStyle(
              fontSize: 12, color: cs.onSurface.withValues(alpha: 0.5)),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: entries.map((e) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 130,
                  child: Text(
                    _humanLabel(e.key),
                    style: TextStyle(
                      fontSize: 12,
                      color: cs.onSurface.withValues(alpha: 0.55),
                    ),
                  ),
                ),
                Expanded(
                  child: Text(
                    _humanValue(e.value),
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: cs.onSurface,
                    ),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildRequisitosList(ColorScheme cs) {
    final requisitos = widget.os.especificacoes['requisitos'];
    if (requisitos == null) return const SizedBox.shrink();

    List<Map<String, dynamic>> reqs = [];
    if (requisitos is List) {
      reqs = requisitos
          .whereType<Map>()
          .map((r) => Map<String, dynamic>.from(r))
          .toList();
    }
    if (reqs.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Especificações do pedido',
              style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: cs.onSurface.withValues(alpha: 0.5),
                  letterSpacing: 0.5)),
          const SizedBox(height: 10),
          ...reqs.map((r) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 2,
                      child: Text(
                        '${r['pergunta'] ?? ''}',
                        style: TextStyle(
                            fontSize: 12,
                            color: cs.onSurface.withValues(alpha: 0.55)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 3,
                      child: Text(
                        '${r['resposta'] ?? '—'}',
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: cs.onSurface),
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Color _getStatusColor(StatusOS status) {
    switch (status) {
      case StatusOS.aguardandoOrcamento:
        return AppColors.orange;
      case StatusOS.aprovado:
        return AppColors.brandGreen;
      case StatusOS.emProducao:
        return AppColors.purple;
      case StatusOS.prontaParaRetirada:
        return AppColors.brandGreen;
      case StatusOS.entregue:
        return AppColors.steel;
      case StatusOS.cancelada:
        return Colors.red;
      default:
        return AppColors.brandTeal;
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
      style: GoogleFonts.outfit(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
        letterSpacing: 0.5,
      ),
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
              style: TextStyle(
                fontWeight: FontWeight.w500,
                color: Theme.of(context)
                    .colorScheme
                    .onSurface
                    .withValues(alpha: 0.55),
                fontSize: 13,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Theme.of(context).colorScheme.onSurface,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
