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
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.print_rounded, size: 72, color: theme.colorScheme.primary),
                const SizedBox(height: 12),
                Text('AutoGraph', style: theme.textTheme.displayLarge?.copyWith(color: theme.colorScheme.primary)),
                const SizedBox(height: 4),
                Text('Gestão Inteligente para Gráficas', style: theme.textTheme.bodyMedium),
                const SizedBox(height: 40),
                TextFormField(
                  key: const Key('field_email'),
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'E-mail', prefixIcon: Icon(Icons.email_outlined), border: OutlineInputBorder()),
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
                  obscureText: _obscureSenha,
                  decoration: InputDecoration(
                    labelText: 'Senha', prefixIcon: const Icon(Icons.lock_outline), border: const OutlineInputBorder(),
                    suffixIcon: IconButton(key: const Key('btn_toggle_senha'), icon: Icon(_obscureSenha ? Icons.visibility_off : Icons.visibility), onPressed: () => setState(() => _obscureSenha = !_obscureSenha)),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Informe a senha';
                    if (v.length < 4) return 'Mínimo 4 caracteres';
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity, height: 48,
                  child: ElevatedButton(
                    key: const Key('btn_login'),
                    onPressed: _isLoading ? null : _doLogin,
                    child: _isLoading ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Entrar'),
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: theme.colorScheme.primary.withAlpha(25), borderRadius: BorderRadius.circular(8)),
                  child: const Column(children: [
                    Text('Credenciais de teste:', style: TextStyle(fontWeight: FontWeight.bold)),
                    SizedBox(height: 4),
                    Text('Admin: admin@autograph.com / admin123'),
                    Text('Cliente: qualquer e-mail / senha >= 4 chars'),
                  ]),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
