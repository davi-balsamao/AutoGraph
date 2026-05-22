// ChatScreen — Conversa com o agente (03 · Conversa com agente)
//
// WhatsApp-like com CHAT_SCRIPT animado (7 eventos + replay automático).
// Referência: ClaudeDesign/components/app-screens-b.jsx → ChatScreen
//
// Tokens: paleta WhatsApp (#efeae2 light / #0b141a dark)
// Animação: Future.delayed sequencial + TypingIndicator entre mensagens

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/widgets/ag_logo.dart';
import 'widgets/chat_bubble.dart';
import 'widgets/typing_indicator.dart';
import 'widgets/quote_card.dart';
import 'widgets/proof_card.dart';
import 'widgets/composer_bar.dart';
import '../../../core/services/os_service.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/models/ordem_servico.dart';

// ─── Modelo de evento do script ──────────────────────────────────
enum _ChatEventType { outgoing, incoming, typing, quote, proof }

class _ChatEvent {
  final _ChatEventType type;
  final String? text;
  final String? time;
  final int? delayMs;
  final String? quoteId;
  final double? quoteValue;

  const _ChatEvent.outgoing(this.text, this.time)
      : type = _ChatEventType.outgoing,
        delayMs = null, quoteId = null, quoteValue = null;

  const _ChatEvent.incoming(this.text, this.time)
      : type = _ChatEventType.incoming,
        delayMs = null, quoteId = null, quoteValue = null;

  const _ChatEvent.typing(this.delayMs)
      : type = _ChatEventType.typing,
        text = null, time = null, quoteId = null, quoteValue = null;

  const _ChatEvent.quote(this.quoteId, this.quoteValue, this.time)
      : type = _ChatEventType.quote,
        text = null, delayMs = null;

  const _ChatEvent.proof(this.time)
      : type = _ChatEventType.proof,
        text = null, delayMs = null, quoteId = null, quoteValue = null;
}

