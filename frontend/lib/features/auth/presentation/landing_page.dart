import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/routes/app_routes.dart';

class LandingPage extends StatefulWidget {
  const LandingPage({super.key});

  @override
  State<LandingPage> createState() => _LandingPageState();
}

class _LandingPageState extends State<LandingPage> with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _fadeAnimation = CurvedAnimation(parent: _fadeController, curve: Curves.easeIn);
    _fadeController.forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  void _navigateToLogin() {
    Navigator.pushReplacementNamed(context, AppRoutes.login);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final brandGreen = AppColors.brandGreen;
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.auto_awesome, color: brandGreen),
            const SizedBox(width: 8),
            Text('AutoGraph.', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: _navigateToLogin,
            child: const Text('Entrar'),
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Hero Section
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 60),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDark 
                        ? [AppColors.darkCanvas, AppColors.darkSurfaceLift] 
                        : [AppColors.surface, AppColors.brandGreenSoft.withValues(alpha: 0.3)],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      decoration: BoxDecoration(
                        color: brandGreen.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(30),
                        border: Border.all(color: brandGreen.withValues(alpha: 0.3)),
                      ),
                      child: Text(
                        'O futuro das gráficas',
                        style: TextStyle(color: brandGreen, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Atendimento Gráfico\nAutomatizado por IA',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.displayMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Escale suas vendas, reduza erros de arquivos e atenda seus clientes 24 horas por dia com um assistente virtual especializado no setor gráfico.',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: isDark ? AppColors.darkTextSecondary : AppColors.steel,
                      ),
                    ),
                    const SizedBox(height: 40),
                    ElevatedButton(
                      onPressed: _navigateToLogin,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
                      ),
                      child: const Text('Começar Agora', style: TextStyle(fontSize: 18)),
                    ),
                  ],
                ),
              ),

              // Mockup de Chat
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Container(
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkSurface : AppColors.canvas,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: theme.dividerColor),
                    boxShadow: [
                      BoxShadow(
                        color: brandGreen.withValues(alpha: 0.1),
                        blurRadius: 30,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          border: Border(bottom: BorderSide(color: theme.dividerColor)),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: brandGreen,
                              child: const Icon(Icons.smart_toy, color: AppColors.brandTealDeep),
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('AutoGraph Bot', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                                Text('Online', style: theme.textTheme.bodySmall?.copyWith(color: brandGreen)),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildChatBubble('Olá! Como posso ajudar com seu material gráfico hoje?', false, theme),
                            const SizedBox(height: 16),
                            Align(
                              alignment: Alignment.centerRight,
                              child: _buildChatBubble('Preciso de 1000 cartões de visita, mas não sei o que é sangria.', true, theme),
                            ),
                            const SizedBox(height: 16),
                            _buildChatBubble('Sem problemas! A sangria é uma margem de segurança além do corte. Para seus cartões, adicione 2mm de cada lado. Gostaria de ver as opções de papel?', false, theme),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Funcionalidades
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    Text('O que ele faz?', style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 32),
                    _buildFeatureItem(Icons.auto_awesome, 'Orçamentos instantâneos', 'Respostas rápidas para retenção de clientes.', theme),
                    _buildFeatureItem(Icons.book, 'Explicações técnicas', 'Orienta sobre laminação, verniz e acabamentos.', theme),
                    _buildFeatureItem(Icons.check_circle_outline, 'Validação de arquivos', 'Verifica sangria, margem e resolução antes de imprimir.', theme),
                  ],
                ),
              ),

              // CTA Final
              Container(
                margin: const EdgeInsets.all(24),
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [brandGreen, AppColors.brandGreenDark],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  children: [
                    Text(
                      'Pronto para revolucionar seu atendimento?',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.titleLarge?.copyWith(
                        color: AppColors.brandTealDeep,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: _navigateToLogin,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.brandTealDeep,
                        foregroundColor: AppColors.brandGreen,
                      ),
                      child: const Text('Fazer Login / Cadastrar'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildChatBubble(String text, bool isSent, ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isSent 
            ? AppColors.brandGreen 
            : (theme.brightness == Brightness.dark ? AppColors.darkSurfaceLift : AppColors.surfaceSoft),
        borderRadius: BorderRadius.only(
          topLeft: const Radius.circular(16),
          topRight: const Radius.circular(16),
          bottomLeft: Radius.circular(isSent ? 16 : 0),
          bottomRight: Radius.circular(isSent ? 0 : 16),
        ),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: isSent ? AppColors.brandTealDeep : theme.colorScheme.onSurface,
        ),
      ),
    );
  }

  Widget _buildFeatureItem(IconData icon, String title, String subtitle, ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.brandGreen.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppColors.brandGreen),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(subtitle, style: theme.textTheme.bodyMedium?.copyWith(color: theme.textTheme.bodyMedium?.color?.withValues(alpha: 0.7))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
