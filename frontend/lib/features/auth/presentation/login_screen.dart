import 'package:flutter/material.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/utils/snackbar_util.dart';

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
    final brandTealDeep = const Color(0xFF001E2B);
    final brandGreen = const Color(0xFF00ED64);

    return Scaffold(
      backgroundColor: brandTealDeep,
      body: Stack(
        children: [
          // Atmospheric background element (subtle gradient)
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment.topRight,
                  radius: 1.5,
                  colors: [
                    const Color(0xFF00684A).withOpacity(0.2),
                    brandTealDeep,
                  ],
                ),
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
                        color: brandGreen.withOpacity(0.1),
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
                      style: theme.textTheme.bodyLarge?.copyWith(color: Colors.white70),
                    ),
                    const SizedBox(height: 48),
                    
                    // Glassmorphic-ish container for fields
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withOpacity(0.1)),
                      ),
                      child: Column(
                        children: [
                          TextFormField(
                            key: const Key('field_email'),
                            controller: _emailCtrl,
                            style: const TextStyle(color: Colors.white),
                            keyboardType: TextInputType.emailAddress,
                            decoration: InputDecoration(
                              labelText: 'E-mail',
                              labelStyle: const TextStyle(color: Colors.white60),
                              prefixIcon: const Icon(Icons.email_outlined, color: Colors.white60),
                              fillColor: Colors.white.withOpacity(0.05),
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
                            style: const TextStyle(color: Colors.white),
                            obscureText: _obscureSenha,
                            decoration: InputDecoration(
                              labelText: 'Senha',
                              labelStyle: const TextStyle(color: Colors.white60),
                              prefixIcon: const Icon(Icons.lock_outline, color: Colors.white60),
                              fillColor: Colors.white.withOpacity(0.05),
                              filled: true,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                              suffixIcon: IconButton(
                                key: const Key('btn_toggle_senha'),
                                icon: Icon(_obscureSenha ? Icons.visibility_off : Icons.visibility, color: Colors.white60),
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
                          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF001E2B))) 
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
