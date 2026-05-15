import 'package:flutter/material.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/utils/snackbar_util.dart';
import '../../../core/theme/theme_notifier.dart';
import '../../../core/theme/app_theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _senhaCtrl = TextEditingController();
  bool _isLoading = false;
  bool _obscureSenha = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _senhaCtrl.dispose();
    super.dispose();
  }

  Future<void> _doLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      final user = await AuthService().login(_emailCtrl.text.trim(), _senhaCtrl.text);
      if (!mounted) return;
      if (user.isAdmin) {
        Navigator.pushReplacementNamed(context, AppRoutes.adminDashboard);
      } else {
        Navigator.pushReplacementNamed(context, AppRoutes.clientHistory);
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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final brandGreen = AppColors.brandGreen;
    final brandTealDeep = AppColors.brandTealDeep;

    final textColor = theme.colorScheme.onSurface;
    final subtitleColor = theme.colorScheme.onSurface.withValues(alpha: 0.7);
    final containerBgColor = theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3);
    final containerBorderColor = theme.dividerColor;
    final fieldBgColor = theme.colorScheme.surface;

    return Scaffold(
      body: Stack(
        children: [
          // Botão de alternância de tema no topo direito
          Positioned(
            top: 16,
            right: 16,
            child: SafeArea(
              child: IconButton(
                key: const Key('btn_toggle_theme_login'),
                icon: Icon(
                  isDark ? Icons.light_mode : Icons.dark_mode,
                  color: subtitleColor,
                ),
                onPressed: () => themeNotifier.toggleTheme(),
              ),
            ),
          ),
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Leaf-inspired icon or logo
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: brandGreen.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.auto_awesome, size: 48, color: brandGreen),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'AutoGraph',
                      style: theme.textTheme.displayLarge?.copyWith(
                        color: brandGreen,
                        fontWeight: FontWeight.bold,
                        letterSpacing: -1.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'The modern data platform for print shops.',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyLarge?.copyWith(color: subtitleColor),
                    ),
                    const SizedBox(height: 48),
                    
                    // Container for fields
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: containerBgColor,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: containerBorderColor),
                      ),
                      child: Column(
                        children: [
                          TextFormField(
                            key: const Key('field_email'),
                            controller: _emailCtrl,
                            style: TextStyle(color: textColor),
                            keyboardType: TextInputType.emailAddress,
                            decoration: InputDecoration(
                              labelText: 'E-mail',
                              labelStyle: TextStyle(color: subtitleColor),
                              prefixIcon: Icon(Icons.email_outlined, color: subtitleColor),
                              fillColor: fieldBgColor,
                              filled: true,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                            ),
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) return 'Informe o e-mail';
                              if (!v.contains('@')) return 'E-mail inválido';
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            key: const Key('field_senha'),
                            controller: _senhaCtrl,
                            style: TextStyle(color: textColor),
                            obscureText: _obscureSenha,
                            decoration: InputDecoration(
                              labelText: 'Senha',
                              labelStyle: TextStyle(color: subtitleColor),
                              prefixIcon: Icon(Icons.lock_outline, color: subtitleColor),
                              fillColor: fieldBgColor,
                              filled: true,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                              suffixIcon: IconButton(
                                key: const Key('btn_toggle_senha'),
                                icon: Icon(_obscureSenha ? Icons.visibility_off : Icons.visibility, color: subtitleColor),
                                onPressed: () => setState(() => _obscureSenha = !_obscureSenha),
                              ),
                            ),
                            validator: (v) {
                              if (v == null || v.isEmpty) return 'Informe a senha';
                              if (v.length < 4) return 'Mínimo 4 caracteres';
                              return null;
                            },
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton(
                        key: const Key('btn_login'),
                        onPressed: _isLoading ? null : _doLogin,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: brandGreen,
                          foregroundColor: brandTealDeep,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                        ),
                        child: _isLoading 
                          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.brandTealDeep)) 
                          : const Text('Login to Dashboard'),
                      ),
                    ),
                    const SizedBox(height: 24),
                    TextButton(
                      key: const Key('btn_forgot_password'),
                      onPressed: () => Navigator.pushNamed(context, AppRoutes.forgotPassword),
                      child: Text('Esqueceu a senha?', style: TextStyle(color: brandGreen.withValues(alpha: 0.8))),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
