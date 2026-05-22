// AccountScreen — Tela de Conta do cliente (08 · Conta)
//
// Referência: ClaudeDesign/components/app-screens-b.jsx → AccountScreen
// Reutiliza: AuthService().currentUser, AuthService().logout()

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/widgets/ag_theme_toggle.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.bgDarkDeep : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final cardBg = isDark ? AGColors.canvasDark : AGColors.canvas;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;

    final user = AuthService().currentUser;
    final nome = user?.nome ?? 'Usuário';
    final telefone = user?.telefone ?? '';
    final inicial = nome.isNotEmpty ? nome[0].toUpperCase() : 'U';

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
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              child: Text(
                'Conta',
                style: GoogleFonts.inter(
                  fontSize: 28,
                  fontWeight: FontWeight.w600,
                  letterSpacing: -0.6,
                  color: textColor,
                ),
              ),
            ),
          ),

          // ── Profile card dark teal
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? AGColors.surfaceDark : AGColors.brandTealDeep,
                borderRadius: BorderRadius.circular(AGRadius.xl - 2),
              ),
              child: Stack(
                children: [
                  const Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: RadialGradient(
                          center: Alignment(1.0, -1.0),
                          radius: 0.7,
                          colors: [Color(0x1E00ED64), Colors.transparent],
                        ),
                      ),
                    ),
                  ),
                  Column(
                    children: [
                      // Avatar + info
                      Row(
                        children: [
                          Container(
                            width: 56, height: 56,
                            decoration: const BoxDecoration(
                              color: AGColors.brandGreen,
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: Text(
                                inicial,
                                style: GoogleFonts.inter(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w700,
                                  color: AGColors.onPrimary,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(nome,
                                    style: GoogleFonts.inter(
                                      fontSize: 17,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.white,
                                    )),
                                if (telefone.isNotEmpty)
                                  Text(telefone,
                                      style: GoogleFonts.inter(
                                          fontSize: 13, color: AGColors.muted)),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      // Badge membro
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.07),
                          borderRadius: BorderRadius.circular(AGRadius.sm),
                        ),
                        child: Center(
                          child: Text(
                            'MEMBRO DESDE MAR/2025',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.8,
                              color: AGColors.brandGreen,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // ── Stats row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                _StatCard('13', 'pedidos', textColor, mutedColor,
                    cardBg, borderColor),
                const SizedBox(width: 10),
                _StatCard('R\$ 2,4k', 'gasto total', textColor, mutedColor,
                    cardBg, borderColor),
                const SizedBox(width: 10),
                _StatCard('4.9★', 'avaliação', textColor, mutedColor,
                    cardBg, borderColor),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // ── Seção Conta
          _SectionHeader('CONTA', mutedColor),
          _MenuSection(
            cardBg: cardBg,
            borderColor: borderColor,
            children: [
              _MenuRow('Dados pessoais', Icons.person_outline_rounded,
                  textColor, mutedColor, borderColor, () {}),
              _MenuRow('Endereços', Icons.location_on_outlined,
                  textColor, mutedColor, borderColor, () {}),
              _MenuRow('Formas de pagamento', Icons.credit_card_outlined,
                  textColor, mutedColor, null, () {}, isLast: true),
            ],
          ),

          const SizedBox(height: 12),

          // ── Seção Preferências
          _SectionHeader('PREFERÊNCIAS', mutedColor),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(AGRadius.xl - 4),
                border: Border.all(color: borderColor),
              ),
              child: Column(
                children: [
                  // Tema com ThemeToggleSwitch inline
                  Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        Icon(Icons.palette_outlined,
                            size: 18, color: mutedColor),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text('Tema',
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                color: textColor,
                              )),
                        ),
                        const ThemeToggleSwitch(),
                      ],
                    ),
                  ),
                  Divider(height: 1, color: borderColor),
                  _MenuRow('Notificações', Icons.notifications_outlined,
                      textColor, mutedColor, borderColor, () {}),
                  _MenuRow('Falar com humano', Icons.support_agent_outlined,
                      textColor, mutedColor, borderColor, () {}),
                  _MenuRow('Central de ajuda', Icons.help_outline_rounded,
                      textColor, mutedColor, null, () {}, isLast: true),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),

          // ── Seção Outros
          _SectionHeader('OUTROS', mutedColor),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
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
                  border: Border.all(
                      color: AGColors.danger.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.logout_rounded,
                        color: AGColors.danger, size: 18),
                    const SizedBox(width: 10),
                    Text('Sair',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AGColors.danger,
                        )),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Footer
          Center(
            child: Text(
              'Autograph v1.0 · feito em São Paulo',
              style: GoogleFonts.inter(fontSize: 11, color: AGColors.stone),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  final String value, label;
  final Color textColor, mutedColor, cardBg, borderColor;

  const _StatCard(this.value, this.label, this.textColor, this.mutedColor,
      this.cardBg, this.borderColor);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(AGRadius.xl - 4),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          children: [
            Text(value,
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: textColor,
                )),
            const SizedBox(height: 2),
            Text(label,
                style: GoogleFonts.inter(fontSize: 11, color: mutedColor)),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String label;
  final Color color;

  const _SectionHeader(this.label, this.color);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 6),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
          color: AGColors.stone,
        ),
      ),
    );
  }
}

class _MenuSection extends StatelessWidget {
  final Color cardBg, borderColor;
  final List<Widget> children;

  const _MenuSection({
    required this.cardBg,
    required this.borderColor,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
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
  final String label;
  final IconData icon;
  final Color textColor, mutedColor;
  final Color? borderColor;
  final VoidCallback onTap;
  final bool isLast;

  const _MenuRow(this.label, this.icon, this.textColor, this.mutedColor,
      this.borderColor, this.onTap, {this.isLast = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: !isLast && borderColor != null
            ? BoxDecoration(
                border: Border(bottom: BorderSide(color: borderColor!)))
            : null,
        child: Row(
          children: [
            Icon(icon, size: 18, color: mutedColor),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label,
                  style: GoogleFonts.inter(fontSize: 14, color: textColor)),
            ),
            Icon(Icons.chevron_right_rounded, size: 16, color: mutedColor),
          ],
        ),
      ),
    );
  }
}
