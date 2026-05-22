// AdminUsersScreen — Usuários do admin (mobile)
//
// Referência: ClaudeDesign/components/admin-mobile-screens-b.jsx → AdmMobileUsers
// Reutiliza: AuthService().fetchUsers() existente

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/models/user_model.dart';
import '../../../core/widgets/ag_theme_toggle.dart';
import '../shared/adm_badge.dart';
import 'admin_user_edit_sheet.dart';

class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({super.key});

  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  List<UserModel> _users = [];
  bool _loading = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final users = await AuthService().fetchUsers();
      if (mounted) setState(() { _users = users; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<UserModel> get _filtered {
    final list = _search.isEmpty
        ? _users.where((u) => u.isCliente).toList()
        : _users
            .where((u) =>
                u.isCliente &&
                (u.nome.toLowerCase().contains(_search.toLowerCase()) ||
                 (u.telefone.contains(_search))))
            .toList();
    list.sort((a, b) => b.ltv.compareTo(a.ltv));
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.bgDarkDeep : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;
    final surfaceBg = isDark ? AGColors.surfaceDark : AGColors.surfaceSoft;
    final searchBorder = isDark ? AGColors.hairlineDarkStr : AGColors.hairlineStrong;

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: bg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_rounded, color: textColor),
          onPressed: () => Navigator.maybePop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Usuários',
                style: GoogleFonts.inter(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    color: textColor)),
            Text('${_filtered.length} cadastrados',
                style: GoogleFonts.inter(fontSize: 11, color: mutedColor)),
          ],
        ),
        actions: [
          const ThemeToggleIcon(size: 36),
          Container(
            margin: const EdgeInsets.only(right: 12, left: 4),
            width: 32, height: 32,
            decoration: const BoxDecoration(
              color: AGColors.brandGreen,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.add_rounded,
                color: AGColors.onPrimary, size: 18),
          ),
        ],
      ),
      body: Column(
        children: [
          // KPI row
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: Row(
              children: [
                _KpiChip('CLIENTES', '${_users.where((u) => u.isCliente).length}',
                    AGColors.brandGreenMid, textColor, borderColor, surfaceBg),
                const SizedBox(width: 8),
                _KpiChip('EQUIPE', '${_users.where((u) => !u.isCliente).length}',
                    AGColors.accentBlue, textColor, borderColor, surfaceBg),
              ],
            ),
          ),

          // Search
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: Container(
              height: 40,
              decoration: BoxDecoration(
                color: surfaceBg,
                borderRadius: BorderRadius.circular(AGRadius.md + 2),
                border: Border.all(color: searchBorder),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                children: [
                  Icon(Icons.search_rounded, size: 16, color: AGColors.stone),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      onChanged: (v) => setState(() => _search = v),
                      style: GoogleFonts.inter(fontSize: 14, color: textColor),
                      decoration: InputDecoration(
                        hintText: 'Buscar cliente, telefone…',
                        hintStyle: GoogleFonts.inter(
                            fontSize: 14, color: AGColors.stone),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                  ),
                  Text('Ordenar: LTV ↓',
                      style: GoogleFonts.inter(
                          fontSize: 11, color: AGColors.stone)),
                ],
              ),
            ),
          ),

          // Lista
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(
                        color: AGColors.brandGreen))
                : ListView.separated(
                    padding: EdgeInsets.only(
                      left: 16, right: 16,
                      bottom: 40 + MediaQuery.of(context).padding.bottom,
                    ),
                    itemCount: _filtered.length,
                    separatorBuilder: (_, i) =>
                        Divider(height: 1, color: borderColor),
                    itemBuilder: (ctx, i) {
                      final u = _filtered[i];
                      return GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: () => AdminUserEditSheet.show(context, u, _load),
                        child: _UserTile(
                          user: u,
                          textColor: textColor,
                          mutedColor: mutedColor,
                          isDark: isDark,
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

class _KpiChip extends StatelessWidget {
  final String label, value;
  final Color accent, textColor, borderColor, bg;

  const _KpiChip(this.label, this.value, this.accent,
      this.textColor, this.borderColor, this.bg);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(AGRadius.md),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          children: [
            Container(
              width: 6, height: 6,
              decoration: BoxDecoration(
                  color: accent, shape: BoxShape.circle),
            ),
            const SizedBox(height: 4),
            Text(value,
                style: GoogleFonts.inter(
                    fontSize: 16, fontWeight: FontWeight.w700,
                    color: textColor)),
            Text(label,
                style: GoogleFonts.inter(
                    fontSize: 9, color: AGColors.stone,
                    fontWeight: FontWeight.w600, letterSpacing: 0.3)),
          ],
        ),
      ),
    );
  }
}

class _UserTile extends StatelessWidget {
  final UserModel user;
  final Color textColor, mutedColor;
  final bool isDark;

  const _UserTile({
    required this.user, required this.textColor,
    required this.mutedColor, required this.isDark,
  });

  // Cor do avatar baseada na inicial
  static const _avatarColors = [
    AGColors.accentPurple, AGColors.accentBlue,
    AGColors.accentOrange, AGColors.brandGreenMid,
  ];

  @override
  Widget build(BuildContext context) {
    final inicial = user.nome.isNotEmpty ? user.nome[0].toUpperCase() : '?';
    final avatarColor = _avatarColors[user.nome.codeUnitAt(0) % 4];

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: avatarColor.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(inicial,
                  style: GoogleFonts.inter(
                    fontSize: 14, fontWeight: FontWeight.w700,
                    color: avatarColor,
                  )),
            ),
          ),

          const SizedBox(width: 12),

          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(user.nome,
                        style: GoogleFonts.inter(
                          fontSize: 14, fontWeight: FontWeight.w600,
                          color: textColor,
                        )),
                    if (user.atendimentoHumano) ...[
                      const SizedBox(width: 6),
                      AdmBadge('HUMANO', AdmBadgeStyle.orange),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                Text(user.telefone,
                    style: GoogleFonts.inter(
                        fontSize: 12, color: mutedColor)),
                const SizedBox(height: 2),
                Text('R\$ ${user.ltv.toStringAsFixed(2).replaceAll('.', ',')}',
                    style: GoogleFonts.inter(
                      fontSize: 12, fontWeight: FontWeight.w600,
                      color: isDark
                          ? AGColors.brandGreen
                          : AGColors.brandGreenDark,
                    )),
              ],
            ),
          ),

          // WhatsApp btn
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
              color: const Color(0xFF25D366).withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.chat_rounded,
                size: 16, color: Color(0xFF25D366)),
          ),
        ],
      ),
    );
  }
}
