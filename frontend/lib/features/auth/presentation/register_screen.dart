import 'package:flutter/material.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/utils/snackbar_util.dart';
import '../../../core/theme/app_theme.dart';

class RegisterScreen extends StatefulWidget {
  final bool isAdminCreating;
  const RegisterScreen({super.key, this.isAdminCreating = false});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nomeCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _senhaCtrl = TextEditingController();
  final _telefoneCtrl = TextEditingController();
  final _enderecoCompletoCtrl = TextEditingController();
  final _enderecoReferenciaCtrl = TextEditingController();
  bool _isLoading = false;
  bool _obscureSenha = true;

  @override
  void dispose() {
    _nomeCtrl.dispose();
    _emailCtrl.dispose();
    _senhaCtrl.dispose();
    _telefoneCtrl.dispose();
    _enderecoCompletoCtrl.dispose();
    _enderecoReferenciaCtrl.dispose();
    super.dispose();
  }

  Future<void> _doRegister() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      await AuthService().register(
        nome: _nomeCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        senha: _senhaCtrl.text,
        telefone: _telefoneCtrl.text.trim(),
        enderecoCompleto: _enderecoCompletoCtrl.text.trim(),
        enderecoReferencia: _enderecoReferenciaCtrl.text.trim(),
      );
      
      if (!mounted) return;
      
      if (widget.isAdminCreating) {
        SnackbarUtil.showSuccess(context, 'Cliente cadastrado com sucesso!');
        Navigator.pop(context);
      } else {
        SnackbarUtil.showSuccess(context, 'Conta criada com sucesso! Faça login.');
        Navigator.pushReplacementNamed(context, AppRoutes.login);
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
    final brandGreen = AppColors.brandGreen;
    final subtitleColor = theme.colorScheme.onSurface.withValues(alpha: 0.7);
    final fieldBgColor = theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3);

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isAdminCreating ? 'Cadastrar Novo Cliente' : 'Criar Conta'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (!widget.isAdminCreating) ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: brandGreen.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.person_add_outlined, size: 48, color: brandGreen),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Junte-se à AutoGraph',
                    style: theme.textTheme.headlineMedium?.copyWith(
                      color: brandGreen,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Preencha seus dados para começar.',
                    style: theme.textTheme.bodyMedium?.copyWith(color: subtitleColor),
                  ),
                  const SizedBox(height: 32),
                ],

                TextFormField(
                  key: const Key('field_reg_nome'),
                  controller: _nomeCtrl,
                  decoration: InputDecoration(
                    labelText: 'Nome Completo',
                    prefixIcon: const Icon(Icons.person_outline),
                    filled: true,
                    fillColor: fieldBgColor,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                  validator: (v) => v == null || v.isEmpty ? 'Informe o nome' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  key: const Key('field_reg_email'),
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    labelText: 'E-mail',
                    prefixIcon: const Icon(Icons.email_outlined),
                    filled: true,
                    fillColor: fieldBgColor,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Informe o e-mail';
                    if (!v.contains('@')) return 'E-mail inválido';
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  key: const Key('field_reg_telefone'),
                  controller: _telefoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    labelText: 'Telefone',
                    prefixIcon: const Icon(Icons.phone_outlined),
                    filled: true,
                    fillColor: fieldBgColor,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                  validator: (v) => v == null || v.isEmpty ? 'Informe o telefone' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  key: const Key('field_reg_endereco'),
                  controller: _enderecoCompletoCtrl,
                  decoration: InputDecoration(
                    labelText: 'Endereço Completo',
                    prefixIcon: const Icon(Icons.home_outlined),
                    helperText: 'Ex: Rua das Flores, 123, Bairro Centro, Cidade - SP',
                    filled: true,
                    fillColor: fieldBgColor,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                  validator: (v) => v == null || v.isEmpty ? 'Informe seu endereço completo' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  key: const Key('field_reg_referencia'),
                  controller: _enderecoReferenciaCtrl,
                  decoration: InputDecoration(
                    labelText: 'Ponto de Referência',
                    prefixIcon: const Icon(Icons.pin_drop_outlined),
                    helperText: 'Ex: Próximo à padaria central',
                    filled: true,
                    fillColor: fieldBgColor,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                  validator: (v) => v == null || v.isEmpty ? 'Informe um ponto de referência' : null,
                ),

                const SizedBox(height: 16),
                TextFormField(
                  key: const Key('field_reg_senha'),
                  controller: _senhaCtrl,
                  obscureText: _obscureSenha,
                  decoration: InputDecoration(
                    labelText: 'Senha',
                    prefixIcon: const Icon(Icons.lock_outline),
                    filled: true,
                    fillColor: fieldBgColor,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    suffixIcon: IconButton(
                      icon: Icon(_obscureSenha ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setState(() => _obscureSenha = !_obscureSenha),
                    ),
                  ),
                  validator: (v) => v == null || v.length < 4 ? 'Mínimo 4 caracteres' : null,
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    key: const Key('btn_register_submit'),
                    onPressed: _isLoading ? null : _doRegister,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: brandGreen,
                      foregroundColor: AppColors.brandTealDeep,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _isLoading
                        ? const CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(AppColors.brandTealDeep))
                        : Text(widget.isAdminCreating ? 'Cadastrar Cliente' : 'Criar Minha Conta'),

                  ),
                ),
                if (!widget.isAdminCreating)
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Já tenho conta? Login'),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
