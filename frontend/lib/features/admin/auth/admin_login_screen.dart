// AdminLoginScreen — Tela de login do painel admin (mobile)
//
// Referência: ClaudeDesign/components/admin-mobile-screens-c.jsx → AdmMobileLogin
//
// Reutiliza: AuthService().login() existente
// Redireciona admin para AppRoutes.adminHome após login bem-sucedido

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/utils/snackbar_util.dart';
import '../../../core/widgets/ag_logo.dart';
import '../../../core/widgets/ag_theme_toggle.dart';
import '../../../core/widgets/ag_field.dart';

class AdminLoginScreen extends StatefulWidget {
  const AdminLoginScreen({super.key});

  @override
  State<AdminLoginScreen> createState() => _AdminLoginScreenState();
}

class _AdminLoginScreenState extends State<AdminLoginScreen> {
  final _emailCtrl = TextEditingController();
  final _senhaCtrl = TextEditingController();
  bool _obscureSenha = true;
  bool _keepConnected = true;
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
        // Conta cliente tentando entrar no painel admin
        SnackbarUtil.showError(
            context, 'Esta conta não tem acesso ao painel.');
        await AuthService().logout();
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
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Toggle tema
              Align(
                alignment: Alignment.centerRight,
                child: const ThemeToggleIcon(size: 36),
              ),

              const SizedBox(height: 24),

              // Logo + badge
              AGLogoMark.themed(context, size: 48),
              const SizedBox(height: 16),

              // Badge "PAINEL ADMINISTRATIVO"
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: isDark ? AGColors.surfaceDarkFeat : AGColors.surfaceFeature,
                  borderRadius: BorderRadius.circular(AGRadius.sm),
                  border: Border.all(
                    color: isDark ? AGColors.brandGreenDark : AGColors.brandGreenSoft,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('🔒', style: TextStyle(fontSize: 11)),
                    const SizedBox(width: 6),
                    Text(
                      'PAINEL ADMINISTRATIVO',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                        color: isDark ? AGColors.brandGreen : AGColors.brandGreenDark,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Heading
              Text(
                'Entrar no painel',
                style: GoogleFonts.inter(
                  fontSize: 26,
                  fontWeight: FontWeight.w600,
                  letterSpacing: -0.5,
                  color: textColor,
                  height: 1.1,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Acesso restrito à equipe da gráfica.',
                style: GoogleFonts.inter(fontSize: 13, color: mutedColor),
              ),

              const SizedBox(height: 28),

              // Campos
              AGField(
                label: 'E-mail corporativo',
                controller: _emailCtrl,
                placeholder: 'seu@autograph.com.br',
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 12),
              AGField(
                label: 'Senha',
                controller: _senhaCtrl,
                placeholder: '••••••••••',
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

              // Manter conectado + Esqueci
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: () =>
                        setState(() => _keepConnected = !_keepConnected),
                    child: Row(
                      children: [
                        Container(
                          width: 16, height: 16,
                          decoration: BoxDecoration(
                            color: _keepConnected
                                ? AGColors.brandGreen
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(4),
                            border: _keepConnected
                                ? null
                                : Border.all(color: borderColor),
                          ),
                          child: _keepConnected
                              ? const Icon(Icons.check_rounded,
                                  size: 11, color: AGColors.onPrimary)
                              : null,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Manter conectado',
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
                      : const Text('Entrar no painel'),
                ),
              ),

              const SizedBox(height: 16),

              // Aviso 2FA
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? AGColors.surfaceDark : AGColors.surfaceSoft,
                  borderRadius: BorderRadius.circular(AGRadius.md),
                  border: Border.all(
                    color: isDark ? AGColors.hairlineDark : AGColors.hairline,
                  ),
                ),
                child: Row(
                  children: [
                    const Text('🔐', style: TextStyle(fontSize: 14)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Vamos te pedir um código de 6 dígitos depois (2FA)',
                        style: GoogleFonts.inter(
                            fontSize: 12, color: mutedColor, height: 1.4),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Footer
              Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Não é da equipe? ',
                      style: GoogleFonts.inter(
                          fontSize: 13, color: mutedColor),
                    ),
                    GestureDetector(
                      onTap: () => Navigator.pushReplacementNamed(
                          context, AppRoutes.login),
                      child: Text(
                        'App do cliente',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: linkColor,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
