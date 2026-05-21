// AdminChatListScreen — Lista de conversas do atendimento (admin mobile)
//
// Referência: ClaudeDesign/components/admin-mobile-screens-a.jsx → AdmMobileChat
//
// Reutiliza: ChatService() existente para buscar conversas escaladas

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import 'admin_chat_conversation_screen.dart';

class AdminChatListScreen extends StatefulWidget {
  const AdminChatListScreen({super.key});

  @override
  State<AdminChatListScreen> createState() => _AdminChatListScreenState();
}

class _AdminChatListScreenState extends State<AdminChatListScreen> {
  int _tabIndex = 0;

  // Dados mockados — substitua por ChatService().getConversations()
  static final _conversations = [
    _Conv('Mariana Costa', 'MC', 'já te mando a arte', 'agora', 0, false, false),
    _Conv('Eventos Lume', 'EL', 'Posso fazer 3×2m? Qual o preço?', '2 min', 2, true, false),
    _Conv('Café Trilho', 'CT', '[agente] Orçamento enviado - R\$ 124', '12 min', 0, false, false),
    _Conv('Studio Norte', 'SN', 'Tá errado, a cor da capa ficou...', '1h', 1, true, true),
    _Conv('Padaria Estrela', 'PE', '[agente] Pagamento confirmado', '2h', 0, false, false),
    _Conv('Clínica Anna', 'CA', 'Obrigada, gostamos de tudo!', '3h', 0, false, false),
    _Conv('Colégio Vértice', 'CV', '[agente] Prova digital enviada', 'ontem', 0, false, false),
  ];

  static const _tabLabels = ['Todas', 'Humano', 'Agente'];
  static const _tabCounts = [24, 3, 21];

  List<_Conv> get _filtered {
    if (_tabIndex == 1) return _conversations.where((c) => c.escalada).toList();
    if (_tabIndex == 2) return _conversations.where((c) => !c.escalada).toList();
    return _conversations;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.bgDarkDeep : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairlineSoft;
    final surfaceBg = isDark ? AGColors.surfaceDark : AGColors.surfaceSoft;

    return Scaffold(
      backgroundColor: bg,
      body: Column(
        children: [
          SafeArea(
            bottom: false,
            child: Column(
              children: [
                // Header
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
                              '${_tabCounts[0]} escaladas · ${_tabCounts[2]} com agente',
                              style: GoogleFonts.inter(
                                  fontSize: 11, color: mutedColor),
                            ),
                          ],
                        ),
                      ),
                      Icon(Icons.search_rounded, color: mutedColor, size: 20),
                    ],
                  ),
                ),

                // Tabs Todas / Humano / Agente
                Container(
                  decoration: BoxDecoration(
                    color: surfaceBg,
                    border: Border(bottom: BorderSide(color: borderColor)),
                  ),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 6),
                  child: Row(
                    children: List.generate(3, (i) {
                      final isActive = i == _tabIndex;
                      return GestureDetector(
                        onTap: () => setState(() => _tabIndex = i),
                        child: Container(
                          margin: const EdgeInsets.only(right: 8),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: isActive
                                ? AGColors.brandTealDeep
                                : Colors.transparent,
                            borderRadius:
                                BorderRadius.circular(AGRadius.full),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                _tabLabels[i],
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: isActive
                                      ? Colors.white
                                      : mutedColor,
                                ),
                              ),
                              const SizedBox(width: 5),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 5, vertical: 1),
                                decoration: BoxDecoration(
                                  color: isActive
                                      ? Colors.white.withValues(alpha: 0.15)
                                      : borderColor,
                                  borderRadius:
                                      BorderRadius.circular(AGRadius.full),
                                ),
                                child: Text(
                                  '${_tabCounts[i]}',
                                  style: GoogleFonts.inter(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: isActive
                                        ? Colors.white
                                        : mutedColor,
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
              ],
            ),
          ),

          // Lista de conversas
          Expanded(
            child: ListView.separated(
              padding: EdgeInsets.only(
                bottom: 100 + MediaQuery.of(context).padding.bottom),
              itemCount: _filtered.length,
              separatorBuilder: (_, i) =>
                  Divider(height: 1, color: borderColor),
              itemBuilder: (ctx, i) {
                final c = _filtered[i];
                return _ConvTile(
                  conv: c,
                  isDark: isDark,
                  textColor: textColor,
                  mutedColor: mutedColor,
                  bg: bg,
                  onTap: () => Navigator.push(
                    ctx,
                    MaterialPageRoute(
                      builder: (_) => AdminChatConversationScreen(
                        clienteNome: c.nome,
                        clienteId: c.initials,
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

// ── Data model (mockado) ──────────────────────────────────────────
class _Conv {
  final String nome, initials, preview, time;
  final int unread;
  final bool escalada, urgente;

  const _Conv(this.nome, this.initials, this.preview, this.time,
      this.unread, this.escalada, this.urgente);
}

// ── Tile ──────────────────────────────────────────────────────────
class _ConvTile extends StatelessWidget {
  final _Conv conv;
  final bool isDark;
  final Color textColor, mutedColor, bg;
  final VoidCallback onTap;

  const _ConvTile({
    required this.conv, required this.isDark, required this.textColor,
    required this.mutedColor, required this.bg, required this.onTap,
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
            // Avatar
            Container(
              width: 40, height: 40,
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
                    color: isDark
                        ? AGColors.brandGreen
                        : AGColors.brandGreenDark,
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
                      Text(conv.nome,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: textColor,
                          )),
                      const Spacer(),
                      Text(conv.time,
                          style: GoogleFonts.inter(
                              fontSize: 11, color: mutedColor)),
                    ],
                  ),

                  const SizedBox(height: 3),

                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          conv.preview,
                          style: GoogleFonts.inter(
                              fontSize: 12, color: mutedColor),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (conv.unread > 0) ...[
                        const SizedBox(width: 8),
                        Container(
                          width: 18, height: 18,
                          decoration: const BoxDecoration(
                            color: AGColors.brandGreen,
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              '${conv.unread}',
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: AGColors.onPrimary,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),

                  if (conv.escalada) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 5, vertical: 2),
                          decoration: BoxDecoration(
                            color: conv.urgente
                                ? const Color(0xFFFFEBEB)
                                : AGColors.warningBg,
                            borderRadius: BorderRadius.circular(3),
                          ),
                          child: Text(
                            conv.urgente ? 'URGENTE' : 'ESCALADA',
                            style: GoogleFonts.inter(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              color: conv.urgente
                                  ? AGColors.danger
                                  : AGColors.warningText,
                            ),
                          ),
                        ),
                      ],
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
