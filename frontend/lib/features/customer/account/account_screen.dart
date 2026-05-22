// AccountScreen — Tela de Conta do cliente (08 · Conta)
//
// Referência: ClaudeDesign/components/app-screens-b.jsx → AccountScreen
// Reutiliza: AuthService().currentUser, AuthService().logout()

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/os_service.dart';
import '../../../core/models/ordem_servico.dart';
import '../../../core/models/user_model.dart';
import '../../../core/widgets/ag_theme_toggle.dart';

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  List<OrdemServico> _orders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final list = await OsService().fetchOrdensServico();
      final client = AuthService().currentUser;
      if (client != null && mounted) {
        setState(() {
          _orders = list.where((o) => o.clienteId == client.id).toList();
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  double _calculateOrderValue(OrdemServico os) {
    final String productName = os.produtoResumo.toLowerCase();
    final int qty = (os.especificacoes['quantidade'] ?? os.especificacoes['qtd'] ?? 1) as int;
    double pricePerUnit = 12.0; // default
    if (productName.contains('a5')) {
      pricePerUnit = 0.12;
    } else if (productName.contains('a6')) {
      pricePerUnit = 0.06;
    } else if (productName.contains('lona') || productName.contains('440g')) {
      pricePerUnit = 49.00;
    } else if (productName.contains('oxford')) {
      pricePerUnit = 79.00;
    } else if (productName.contains('bloco')) {
      pricePerUnit = 12.00;
    } else if (productName.contains('panfleto')) {
      pricePerUnit = 0.12;
    } else if (productName.contains('banner')) {
      pricePerUnit = 49.00;
    } else {
      pricePerUnit = 15.00;
    }
    return pricePerUnit * qty;
  }

  double get _totalSpent {
    double total = 0.0;
    for (final os in _orders) {
      if (os.status != StatusOS.cancelada) {
        total += _calculateOrderValue(os);
      }
    }
    return total;
  }

  String _formatSpent(double value) {
    if (value >= 1000) {
      return 'R\$ ${(value / 1000).toStringAsFixed(1)}k'.replaceAll('.', ',');
    }
    return 'R\$ ${value.toStringAsFixed(2)}'.replaceAll('.', ',');
  }

  void _showPersonalDataDialog(BuildContext context, UserModel? user, Color textColor, Color mutedColor, Color bg, Color borderColor) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: bg,
          title: Text('Dados Pessoais', style: TextStyle(color: textColor)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Nome', style: TextStyle(color: mutedColor, fontSize: 11)),
              Text(user?.nome ?? 'Não informado', style: TextStyle(color: textColor, fontSize: 14, fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              Text('E-mail', style: TextStyle(color: mutedColor, fontSize: 11)),
              Text(user?.email ?? 'Não informado', style: TextStyle(color: textColor, fontSize: 14, fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              Text('Telefone', style: TextStyle(color: mutedColor, fontSize: 11)),
              Text(user?.telefone ?? 'Não informado', style: TextStyle(color: textColor, fontSize: 14, fontWeight: FontWeight.w600)),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Fechar'),
            ),
          ],
        );
      },
    );
  }

  void _showAddressesDialog(BuildContext context, Color textColor, Color mutedColor, Color bg, Color borderColor) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: bg,
          title: Text('Endereços', style: TextStyle(color: textColor)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.home_outlined, color: AGColors.brandGreen),
                title: Text('Principal', style: TextStyle(color: textColor, fontSize: 13, fontWeight: FontWeight.w600)),
                subtitle: Text('Rua das Flores, 123 - Centro', style: TextStyle(color: mutedColor, fontSize: 11)),
              ),
              Divider(color: borderColor),
              ListTile(
                leading: const Icon(Icons.work_outline_rounded, color: AGColors.brandGreen),
                title: Text('Escritório', style: TextStyle(color: textColor, fontSize: 13, fontWeight: FontWeight.w600)),
                subtitle: Text('Av. Paulista, 1000 - Bela Vista', style: TextStyle(color: mutedColor, fontSize: 11)),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Fechar'),
            ),
          ],
        );
      },
    );
  }

  void _showPaymentMethodsDialog(BuildContext context, Color textColor, Color mutedColor, Color bg, Color borderColor) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: bg,
          title: Text('Formas de Pagamento', style: TextStyle(color: textColor)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.credit_card, color: AGColors.brandGreen),
                title: Text('•••• 4567', style: TextStyle(color: textColor, fontSize: 13, fontWeight: FontWeight.w600)),
                subtitle: Text('Crédito · Visa · Expira em 12/28', style: TextStyle(color: mutedColor, fontSize: 11)),
              ),
              Divider(color: borderColor),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.pix_rounded, color: AGColors.brandGreen),
                title: Text('Pix Cadastrado', style: TextStyle(color: textColor, fontSize: 13, fontWeight: FontWeight.w600)),
                subtitle: Text('Chave CNPJ ou Telefone', style: TextStyle(color: mutedColor, fontSize: 11)),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Fechar'),
            ),
          ],
        );
      },
    );
  }

  void _showNotificationsSettingsDialog(BuildContext context, Color textColor, Color mutedColor, Color bg, Color borderColor) {
    showDialog(
      context: context,
      builder: (context) {
        bool pushEnabled = true;
        bool emailEnabled = false;
        bool whatsappEnabled = true;
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              backgroundColor: bg,
              title: Text('Configurar Notificações', style: TextStyle(color: textColor)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    activeThumbColor: AGColors.brandGreen,
                    title: Text('Notificações Push', style: TextStyle(color: textColor, fontSize: 14)),
                    subtitle: Text('Atualizações de status do pedido', style: TextStyle(color: mutedColor, fontSize: 11)),
                    value: pushEnabled,
                    onChanged: (val) => setStateDialog(() => pushEnabled = val),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    activeThumbColor: AGColors.brandGreen,
                    title: Text('E-mail', style: TextStyle(color: textColor, fontSize: 14)),
                    subtitle: Text('Recibos e notas fiscais', style: TextStyle(color: mutedColor, fontSize: 11)),
                    value: emailEnabled,
                    onChanged: (val) => setStateDialog(() => emailEnabled = val),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    activeThumbColor: AGColors.brandGreen,
                    title: Text('WhatsApp', style: TextStyle(color: textColor, fontSize: 14)),
                    subtitle: Text('Alertas rápidos e promoções', style: TextStyle(color: mutedColor, fontSize: 11)),
                    value: whatsappEnabled,
                    onChanged: (val) => setStateDialog(() => whatsappEnabled = val),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancelar'),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: AGColors.brandGreen),
                  onPressed: () {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Configurações salvas com sucesso!')),
                    );
                  },
                  child: const Text('Salvar', style: TextStyle(color: Colors.white)),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showHelpCenterDialog(BuildContext context, Color textColor, Color mutedColor, Color bg, Color borderColor) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: bg,
          title: Text('Central de Ajuda', style: TextStyle(color: textColor)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Dúvidas Frequentes', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(height: 8),
              Text('• Qual o prazo de entrega?', style: TextStyle(color: textColor, fontWeight: FontWeight.w600, fontSize: 12)),
              Text('O prazo padrão é de 24h a 48h após a aprovação da arte e pagamento.', style: TextStyle(color: mutedColor, fontSize: 11)),
              const SizedBox(height: 8),
              Text('• Como faço para enviar minha arte?', style: TextStyle(color: textColor, fontWeight: FontWeight.w600, fontSize: 12)),
              Text('Envie diretamente ao iniciar seu atendimento com a atendente.', style: TextStyle(color: mutedColor, fontSize: 11)),
              const SizedBox(height: 12),
              Text('Ainda precisa de ajuda?', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 12)),
              const SizedBox(height: 4),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AGColors.brandGreen,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(40),
                ),
                onPressed: () async {
                  Navigator.pop(context);
                  final Uri url = Uri.parse("https://wa.me/5511999990000?text=Ol%C3%A1,%20gostaria%20de%20tirar%20uma%20d%C3%BAvida.");
                  if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Não foi possível abrir o WhatsApp.')),
                      );
                    }
                  }
                },
                icon: const Icon(Icons.chat_bubble_outline_rounded, size: 16),
                label: const Text('Falar com Suporte (WhatsApp)', style: TextStyle(fontSize: 12)),
              )
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Fechar'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.bgDarkDeep : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final cardBg = isDark ? AGColors.canvasDark : AGColors.canvas;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;

    final user = AuthService().currentUser;
    final nome = user?.nome ?? 'Usuário';
    final telefone = user?.telefone ?? '';
    final inicial = nome.isNotEmpty ? nome[0].toUpperCase() : 'U';

    return Scaffold(
      backgroundColor: bg,
      body: ListView(
        padding: EdgeInsets.only(
          bottom: 100 + MediaQuery.of(context).padding.bottom,
        ),
        children: [
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              child: Text(
                'Conta',
                style: GoogleFonts.inter(
                  fontSize: 28,
                  fontWeight: FontWeight.w600,
                  letterSpacing: -0.6,
                  color: textColor,
                ),
              ),
            ),
          ),

          // ── Profile card dark teal
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? AGColors.surfaceDark : AGColors.brandTealDeep,
                borderRadius: BorderRadius.circular(AGRadius.xl - 2),
              ),
              child: Stack(
                children: [
                  const Positioned.fill(
                     child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: RadialGradient(
                          center: Alignment(1.0, -1.0),
                          radius: 0.7,
                          colors: [Color(0x1E00ED64), Colors.transparent],
                        ),
                      ),
                    ),
                  ),
                  Column(
                    children: [
                      // Avatar + info
                      Row(
                        children: [
                          Container(
                            width: 56, height: 56,
                            decoration: const BoxDecoration(
                              color: AGColors.brandGreen,
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: Text(
                                inicial,
                                style: GoogleFonts.inter(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w700,
                                  color: AGColors.onPrimary,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(nome,
                                    style: GoogleFonts.inter(
                                      fontSize: 17,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.white,
                                    )),
                                if (telefone.isNotEmpty)
                                  Text(telefone,
                                      style: GoogleFonts.inter(
                                          fontSize: 13, color: AGColors.muted)),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      // Badge membro
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.07),
                          borderRadius: BorderRadius.circular(AGRadius.sm),
                        ),
                        child: Center(
                          child: Text(
                            'MEMBRO DESDE MAR/2025',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.8,
                              color: AGColors.brandGreen,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // ── Stats row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                _StatCard(_loading ? '...' : _orders.length.toString(), 'pedidos', textColor, mutedColor,
                    cardBg, borderColor),
                const SizedBox(width: 10),
                _StatCard(_loading ? '...' : _formatSpent(_totalSpent), 'gasto total', textColor, mutedColor,
                    cardBg, borderColor),
                const SizedBox(width: 10),
                _StatCard('4.9★', 'avaliação', textColor, mutedColor,
                    cardBg, borderColor),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // ── Seção Conta
          _SectionHeader('CONTA', mutedColor),
          _MenuSection(
            cardBg: cardBg,
            borderColor: borderColor,
            children: [
              _MenuRow('Dados pessoais', Icons.person_outline_rounded,
                  textColor, mutedColor, borderColor, () => _showPersonalDataDialog(context, user, textColor, mutedColor, cardBg, borderColor)),
              _MenuRow('Endereços', Icons.location_on_outlined,
                  textColor, mutedColor, borderColor, () => _showAddressesDialog(context, textColor, mutedColor, cardBg, borderColor)),
              _MenuRow('Formas de pagamento', Icons.credit_card_outlined,
                  textColor, mutedColor, null, () => _showPaymentMethodsDialog(context, textColor, mutedColor, cardBg, borderColor), isLast: true),
            ],
          ),

          const SizedBox(height: 12),

          // ── Seção Preferências
          _SectionHeader('PREFERÊNCIAS', mutedColor),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(AGRadius.xl - 4),
                border: Border.all(color: borderColor),
              ),
              child: Column(
                children: [
                  // Tema com ThemeToggleSwitch inline
                  Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        Icon(Icons.palette_outlined,
                            size: 18, color: mutedColor),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text('Tema',
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                color: textColor,
                              )),
                        ),
                        const ThemeToggleSwitch(),
                      ],
                    ),
                  ),
                  Divider(height: 1, color: borderColor),
                  _MenuRow('Notificações', Icons.notifications_outlined,
                      textColor, mutedColor, borderColor, () => _showNotificationsSettingsDialog(context, textColor, mutedColor, cardBg, borderColor)),
                  _MenuRow('Fale conosco (WhatsApp)', Icons.support_agent_outlined,
                      textColor, mutedColor, borderColor, () async {
                    final Uri url = Uri.parse("https://wa.me/5511999990000");
                    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Não foi possível abrir o WhatsApp.')),
                        );
                      }
                    }
                  }),
                  _MenuRow('Central de ajuda', Icons.help_outline_rounded,
                      textColor, mutedColor, null, () => _showHelpCenterDialog(context, textColor, mutedColor, cardBg, borderColor), isLast: true),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),

          // ── Seção Outros
          _SectionHeader('OUTROS', mutedColor),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: GestureDetector(
              onTap: () async {
                await AuthService().logout();
                if (context.mounted) {
                  Navigator.pushNamedAndRemoveUntil(
                      context, AppRoutes.login, (_) => false);
                }
              },
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFEBEB),
                  borderRadius: BorderRadius.circular(AGRadius.xl - 4),
                  border: Border.all(
                      color: AGColors.danger.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.logout_rounded,
                        color: AGColors.danger, size: 18),
                    const SizedBox(width: 10),
                    Text('Sair',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AGColors.danger,
                        )),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Footer
          Center(
            child: Text(
              'Autograph v1.0 · feito em São Paulo',
              style: GoogleFonts.inter(fontSize: 11, color: AGColors.stone),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  final String value, label;
  final Color textColor, mutedColor, cardBg, borderColor;

  const _StatCard(this.value, this.label, this.textColor, this.mutedColor,
      this.cardBg, this.borderColor);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(AGRadius.xl - 4),
          border: Border.all(color: borderColor),
        ),
        child: Column(
          children: [
            Text(value,
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: textColor,
                )),
            const SizedBox(height: 2),
            Text(label,
                style: GoogleFonts.inter(fontSize: 11, color: mutedColor)),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String label;
  final Color color;

  const _SectionHeader(this.label, this.color);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 6),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
          color: AGColors.stone,
        ),
      ),
    );
  }
}

class _MenuSection extends StatelessWidget {
  final Color cardBg, borderColor;
  final List<Widget> children;

  const _MenuSection({
    required this.cardBg,
    required this.borderColor,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(AGRadius.xl - 4),
          border: Border.all(color: borderColor),
        ),
        child: Column(children: children),
      ),
    );
  }
}

class _MenuRow extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color textColor, mutedColor;
  final Color? borderColor;
  final VoidCallback onTap;
  final bool isLast;

  const _MenuRow(this.label, this.icon, this.textColor, this.mutedColor,
      this.borderColor, this.onTap, {this.isLast = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: !isLast && borderColor != null
            ? BoxDecoration(
                border: Border(bottom: BorderSide(color: borderColor!)))
            : null,
        child: Row(
          children: [
            Icon(icon, size: 18, color: mutedColor),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label,
                  style: GoogleFonts.inter(fontSize: 14, color: textColor)),
            ),
            Icon(Icons.chevron_right_rounded, size: 16, color: mutedColor),
          ],
        ),
      ),
    );
  }
}
