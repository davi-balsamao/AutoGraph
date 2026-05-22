// AdminChatListScreen — Lista de conversas do atendimento (admin mobile)
//
// Referência: ClaudeDesign/components/admin-mobile-screens-a.jsx → AdmMobileChat

import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import '../../../core/theme/ag_tokens.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/chat_service.dart';
import '../../../core/widgets/ag_theme_toggle.dart';
import 'admin_chat_conversation_screen.dart';

class _ConversaItem {
  final String clienteId;
  final String sessaoId;
  final String clienteNome;
  final String clienteTelefone;
  final String? ultimaMensagem;
  final DateTime ultimaMensagemEm;
  final bool atendimentoHumano;
  final String estadoAtual;

  const _ConversaItem({
    required this.clienteId,
    required this.sessaoId,
    required this.clienteNome,
    required this.clienteTelefone,
    this.ultimaMensagem,
    required this.ultimaMensagemEm,
    required this.atendimentoHumano,
    required this.estadoAtual,
  });

  factory _ConversaItem.fromJson(Map<String, dynamic> json) {
    return _ConversaItem(
      clienteId: json['clienteId'] as String,
      sessaoId: json['sessaoId'] as String,
      clienteNome: json['clienteNome'] as String? ?? 'Desconhecido',
      clienteTelefone: json['clienteTelefone'] as String? ?? '',
      ultimaMensagem: json['ultimaMensagem'] as String?,
      ultimaMensagemEm: json['ultimaMensagemEm'] != null
          ? DateTime.parse(json['ultimaMensagemEm'] as String)
          : DateTime.now(),
      atendimentoHumano: json['atendimentoHumano'] as bool? ?? false,
      estadoAtual: json['estadoAtual'] as String? ?? '',
    );
  }

  String get initials {
    final parts = clienteNome.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return clienteNome.isNotEmpty ? clienteNome[0].toUpperCase() : '?';
  }
}

class AdminChatListScreen extends StatefulWidget {
  const AdminChatListScreen({super.key});

  @override
  State<AdminChatListScreen> createState() => _AdminChatListScreenState();
}

class _AdminChatListScreenState extends State<AdminChatListScreen> {
  int _tabIndex = 0;
  List<_ConversaItem> _convs = [];
  bool _loading = true;
  StreamSubscription? _convSub;

  static const _tabLabels = ['Todas', 'Humano', 'Agente'];

  List<_ConversaItem> get _filtered {
    if (_tabIndex == 1) return _convs.where((c) => c.atendimentoHumano).toList();
    if (_tabIndex == 2) return _convs.where((c) => !c.atendimentoHumano).toList();
    return _convs;
  }

  int get _totalCount => _convs.length;
  int get _humanoCount => _convs.where((c) => c.atendimentoHumano).length;
  int get _agenteCount => _convs.where((c) => !c.atendimentoHumano).length;

  @override
  void initState() {
    super.initState();
    _load();
    _convSub = ChatService().conversaEventStream.listen((_) => _load());
  }

  @override
  void dispose() {
    _convSub?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final res = await http.get(
        Uri.parse('${AuthService().baseUrl}/conversas'),
        headers: AuthService().authHeaders,
      );
      if (res.statusCode == 200 && mounted) {
        final List<dynamic> data = jsonDecode(res.body);
        setState(() {
          _convs = data.map((e) => _ConversaItem.fromJson(Map<String, dynamic>.from(e))).toList();
          _loading = false;
        });
      } else if (mounted) {
        setState(() => _loading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _formatTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'agora';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return 'ontem';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.bgDarkDeep : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairlineSoft;
    final surfaceBg = isDark ? AGColors.surfaceDark : AGColors.surfaceSoft;
    final tabCounts = [_totalCount, _humanoCount, _agenteCount];

    return Scaffold(
      backgroundColor: bg,
      body: Column(
        children: [
          SafeArea(
            bottom: false,
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 16, 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Atendimento',
                                style: GoogleFonts.inter(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w600,
                                  color: textColor,
                                  letterSpacing: -0.3,
                                )),
                            Text(
                              '$_totalCount ativas · $_humanoCount com humano',
                              style: GoogleFonts.inter(fontSize: 11, color: mutedColor),
                            ),
                          ],
                        ),
                      ),
                      const ThemeToggleIcon(size: 36),
                      const SizedBox(width: 8),
                      Icon(Icons.search_rounded, color: mutedColor, size: 20),
                    ],
                  ),
                ),

