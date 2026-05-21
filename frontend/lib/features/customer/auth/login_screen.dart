// LoginScreen — Tela de login do cliente (00a · Login)
//
// Tokens usados:
//   AGColors.canvas/bgDarkDeep (scaffold bg)
//   AGColors.brandGreen (CTA button, checkbox, links)
//   AGColors.brandGreenDark (link color light mode)
//   AGColors.ink/onDark (texto principal)
//   AGColors.steel/stone (subtítulo, placeholder)
//   AGColors.hairline (divider, border social btn)
//   AGRadius.full (botões pill)
//
// Referência: ClaudeDesign/components/app-screens-auth.jsx → LoginScreen
//
// Reutiliza: AuthService().login() existente em lib/core/services/auth_service.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/utils/snackbar_util.dart';
import '../../../core/widgets/ag_logo.dart';
import '../../../core/widgets/ag_theme_toggle.dart';
import '../../../core/widgets/ag_field.dart';

class CustomerLoginScreen extends StatefulWidget {
  const CustomerLoginScreen({super.key});

  @override
  State<CustomerLoginScreen> createState() => _CustomerLoginScreenState();
}

class _CustomerLoginScreenState extends State<CustomerLoginScreen> {
  final _emailCtrl = TextEditingController();
  final _senhaCtrl = TextEditingController();
  bool _obscureSenha = true;
  bool _rememberMe = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _senhaCtrl.dispose();
    super.dispose();
  }

  Future<void> _doLogin() async {
    if (_emailCtrl.text.isEmpty || _senhaCtrl.text.isEmpty) {
      SnackbarUtil.showError(context, 'Preencha e-mail e senha');
      return;
    }
    setState(() => _isLoading = true);
    try {
      final user = await AuthService().login(
        _emailCtrl.text.trim(),
        _senhaCtrl.text,
      );
      if (!mounted) return;
      if (user.isAdmin) {
        Navigator.pushReplacementNamed(context, AppRoutes.adminHome);
      } else {
        Navigator.pushReplacementNamed(context, AppRoutes.customerHome);
      }
    } on AuthException catch (e) {
      if (mounted) SnackbarUtil.showError(context, e.message);
    } catch (e) {
      if (mounted) SnackbarUtil.showError(context, 'Erro inesperado: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.bgDarkDeep : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final linkColor = isDark ? AGColors.brandGreen : AGColors.brandGreenDark;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;

    return Scaffold(
      backgroundColor: bg,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Back + Toggle
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _CircleButton(
                            onTap: () => Navigator.maybePop(context),
                            child: Icon(Icons.arrow_back_rounded,
                                size: 16, color: textColor),
                          ),
                          const ThemeToggleIcon(size: 36),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Logo
                    AGLogoMark.themed(context, size: 48),

                    const SizedBox(height: 24),

                    // Heading
                    Text(
                      'Bem-vinda de volta',
                      style: GoogleFonts.inter(
                        fontSize: 28,
                        fontWeight: FontWeight.w600,
                        letterSpacing: -0.6,
                        color: textColor,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Entre pra acompanhar seus pedidos e voltar a falar com o agente.',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: mutedColor,
                        height: 1.45,
                      ),
                    ),

                    const SizedBox(height: 28),

                    // Campos
                    AGField(
                      label: 'E-mail',
                      controller: _emailCtrl,
                      placeholder: 'seu@email.com',
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 12),
                    AGField(
                      label: 'Senha',
                      controller: _senhaCtrl,
                      placeholder: '••••••••',
                      obscureText: _obscureSenha,
                      trailing: GestureDetector(
                        onTap: () => setState(() => _obscureSenha = !_obscureSenha),
                        child: Text(
                          _obscureSenha ? '👁' : '🙈',
                          style: const TextStyle(fontSize: 16),
                        ),
                      ),
                    ),

                    const SizedBox(height: 10),

                    // Lembrar + Esqueci
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        GestureDetector(
                          onTap: () => setState(() => _rememberMe = !_rememberMe),
                          child: Row(
                            children: [
                              Container(
                                width: 16,
                                height: 16,
                                decoration: BoxDecoration(
                                  color: _rememberMe
                                      ? AGColors.brandGreen
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(4),
                                  border: _rememberMe
                                      ? null
                                      : Border.all(color: borderColor),
                                ),
                                child: _rememberMe
                                    ? const Icon(Icons.check_rounded,
                                        size: 11, color: AGColors.onPrimary)
                                    : null,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'Lembrar de mim',
                                style: GoogleFonts.inter(
                                  fontSize: 12, color: textColor),
                              ),
                            ],
                          ),
                        ),
                        GestureDetector(
                          onTap: () => Navigator.pushNamed(
                              context, AppRoutes.forgotPassword),
                          child: Text(
                            'Esqueci a senha',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: linkColor,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // CTA
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _doLogin,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AGColors.brandGreen,
                          foregroundColor: AGColors.onPrimary,
                          shape: const StadiumBorder(),
                          elevation: 0,
                          textStyle: GoogleFonts.inter(
                            fontSize: 15, fontWeight: FontWeight.w600),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 20, height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AGColors.onPrimary,
                                ))
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: const [
                                  Text('Entrar'),
                                  SizedBox(width: 8),
                                  Icon(Icons.arrow_forward_rounded, size: 16),
                                ],
                              ),
                      ),
                    ),

                    // Divider social
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 24),
                      child: Row(
                        children: [
                          Expanded(child: Divider(color: borderColor)),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: Text(
                              'ou continue com',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: mutedColor,
                              ),
                            ),
                          ),
                          Expanded(child: Divider(color: borderColor)),
                        ],
                      ),
                    ),

                    // Social buttons
                    Row(
                      children: [
                        Expanded(
                          child: _SocialBtn(
                            label: 'WhatsApp',
                            icon: const Icon(Icons.chat_rounded,
                                size: 16, color: Color(0xFF25D366)),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _SocialBtn(
                            label: 'Google',
                            icon: Text('G',
                                style: GoogleFonts.inter(
                                  fontSize: 14, fontWeight: FontWeight.w700,
                                  color: const Color(0xFF4285F4))),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Footer
            Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Não tem conta? ',
                      style: GoogleFonts.inter(
                          fontSize: 13,
                          color: isDark ? AGColors.onDarkMuted : AGColors.steel)),
                  GestureDetector(
                    onTap: () =>
                        Navigator.pushNamed(context, AppRoutes.register),
                    child: Text(
                      'Criar conta',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: isDark ? AGColors.brandGreen : AGColors.brandGreenDark,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────

class _CircleButton extends StatelessWidget {
  final VoidCallback onTap;
  final Widget child;

  const _CircleButton({required this.onTap, required this.child});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: isDark ? AGColors.surfaceDark : AGColors.surfaceSoft,
          shape: BoxShape.circle,
          border: Border.all(
            color: isDark ? AGColors.hairlineDark : AGColors.hairline,
          ),
        ),
        child: Center(child: child),
      ),
    );
  }
}

class _SocialBtn extends StatelessWidget {
  final String label;
  final Widget icon;

  const _SocialBtn({required this.label, required this.icon});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: isDark ? AGColors.surfaceDark : AGColors.canvas,
        borderRadius: BorderRadius.circular(AGRadius.full),
        border: Border.all(
          color: isDark ? AGColors.hairlineDarkStr : AGColors.hairlineStrong,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          icon,
          const SizedBox(width: 8),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isDark ? AGColors.onDark : AGColors.ink,
            ),
          ),
        ],
      ),
    );
  }
}