// ─── Script da conversa ───────────────────────────────────────────
const _script = [
  _ChatEvent.outgoing('oi, queria 1000 panfletos pro evento de sábado', '14:32'),
  _ChatEvent.typing(700),
  _ChatEvent.incoming('Boa tarde, Mariana! 👋 Aqui é o agente da Autograph. 1.000 panfletos pro sábado dá tempo sim.', '14:32'),
  _ChatEvent.incoming('Pra fechar o orçamento:\n• Tamanho A6, A5 ou A4?\n• Frente só ou frente e verso?\n• Couché brilho 115g está ótimo pra panfleto, manda esse?', '14:32'),
  _ChatEvent.outgoing('A5 frente e verso, couché tá bom 👍', '14:33'),
  _ChatEvent.typing(800),
  _ChatEvent.quote('A-2847', 189.0, '14:33'),
  _ChatEvent.outgoing('fechado 💚 já te mando a arte', '14:34'),
  _ChatEvent.typing(700),
  _ChatEvent.proof('14:34'),
];

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _scrollCtrl = ScrollController();
  final _msgCtrl = TextEditingController();
  final List<_ChatEvent> _visible = [];
  bool _typing = false;
  bool _running = false;

  @override
  void initState() {
    super.initState();
    _startScript();
  }

  Future<void> _startScript() async {
    if (_running) return;
    _running = true;

    // Pausa inicial antes de começar
    await Future.delayed(const Duration(seconds: 1));

    for (final event in _script) {
      if (!mounted) return;

      if (event.type == _ChatEventType.typing) {
        setState(() => _typing = true);
        await Future.delayed(Duration(milliseconds: event.delayMs!));
        if (!mounted) return;
        setState(() => _typing = false);
      } else {
        setState(() => _visible.add(event));
        await Future.delayed(const Duration(milliseconds: 500));
      }
      _scrollToBottom();
    }

    // Replay após 8 segundos
    await Future.delayed(const Duration(seconds: 8));
    if (mounted) {
      setState(() => _visible.clear());
      _running = false;
      _startScript();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _sendMessage() {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty) return;
    _msgCtrl.clear();
    final now = DateTime.now();
    final time =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
    setState(() => _visible.add(_ChatEvent.outgoing(text, time)));
    _scrollToBottom();
  }

  Future<void> _handleQuoteAction(String quoteId, bool approved) async {
    final client = AuthService().currentUser;
    if (client == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Você precisa estar logado.')),
      );
      return;
    }

    try {
      final items = await OsService().fetchOrdensServico();
      final clientOrders = items.where((o) => o.clienteId == client.id).toList();
      if (clientOrders.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Nenhuma ordem de serviço encontrada para este cliente.')),
          );
        }
        return;
      }

      clientOrders.sort((a, b) => b.criadoEm.compareTo(a.criadoEm));
      final latest = clientOrders.first;

      final targetStatus = approved ? StatusOS.aprovado : StatusOS.cancelada;
      await OsService().updateStatus(latest.id, targetStatus);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              approved
                  ? 'Orçamento aprovado! O pedido foi enviado para produção.'
                  : 'Orçamento recusado. O pedido foi cancelado.',
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao atualizar orçamento: $e')),
        );
      }
    }
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    _msgCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final chatBg = isDark ? const Color(0xFF0B141A) : const Color(0xFFEFEAE2);
    final headerBg = isDark ? const Color(0xFF1F2C33) : AGColors.brandTealDeep;

    return Scaffold(
      body: Column(
        children: [
          // ── AppBar teal estilo WhatsApp
          Container(
            color: headerBg,
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 8,
              bottom: 12,
              left: 8,
              right: 12,
            ),
            child: Row(
              children: [
                // Avatar do agente
                Container(
                  width: 36, height: 36,
                  decoration: const BoxDecoration(
                    color: AGColors.brandGreen,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: AGLogoMark(
                      size: 22,
                      bg: AGColors.brandTealDeep,
                      stroke: AGColors.brandGreen,
                    ),
                  ),
                ),
                const SizedBox(width: 10),

                // Título + status
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            'Autograph',
                            style: GoogleFonts.inter(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.verified,
                              size: 14, color: AGColors.brandGreen),
                        ],
                      ),
                      Text(
                        'agente automático · responde em segundos',
                        style: GoogleFonts.inter(
                            fontSize: 11, color: AGColors.muted),
                      ),
                    ],
                  ),
                ),

                const Icon(Icons.more_vert_rounded,
                    color: Colors.white54, size: 20),
              ],
            ),
          ),

          // ── Área de mensagens
          Expanded(
            child: Container(
              color: chatBg,
              child: ListView.builder(
                controller: _scrollCtrl,
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                itemCount: _visible.length + (_typing ? 1 : 0),
                itemBuilder: (ctx, i) {
                  if (_typing && i == _visible.length) {
                    return TypingIndicator(isDark: isDark);
                  }

                  final event = _visible[i];
                  return switch (event.type) {
                    _ChatEventType.outgoing => ChatBubble(
                        text: event.text!,
                        outgoing: true,
                        time: event.time!,
                        isDark: isDark,
                      ),
                    _ChatEventType.incoming => ChatBubble(
                        text: event.text!,
                        outgoing: false,
                        time: event.time!,
                        isDark: isDark,
                      ),
                    _ChatEventType.quote => QuoteCard(
                        id: event.quoteId!,
                        value: event.quoteValue!,
                        time: event.time!,
                        isDark: isDark,
                        onApprove: () => _handleQuoteAction(event.quoteId!, true),
                        onReject: () => _handleQuoteAction(event.quoteId!, false),
                      ),
                    _ChatEventType.proof => ProofCard(
                        time: event.time!,
                        isDark: isDark,
                      ),
                    _ => const SizedBox.shrink(),
                  };
                },
              ),
            ),
          ),

          // ── Composer
          ComposerBar(
            controller: _msgCtrl,
            onSend: _sendMessage,
            isDark: isDark,
          ),
        ],
      ),
    );
  }
}
