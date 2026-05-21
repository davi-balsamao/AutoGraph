// WelcomeScreen — Tela de boas-vindas do app cliente (01 · Welcome)
//
// Tokens usados:
//   AGColors.brandTealDeep / bgDarkDeep (fundo — invariante ao tema)
//   AGColors.brandGreen (botão CTA, pill eyebrow, dot, logo bg)
//   AGColors.onDark (#fff — título)
//   AGColors.muted (subtítulo, texto legal)
//   AGSpacing.xxxl = 40 (padding lateral/vertical)
//   AGType.heading2 (36/600/h:1.08/ls:-1)
//   AGType.buttonMd, AGType.microUppercase
//   AGRadius.full (pill)
//
// Referência: ClaudeDesign/components/app-screens.jsx → WelcomeScreen
//
// Animação: logo fade (0→1) + scale (0.75→1.0) em 700ms com easeOutBack

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/widgets/ag_logo.dart';
import '../../../core/widgets/ag_theme_toggle.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _fade;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _fade = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _ctrl,
        curve: const Interval(0.0, 0.8, curve: Curves.easeOut),
      ),
    );
    _scale = Tween<double>(begin: 0.75, end: 1.0).animate(
      CurvedAnimation(
        parent: _ctrl,
        curve: const Interval(0.0, 0.8, curve: Curves.easeOutBack),
      ),
    );
    _ctrl.forward();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Fundo fixo — não muda com tema (Welcome é sempre escuro)
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final heroBg = isDark
        ? const Color(0xFF000A10) // bgDarkDeep aprofundado (heroBg do JSX)
        : AGColors.brandTealDeep;

    return Scaffold(
      backgroundColor: heroBg,
      body: Stack(
        children: [
          // ── Gradientes radiais decorativos
          Positioned.fill(
            child: IgnorePointer(
              child: CustomPaint(painter: _WelcomeGradientPainter()),
            ),
          ),

          // ── Conteúdo principal
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(28, 40, 28, 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // ── Linha superior: logo animado + toggle
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      AnimatedBuilder(
                        animation: _ctrl,
                        builder: (_, child) => FadeTransition(
                          opacity: _fade,
                          child: ScaleTransition(scale: _scale, child: child),
                        ),
                        child: const AGLogoMark(
                          size: 56,
                          bg: AGColors.brandGreen,
                          stroke: AGColors.brandTealDeep,
                        ),
                      ),
                      const ThemeToggleIcon(
                        size: 40,
                        onDarkBackground: true,
                      ),
                    ],
                  ),

                  const SizedBox(height: 36),

                  // ── Área central expandida
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.start,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Eyebrow pill
                        _EyebrowPill(),

                        const SizedBox(height: 20),

                        // Título
                        Text(
                          'Imprima tudo\nconversando.',
                          style: GoogleFonts.inter(
                            fontSize: 36,
                            fontWeight: FontWeight.w600,
                            height: 1.08,
                            letterSpacing: -1.0,
                            color: AGColors.onDark,
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Subtítulo
                        Text(
                          'Panfletos, banners, blocos e apostilas direto no chat. '
                          'Orçamento em 40 s, prova digital, entrega em 24h.',
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w400,
                            height: 1.55,
                            color: AGColors.muted,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // ── Botões CTA + texto legal
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Botão primário verde
                      _PrimaryButton(
                        label: 'Começar agora',
                        onTap: () =>
                            Navigator.pushNamed(context, AppRoutes.register),
                      ),

                      const SizedBox(height: 10),

                      // Botão secundário outline
                      OutlinedButton(
                        onPressed: () =>
                            Navigator.pushNamed(context, AppRoutes.login),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(
                            color: Color(0xFF1C2D38), // charcoal
                          ),
                          minimumSize: const Size.fromHeight(48),
                          shape: const StadiumBorder(),
                          textStyle: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 22,
                            vertical: 14,
                          ),
                        ),
                        child: const Text('Já tenho conta'),
                      ),

                      const SizedBox(height: 12),

                      // Texto legal
                      Text(
                        'Continuando, você aceita os Termos e Política de Privacidade',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w400,
                          color: AGColors.muted,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Pill "Gráfica + agente" ──────────────────────────────────────
class _EyebrowPill extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0x1400ED64),   // rgba(0,237,100, 0.08)
        borderRadius: BorderRadius.circular(AGRadius.full),
        border: Border.all(
          color: const Color(0x2E00ED64), // rgba(0,237,100, 0.18)
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Dot verde
          Container(
            width: 6,
            height: 6,
            decoration: const BoxDecoration(
              color: AGColors.brandGreen,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            'Gráfica + agente',
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.0,
              color: AGColors.brandGreen,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Botão primário verde com ícone seta ─────────────────────────
class _PrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _PrimaryButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 48,
      child: ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: AGColors.brandGreen,
          foregroundColor: AGColors.onPrimary,
          shape: const StadiumBorder(),
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          textStyle: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(label),
            const SizedBox(width: 8),
            const Icon(Icons.arrow_forward_rounded, size: 16),
          ],
        ),
      ),
    );
  }
}

// ─── Gradientes radiais decorativos ──────────────────────────────
// Fiel ao JSX:
//   radial-gradient(400px 200px at 80% 10%, rgba(0,237,100,.18), transparent 60%)
//   radial-gradient(400px 240px at 0% 100%, rgba(0,163,92,.16),  transparent 60%)
class _WelcomeGradientPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // Superior direito — verde brilhante
    final p1 = Paint()
      ..shader = RadialGradient(
        center: const Alignment(0.6, -0.8),
        radius: 0.65,
        colors: const [
          Color(0x2E00ED64), // rgba(0,237,100, 0.18)
          Colors.transparent,
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    // Inferior esquerdo — verde médio
    final p2 = Paint()
      ..shader = RadialGradient(
        center: const Alignment(-1.0, 1.0),
        radius: 0.75,
        colors: const [
          Color(0x2900A35C), // rgba(0,163,92, 0.16)
          Colors.transparent,
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    canvas.drawRect(rect, p1);
    canvas.drawRect(rect, p2);
  }

  @override
  bool shouldRepaint(_WelcomeGradientPainter _) => false;
}
