// AdminMoreScreen — Mais / Configurações do admin (mobile)
//
// Referência: ClaudeDesign/components/admin-mobile-screens-c.jsx → AdmMobileMore

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/widgets/ag_theme_toggle.dart';
import '../finance/admin_finance_screen.dart';
import '../catalog/admin_catalog_screen.dart';
import '../users/admin_users_screen.dart';

class AdminMoreScreen extends StatelessWidget {
  const AdminMoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.bgDarkDeep : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final cardBg = isDark ? AGColors.canvasDark : AGColors.canvas;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;

    final user = AuthService().currentUser;
    final nome = user?.nome ?? 'Admin';
    final email = user?.email ?? '';
    final inicial = nome.isNotEmpty ? nome[0].toUpperCase() : 'A';

    return Scaffold(
      backgroundColor: bg,
      body: ListView(
        padding: EdgeInsets.only(
          bottom: 100 + MediaQuery.of(context).padding.bottom,
        ),
        children: [
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Mais',
                      style: GoogleFonts.inter(
                        fontSize: 17, fontWeight: FontWeight.w600,
                        color: textColor, letterSpacing: -0.3,
                      )),
                  Text('Outras áreas e configurações',
                      style: GoogleFonts.inter(
                          fontSize: 11, color: mutedColor)),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),

          // ── Profile card dark
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AGColors.surfaceDark : AGColors.brandTealDeep,
                borderRadius: BorderRadius.circular(AGRadius.xl - 4),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44, height: 44,
                    decoration: const BoxDecoration(
                      color: AGColors.brandGreen,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(inicial,
                          style: GoogleFonts.inter(
                            fontSize: 18, fontWeight: FontWeight.w700,
                            color: AGColors.onPrimary,
                          )),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(nome,
                            style: GoogleFonts.inter(
                              fontSize: 15, fontWeight: FontWeight.w600,
                              color: Colors.white,
                            )),
                        Text(
                          email.isNotEmpty
                              ? 'Gerente · $email'
                              : 'Gerente',
                          style: GoogleFonts.inter(
                              fontSize: 12, color: AGColors.muted),
                        ),
                      ],
                    ),
                  ),
                  Row(
                    children: [
                      Container(
                        width: 7, height: 7,
                        decoration: const BoxDecoration(
                          color: AGColors.brandGreen,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text('Online',
                          style: GoogleFonts.inter(
                              fontSize: 11, color: AGColors.brandGreen,
                              fontWeight: FontWeight.w600)),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),

          // ── Aparência (theme toggle)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(AGRadius.xl - 4),
                border: Border.all(color: borderColor),
              ),
              child: Row(
                children: [
                  const Text('☀️', style: TextStyle(fontSize: 18)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Aparência',
                            style: GoogleFonts.inter(
                              fontSize: 14, fontWeight: FontWeight.w600,
                              color: textColor,
                            )),
                        Text(
                          isDark ? 'Atual: Escuro' : 'Atual: Claro',
                          style: GoogleFonts.inter(
                              fontSize: 11, color: mutedColor),
                        ),
                      ],
                    ),
                  ),
                  const ThemeToggleSwitch(),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // ── Áreas do painel
          _SectionHeader('ÁREAS DO PAINEL', textColor),
          _MenuCard(
            children: [
              _MenuRow(
                icon: Icons.trending_up_rounded,
                iconColor: AGColors.brandGreenMid,
                label: 'Financeiro',
                sub: 'Receita, custos, transações',
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => const AdminFinanceScreen()),
                ),
                textColor: textColor,
                mutedColor: mutedColor,
                borderColor: borderColor,
              ),
              _MenuRow(
                icon: Icons.grid_view_rounded,
                iconColor: AGColors.accentOrange,
                label: 'Catálogo',
                sub: '10 SKUs · margem média 68%',
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => const AdminCatalogScreen()),
                ),
                textColor: textColor,
                mutedColor: mutedColor,
                borderColor: borderColor,
              ),
              _MenuRow(
                icon: Icons.people_outline_rounded,
                iconColor: AGColors.accentPurple,
                label: 'Usuários',
                sub: '287 cadastrados',
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => const AdminUsersScreen()),
                ),
                textColor: textColor,
                mutedColor: mutedColor,
                borderColor: null,
                isLast: true,
              ),
            ],
            cardBg: cardBg,
            borderColor: borderColor,
          ),

          const SizedBox(height: 12),

          // ── Configurações
          _SectionHeader('CONFIGURAÇÕES', textColor),
          _MenuCard(
            children: [
              _MenuRow(
                icon: Icons.notifications_outlined,
                iconColor: AGColors.accentBlue,
                label: 'Notificações',
                sub: 'Push, e-mail, escalações',
                onTap: () {},
                textColor: textColor,
                mutedColor: mutedColor,
                borderColor: borderColor,
              ),
              _MenuRow(
                icon: Icons.settings_outlined,
                iconColor: AGColors.slate,
                label: 'Configurações da gráfica',
                sub: 'CNPJ, integrações',
                onTap: () {},
                textColor: textColor,
                mutedColor: mutedColor,
                borderColor: borderColor,
              ),
              _MenuRow(
                icon: Icons.shield_outlined,
                iconColor: AGColors.accentOrange,
                label: 'Permissões e equipe',
                sub: '4 usuários',
                onTap: () {},
                textColor: textColor,
                mutedColor: mutedColor,
                borderColor: borderColor,
              ),
              _MenuRow(
                icon: Icons.help_outline_rounded,
                iconColor: AGColors.stone,
                label: 'Central de ajuda',
                onTap: () {},
                textColor: textColor,
                mutedColor: mutedColor,
                borderColor: null,
                isLast: true,
              ),
            ],
            cardBg: cardBg,
            borderColor: borderColor,
          ),

          const SizedBox(height: 12),

          // ── Sair
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: GestureDetector(
              onTap: () async {
                await AuthService().logout();
                if (context.mounted) {
                  Navigator.pushNamedAndRemoveUntil(
                      context, AppRoutes.login, (_) => false);
                }
              },
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFEBEB),
                  borderRadius: BorderRadius.circular(AGRadius.xl - 4),
                  border: Border.all(color: AGColors.danger.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.logout_rounded,
                        color: AGColors.danger, size: 18),
                    const SizedBox(width: 10),
                    Text('Sair',
                        style: GoogleFonts.inter(
                          fontSize: 14, fontWeight: FontWeight.w600,
                          color: AGColors.danger,
                        )),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Footer versão
          Center(
            child: Text(
              'Autograph v1.0 · build 2026.05',
              style: GoogleFonts.inter(fontSize: 11, color: AGColors.stone),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String label;
  final Color textColor;

  const _SectionHeader(this.label, this.textColor);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 6),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 10, fontWeight: FontWeight.w700,
          color: AGColors.stone, letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _MenuCard extends StatelessWidget {
  final Color cardBg, borderColor;
  final List<Widget> children;

  const _MenuCard({
    super.key,
    required this.cardBg,
    required this.borderColor,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(AGRadius.xl - 4),
          border: Border.all(color: borderColor),
        ),
        child: Column(children: children),
      ),
    );
  }
}

class _MenuRow extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final String? sub;
  final VoidCallback onTap;
  final Color textColor, mutedColor;
  final Color? borderColor;
  final bool isLast;

  const _MenuRow({
    required this.icon, required this.iconColor, required this.label,
    this.sub, required this.onTap, required this.textColor,
    required this.mutedColor, this.borderColor, this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: !isLast && borderColor != null
            ? BoxDecoration(
                border: Border(bottom: BorderSide(color: borderColor!)))
            : null,
        child: Row(
          children: [
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(AGRadius.sm),
              ),
              child: Icon(icon, size: 16, color: iconColor),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: GoogleFonts.inter(
                        fontSize: 14, fontWeight: FontWeight.w500,
                        color: textColor,
                      )),
                  if (sub != null)
                    Text(sub!,
                        style: GoogleFonts.inter(
                            fontSize: 11, color: mutedColor)),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded,
                size: 16, color: mutedColor),
          ],
        ),
      ),
    );
  }
}
