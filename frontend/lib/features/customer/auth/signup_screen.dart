// SignupScreen — Tela de cadastro do cliente (00b · Cadastro)
//
// Tokens usados:
//   AGColors.canvas/bgDarkDeep (bg), brandGreen (CTA, progress, checkbox)
//   AGColors.brandGreenDark (links light mode)
//   AGColors.ink/onDark (texto), steel/onDarkMuted (muted)
//   AGRadius.full (pill CTA)
//
// Referência: ClaudeDesign/components/app-screens-auth.jsx → SignupScreen
//
// Reutiliza: AuthService().register() existente

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/utils/snackbar_util.dart';
import '../../../core/widgets/ag_logo.dart';
import '../../../core/widgets/ag_theme_toggle.dart';
import '../../../core/widgets/ag_field.dart';

class CustomerSignupScreen extends StatefulWidget {
  const CustomerSignupScreen({super.key});

  @override
  State<CustomerSignupScreen> createState() => _CustomerSignupScreenState();
}

class _CustomerSignupScreenState extends State<CustomerSignupScreen> {
  final _nomeCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _telefoneCtrl = TextEditingController();
  final _senhaCtrl = TextEditingController();
  bool _obscureSenha = true;
  bool _acceptedTerms = false;
  bool _isLoading = false;

  int get _passwordStrength {
    final s = _senhaCtrl.text;
    if (s.isEmpty) return 0;
    int strength = 0;
    if (s.length >= 8) strength++;
    if (s.contains(RegExp(r'[A-Z]'))) strength++;
    if (s.contains(RegExp(r'[0-9]'))) strength++;
    if (s.contains(RegExp(r'[!@#\$%^&*]'))) strength++;
    return strength;
  }

  @override
  void dispose() {
    _nomeCtrl.dispose();
    _emailCtrl.dispose();
    _telefoneCtrl.dispose();
    _senhaCtrl.dispose();
    super.dispose();
  }

