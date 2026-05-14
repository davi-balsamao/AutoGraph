import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/routes/app_routes.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;
  bool _sent = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _sendReset() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    // Simulação: aguarda 1.5s e exibe confirmação
    await Future.delayed(const Duration(milliseconds: 1500));

    if (mounted) {
      setState(() {
        _isLoading = false;
        _sent = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkCanvas : AppColors.brandTealDeep,
      body: Stack(
        children: [
          // Background decorations
          Positioned(
            top: -80,
            right: -60,
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.brandGreen.withValues(alpha: 0.05),
              ),
            ),
          ),
          Positioned(
            bottom: -100,
            left: -80,
            child: Container(
              width: 360,
              height: 360,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.brandGreen.withValues(alpha: 0.04),
              ),
            ),
          ),

          // Main content
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Back button
                      IconButton(
                        key: const Key('btn_back_forgot'),
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.white.withValues(alpha: 0.08),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),

                      const SizedBox(height: 40),

                      // Icon
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: AppColors.brandGreen.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.brandGreen.withValues(alpha: 0.3)),
                        ),
                        child: const Icon(Icons.lock_reset_rounded, color: AppColors.brandGreen, size: 28),
                      ),

                      const SizedBox(height: 24),

                      Text(
                        'Redefinir\nsenha',
                        style: GoogleFonts.outfit(
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          height: 1.1,
                        ),
                      ),

                      const SizedBox(height: 12),

                      Text(
                        _sent
                          ? 'Enviamos as instruções para o seu e-mail. Verifique sua caixa de entrada.'
                          : 'Digite o e-mail cadastrado e enviaremos as instruções para redefinir sua senha.',
                        style: GoogleFonts.outfit(
                          fontSize: 15,
                          color: Colors.white.withValues(alpha: 0.6),
                          height: 1.5,
                        ),
                      ),

                      const SizedBox(height: 40),

                      // Card
                      Container(
                        padding: const EdgeInsets.all(28),
                        decoration: BoxDecoration(
                          color: isDark
                            ? AppColors.darkSurface
                            : Colors.white.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isDark
                              ? AppColors.darkHairline
                              : Colors.white.withValues(alpha: 0.12),
                          ),
                        ),
                        child: _sent ? _buildSuccessState(context) : _buildFormState(context),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuccessState(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: AppColors.brandGreen.withValues(alpha: 0.15),
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.brandGreen.withValues(alpha: 0.4), width: 2),
          ),
          child: const Icon(Icons.mark_email_read_outlined, color: AppColors.brandGreen, size: 30),
        ),
        const SizedBox(height: 20),
        Text(
          'E-mail enviado!',
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          _emailController.text,
          style: GoogleFonts.outfit(
            fontSize: 14,
            color: AppColors.brandGreen,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 28),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            key: const Key('btn_back_to_login'),
            onPressed: () => Navigator.pushReplacementNamed(context, AppRoutes.login),
            child: const Text('VOLTAR AO LOGIN', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5)),
          ),
        ),
        const SizedBox(height: 16),
        TextButton(
          onPressed: () => setState(() => _sent = false),
          child: Text(
            'Tentar outro e-mail',
            style: GoogleFonts.outfit(color: Colors.white.withValues(alpha: 0.5), fontSize: 13),
          ),
        ),
      ],
    );
  }

  Widget _buildFormState(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'E-MAIL',
            style: GoogleFonts.outfit(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 1,
              color: Colors.white.withValues(alpha: 0.5),
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            key: const Key('field_email_reset'),
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            style: TextStyle(
              color: isDark ? AppColors.darkTextPrimary : Colors.white,
              fontFamily: 'Outfit',
            ),
            decoration: InputDecoration(
              hintText: 'seu@email.com',
              prefixIcon: const Icon(Icons.alternate_email_rounded, size: 20),
              prefixIconColor: Colors.white.withValues(alpha: 0.4),
              fillColor: Colors.white.withValues(alpha: isDark ? 0.04 : 0.06),
              filled: true,
              hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.3)),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.12)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.12)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.brandGreen, width: 1.5),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Colors.redAccent),
              ),
              focusedErrorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
              ),
              errorStyle: const TextStyle(color: Colors.orangeAccent),
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return 'Informe o e-mail';
              if (!v.contains('@') || !v.contains('.')) return 'E-mail inválido';
              return null;
            },
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              key: const Key('btn_send_reset'),
              onPressed: _isLoading ? null : _sendReset,
              child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.brandTealDeep,
                    ),
                  )
                : const Text('ENVIAR INSTRUÇÕES', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5)),
            ),
          ),
        ],
      ),
    );
  }
}
