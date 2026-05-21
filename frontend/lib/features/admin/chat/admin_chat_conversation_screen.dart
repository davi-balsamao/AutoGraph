// AdminChatConversationScreen — Conversa aberta do atendimento admin
//
// Referência: ClaudeDesign/components/admin-mobile-screens-c.jsx → AdmMobileChatConversation

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import '../../../core/theme/ag_tokens.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/chat_service.dart';
import '../../../core/models/chat_message.dart';

class AdminChatConversationScreen extends StatefulWidget {
  final String clienteNome;
  final String clienteId;
  final String? clienteTelefone;

  const AdminChatConversationScreen({
    super.key,
    required this.clienteNome,
    required this.clienteId,
    this.clienteTelefone,
  });

  @override
  State<AdminChatConversationScreen> createState() =>
      _AdminChatConversationScreenState();
}

class _AdminChatConversationScreenState
    extends State<AdminChatConversationScreen> {
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _loading = true;
  bool _atendimentoHumano = false;
  StreamSubscription<ChatMessage>? _msgSub;

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _msgSub = ChatService().messageStream.listen((msg) {
      final id = widget.clienteId;
      if (msg.senderId == id ||
          msg.receiverId == id ||
          msg.clienteDbId == id) {
        if (mounted) {
          setState(() => _messages.add(msg));
          _scrollToBottom();
        }
      }
    });
  }

  @override
  void dispose() {
    _msgSub?.cancel();
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadMessages() async {
    try {
      final msgs = await ChatService().getMessages(widget.clienteId);
      if (mounted) {
        setState(() {
          _messages
            ..clear()
            ..addAll(msgs);
          _loading = false;
        });
        _scrollToBottom();
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _assumir() async {
    try {
      await http.post(
        Uri.parse(
            '${AuthService().baseUrl}/conversas/${widget.clienteId}/assumir'),
        headers: AuthService().authHeaders,
      );
      if (mounted) setState(() => _atendimentoHumano = true);
    } catch (_) {}
  }

  Future<void> _devolverIa() async {
    try {
      await http.post(
        Uri.parse(
            '${AuthService().baseUrl}/conversas/${widget.clienteId}/devolver-ia'),
        headers: AuthService().authHeaders,
      );
      if (mounted) setState(() => _atendimentoHumano = false);
    } catch (_) {}
  }

  Future<void> _sendMessage() async {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty) return;
    _msgCtrl.clear();

    final user = AuthService().currentUser;
    final msg = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      senderId: user?.id ?? 'admin',
      receiverId: widget.clienteId,
      text: text,
      type: MessageType.text,
      timestamp: DateTime.now(),
      isFromRAG: false,
    );

    await ChatService().sendMessage(msg);
    _scrollToBottom();
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

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final headerBg = isDark ? const Color(0xFF1F2C33) : AGColors.brandTealDeep;
    final chatBg =
        isDark ? const Color(0xFF0B141A) : const Color(0xFFEFEAE2);
    final composerBg =
        isDark ? const Color(0xFF1F2C33) : const Color(0xFFF0F2F5);
    final composerInput = isDark ? const Color(0xFF2A3942) : Colors.white;

    final telefoneExibido = widget.clienteTelefone != null
        ? '+${widget.clienteTelefone}'
        : 'WhatsApp';

    return Scaffold(
      body: Column(
        children: [
          // ── Header teal
          Container(
            color: headerBg,
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 8,
              bottom: 12,
              left: 8,
              right: 12,
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_rounded,
                          color: Colors.white, size: 20),
                      onPressed: () => Navigator.maybePop(context),
                    ),
                    Container(
                      width: 36,
                      height: 36,
                      decoration: const BoxDecoration(
                        color: AGColors.brandGreen,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          widget.clienteNome.isNotEmpty
                              ? widget.clienteNome[0].toUpperCase()
                              : '?',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AGColors.onPrimary,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.clienteNome,
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                          Text(
                            telefoneExibido,
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

                // ── Barra admin: badge + botão Assumir/Devolver
                const SizedBox(height: 8),
                Row(
                  children: [
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(AGRadius.sm),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _atendimentoHumano ? '👤' : '🤖',
                            style: const TextStyle(fontSize: 11),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            _atendimentoHumano
                                ? 'VOCÊ RESPONDENDO'
                                : 'AGENTE RESPONDENDO',
                            style: GoogleFonts.inter(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.5,
                              color: AGColors.brandGreen,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                    GestureDetector(
                      onTap:
                          _atendimentoHumano ? _devolverIa : _assumir,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: _atendimentoHumano
                              ? AGColors.accentOrange
                              : AGColors.brandGreen,
                          borderRadius:
                              BorderRadius.circular(AGRadius.full),
                        ),
                        child: Text(
                          _atendimentoHumano ? 'Devolver IA' : 'Assumir',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AGColors.onPrimary,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                ),
              ],
            ),
          ),

          // ── Mensagens
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(
                        color: AGColors.brandGreen))
                : Container(
                    color: chatBg,
                    child: _messages.isEmpty
                        ? Center(
                            child: Text(
                              'Sem mensagens ainda',
                              style: GoogleFonts.inter(
                                  fontSize: 13, color: AGColors.stone),
                            ),
                          )
                        : ListView.builder(
                            controller: _scrollCtrl,
                            padding:
                                const EdgeInsets.fromLTRB(12, 10, 12, 10),
                            itemCount: _messages.length,
                            itemBuilder: (ctx, i) {
                              final m = _messages[i];
                              final isOut = m.isFromAdmin ||
                                  m.isFromRAG ||
                                  m.senderId ==
                                      AuthService().currentUser?.id;
                              return _AdminChatBubble(
                                message: m,
                                isOutgoing: isOut,
                                isDark: isDark,
                              );
                            },
                          ),
                  ),
          ),

          // ── Composer
          Container(
            color: composerBg,
            padding: EdgeInsets.only(
              left: 12,
              right: 12,
              top: 8,
              bottom: MediaQuery.of(context).padding.bottom + 8,
            ),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: composerInput,
                      borderRadius:
                          BorderRadius.circular(AGRadius.full),
                    ),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 10),
                    child: TextField(
                      controller: _msgCtrl,
                      style: GoogleFonts.inter(
                          fontSize: 14,
                          color: isDark ? AGColors.onDark : AGColors.ink),
                      decoration: InputDecoration(
                        hintText: 'Mensagem como atendente…',
                        hintStyle: GoogleFonts.inter(
                            fontSize: 14, color: AGColors.stone),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: _sendMessage,
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: const BoxDecoration(
                      color: AGColors.brandGreen,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.send_rounded,
                        color: AGColors.onPrimary, size: 18),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AdminChatBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isOutgoing;
  final bool isDark;

  const _AdminChatBubble({
    required this.message,
    required this.isOutgoing,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final bubbleIn =
        isDark ? const Color(0xFF202C33) : Colors.white;
    final bubbleOut =
        isDark ? const Color(0xFF005C4B) : const Color(0xFFD9FDD3);
    final textIn =
        isDark ? const Color(0xFFE9EDEF) : const Color(0xFF111B21);
    final metaColor = const Color(0xFF667781);

    final isAgent = message.isFromRAG;
    final bg = isAgent
        ? (isDark ? const Color(0xFF005C4B) : const Color(0xFFD9FDD3))
        : (isOutgoing ? bubbleOut : bubbleIn);
    final textColor = textIn;
    final align =
        isOutgoing ? CrossAxisAlignment.end : CrossAxisAlignment.start;
    final radius = isOutgoing
        ? const BorderRadius.only(
            topLeft: Radius.circular(10),
            topRight: Radius.circular(10),
            bottomLeft: Radius.circular(10),
            bottomRight: Radius.circular(2),
          )
        : const BorderRadius.only(
            topLeft: Radius.circular(2),
            topRight: Radius.circular(10),
            bottomLeft: Radius.circular(10),
            bottomRight: Radius.circular(10),
          );

    final hour =
        '${message.timestamp.hour.toString().padLeft(2, '0')}:${message.timestamp.minute.toString().padLeft(2, '0')}';

    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Column(
        crossAxisAlignment: align,
        children: [
          if (isAgent)
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 2),
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AGColors.brandGreen.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(3),
                ),
                child: Text(
                  '🤖 AGENTE',
                  style: GoogleFonts.inter(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: AGColors.brandGreenDark,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),

          Container(
            constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.72),
            padding: const EdgeInsets.fromLTRB(10, 8, 10, 6),
            decoration: BoxDecoration(color: bg, borderRadius: radius),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  message.text ?? '',
                  style:
                      GoogleFonts.inter(fontSize: 14, color: textColor),
                ),
                const SizedBox(height: 2),
                Text(hour,
                    style:
                        GoogleFonts.inter(fontSize: 10, color: metaColor)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