  Future<void> _doRegister() async {
    if (_nomeCtrl.text.isEmpty || _emailCtrl.text.isEmpty ||
        _telefoneCtrl.text.isEmpty || _senhaCtrl.text.isEmpty) {
      SnackbarUtil.showError(context, 'Preencha todos os campos');
      return;
    }
    if (!_acceptedTerms) {
      SnackbarUtil.showError(context, 'Aceite os Termos para continuar');
      return;
    }
    setState(() => _isLoading = true);
    try {
      // Registra o usuário
      await AuthService().register(
        nome: _nomeCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        senha: _senhaCtrl.text,
        telefone: _telefoneCtrl.text.trim(),
      );
      // Loga automaticamente após cadastro
      await AuthService().login(
        _emailCtrl.text.trim(),
        _senhaCtrl.text,
      );
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, AppRoutes.customerHome);
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

                    const SizedBox(height: 4),
                    AGLogoMark.themed(context, size: 40),

                    const SizedBox(height: 18),
                    Text(
                      'Crie sua conta',
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
                      'Em 30 segundos você já está conversando com o agente.',
                      style: GoogleFonts.inter(
                          fontSize: 13, color: mutedColor, height: 1.45),
                    ),

                    const SizedBox(height: 16),

                    // ── Progress dots (3 segmentos, 2 ativos)
                    Row(
                      children: List.generate(3, (i) {
                        return Expanded(
                          child: Container(
                            height: 3,
                            margin: EdgeInsets.only(right: i < 2 ? 4 : 0),
                            decoration: BoxDecoration(
                              color: i < 2 ? AGColors.brandGreen : borderColor,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        );
                      }),
                    ),

                    const SizedBox(height: 8),
                    Text(
                      'PASSO 2 DE 3 · SEUS DADOS',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                        color: linkColor,
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ── Campos
                    AGField(
                      label: 'Nome',
                      controller: _nomeCtrl,
                      placeholder: 'Como prefere ser chamada',
                    ),
                    const SizedBox(height: 12),
                    AGField(
                      label: 'E-mail',
                      controller: _emailCtrl,
                      placeholder: 'seu@email.com',
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 12),
                    AGField(
                      label: 'WhatsApp',
                      controller: _telefoneCtrl,
                      placeholder: '+55 11 9 0000-0000',
                      keyboardType: TextInputType.phone,
                      leading: const Text('🇧🇷',
                          style: TextStyle(fontSize: 16)),
                    ),
                    const SizedBox(height: 12),
                    AGField(
                      label: 'Senha',
                      controller: _senhaCtrl,
                      placeholder: 'Mínimo 8 caracteres',
                      obscureText: _obscureSenha,
                      trailing: GestureDetector(
                        onTap: () =>
                            setState(() => _obscureSenha = !_obscureSenha),
                        child: Text(_obscureSenha ? '👁' : '🙈',
                            style: const TextStyle(fontSize: 16)),
                      ),
                      onChanged: (_) => setState(() {}),
                    ),

                    const SizedBox(height: 8),

                    // ── Password strength bar
                    _PasswordStrengthBar(strength: _passwordStrength),

                    const SizedBox(height: 16),

                    // ── Checkbox termos
                    GestureDetector(
                      onTap: () =>
                          setState(() => _acceptedTerms = !_acceptedTerms),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 18,
                            height: 18,
                            margin: const EdgeInsets.only(top: 1),
                            decoration: BoxDecoration(
                              color: _acceptedTerms
                                  ? AGColors.brandGreen
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(4),
                              border: _acceptedTerms
                                  ? null
                                  : Border.all(color: borderColor),
                            ),
                            child: _acceptedTerms
                                ? const Icon(Icons.check_rounded,
                                    size: 12, color: AGColors.onPrimary)
                                : null,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text.rich(
                              TextSpan(
                                style: GoogleFonts.inter(
                                  fontSize: 12, color: textColor, height: 1.4),
                                children: [
                                  const TextSpan(text: 'Eu li e aceito os '),
                                  TextSpan(
                                    text: 'Termos',
                                    style: TextStyle(
                                      color: linkColor,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const TextSpan(text: ' e a '),
                                  TextSpan(
                                    text: 'Política de privacidade',
                                    style: TextStyle(
                                      color: linkColor,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const TextSpan(text: '.'),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // CTA
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _doRegister,
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
                                  Text('Criar conta'),
                                  SizedBox(width: 8),
                                  Icon(Icons.arrow_forward_rounded, size: 16),
                                ],
                              ),
                      ),
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
                  Text('Já tem conta? ',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: isDark ? AGColors.onDarkMuted : AGColors.steel,
                      )),
                  GestureDetector(
                    onTap: () =>
                        Navigator.pushReplacementNamed(context, AppRoutes.login),
                    child: Text(
                      'Entrar',
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
    );
  }
}

// ── Password strength bar ─────────────────────────────────────────
class _PasswordStrengthBar extends StatelessWidget {
  final int strength; // 0-4

  const _PasswordStrengthBar({required this.strength});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;

    final colors = [
      const Color(0xFFD64545), // fraco
      const Color(0xFFFA6E39), // razoável
      AGColors.brandGreenMid,  // bom
      AGColors.brandGreen,     // forte
    ];
    final labels = ['', 'Fraca', 'Razoável', 'Boa', 'Senha forte ✓'];
    final labelColors = [
      Colors.transparent,
      const Color(0xFFD64545),
      const Color(0xFFFA6E39),
      AGColors.brandGreenMid,
      isDark ? AGColors.brandGreen : AGColors.brandGreenDark,
    ];

    if (strength == 0) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: List.generate(4, (i) {
            return Expanded(
              child: Container(
                height: 3,
                margin: EdgeInsets.only(right: i < 3 ? 3 : 0),
                decoration: BoxDecoration(
                  color: i < strength ? colors[strength - 1] : borderColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            );
          }),
        ),
        const SizedBox(height: 5),
        Text(
          labels[strength],
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: labelColors[strength],
          ),
        ),
      ],
    );
  }
}

// ── CircleButton helper ───────────────────────────────────────────
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
            color: isDark ? AGColors.hairlineDark : AGColors.hairline),
        ),
        child: Center(child: child),
      ),
    );
  }
}