                Container(
                  decoration: BoxDecoration(
                    color: surfaceBg,
                    border: Border(bottom: BorderSide(color: borderColor)),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: List.generate(3, (i) {
                        final isActive = i == _tabIndex;
                        return GestureDetector(
                          onTap: () => setState(() => _tabIndex = i),
                          child: Container(
                            margin: const EdgeInsets.only(right: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: isActive ? AGColors.brandTealDeep : Colors.transparent,
                              borderRadius: BorderRadius.circular(AGRadius.full),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  _tabLabels[i],
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: isActive ? Colors.white : mutedColor,
                                  ),
                                ),
                                const SizedBox(width: 5),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: isActive
                                        ? Colors.white.withValues(alpha: 0.15)
                                        : borderColor,
                                    borderRadius: BorderRadius.circular(AGRadius.full),
                                  ),
                                  child: Text(
                                    '${tabCounts[i]}',
                                    style: GoogleFonts.inter(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color: isActive ? Colors.white : mutedColor,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                    ),
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AGColors.brandGreen))
                : _filtered.isEmpty
                    ? Center(
                        child: Text(
                          'Nenhuma conversa ativa',
                          style: GoogleFonts.inter(fontSize: 14, color: AGColors.stone),
                        ),
                      )
                    : ListView.separated(
                        padding: EdgeInsets.only(
                            bottom: 100 + MediaQuery.of(context).padding.bottom),
                        itemCount: _filtered.length,
                        separatorBuilder: (_, _) => Divider(height: 1, color: borderColor),
                        itemBuilder: (ctx, i) {
                          final c = _filtered[i];
                          return _ConvTile(
                            conv: c,
                            isDark: isDark,
                            textColor: textColor,
                            mutedColor: mutedColor,
                            bg: bg,
                            timeLabel: _formatTime(c.ultimaMensagemEm),
                            onTap: () => Navigator.push(
                              ctx,
                              MaterialPageRoute(
                                builder: (_) => AdminChatConversationScreen(
                                  clienteNome: c.clienteNome,
                                  clienteId: c.clienteId,
                                  clienteTelefone: c.clienteTelefone,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

class _ConvTile extends StatelessWidget {
  final _ConversaItem conv;
  final bool isDark;
  final Color textColor, mutedColor, bg;
  final String timeLabel;
  final VoidCallback onTap;

  const _ConvTile({
    required this.conv,
    required this.isDark,
    required this.textColor,
    required this.mutedColor,
    required this.bg,
    required this.timeLabel,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        color: bg,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: isDark
                    ? AGColors.surfaceDark
                    : AGColors.brandGreen.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  conv.initials,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: isDark ? AGColors.brandGreen : AGColors.brandGreenDark,
                  ),
                ),
              ),
            ),

            const SizedBox(width: 12),

            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(conv.clienteNome,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: textColor,
                          )),
                      const Spacer(),
                      Text(timeLabel,
                          style: GoogleFonts.inter(fontSize: 11, color: mutedColor)),
                    ],
                  ),

                  const SizedBox(height: 3),

                  Text(
                    conv.ultimaMensagem ?? 'Sem mensagens',
                    style: GoogleFonts.inter(fontSize: 12, color: mutedColor),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),

                  if (conv.atendimentoHumano) ...[
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                      decoration: BoxDecoration(
                        color: AGColors.warningBg,
                        borderRadius: BorderRadius.circular(3),
                      ),
                      child: Text(
                        'HUMANO',
                        style: GoogleFonts.inter(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: AGColors.warningText,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
