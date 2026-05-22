// HomeScreen — Tela inicial do app cliente (02 · Home)
//
// Tokens usados:
//   AGColors (todos via isDark)
//   AGSpacing.lg = 20 (padding horizontal padrão)
//   AGType.heading5 (section labels)
//
// Referência: ClaudeDesign/components/app-screens.jsx → HomeScreen
//
// Nota: dados são estáticos/mockados por enquanto.
// Real: usar AuthService().currentUser + OsService().fetchOrdensServico()

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:file_picker/file_picker.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/os_service.dart';
import '../../../core/widgets/ag_logo.dart';
import '../../../core/widgets/ag_theme_toggle.dart';
import '../../../core/widgets/ag_bottom_tab_bar.dart';
import '../customer_shell.dart';
import 'widgets/agent_hero_card.dart';
import 'widgets/product_grid.dart';
import 'widgets/last_order_card.dart';
import 'widgets/promo_banner.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  Future<void> _showAddOrderDialog(BuildContext context, {String? initialProduct}) async {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.surfaceDark : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final borderColor = isDark ? AGColors.hairlineDarkStr : AGColors.hairline;

    String selectedProduct = initialProduct ?? 'Panfleto A5';
    final qtyCtrl = TextEditingController(text: '1000');
    final obsCtrl = TextEditingController();
    PlatformFile? selectedFile;

    await showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            return AlertDialog(
              backgroundColor: bg,
              title: Text(
                'Novo Pedido',
                style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: textColor),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Produto', style: TextStyle(color: mutedColor, fontSize: 12)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      initialValue: selectedProduct,
                      dropdownColor: bg,
                      style: TextStyle(color: textColor),
                      items: [
                        'Panfleto A5',
                        'Panfleto A6',
                        'Banner Lona 440g',
                        'Banner Oxford',
                        'Bloco 50fls 1 via'
                      ].map((p) {
                        return DropdownMenuItem<String>(
                          value: p,
                          child: Text(p, style: TextStyle(color: textColor, fontSize: 13)),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setStateDialog(() => selectedProduct = val ?? 'Panfleto A5');
                      },
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text('Quantidade', style: TextStyle(color: mutedColor, fontSize: 12)),
                    const SizedBox(height: 4),
                    TextField(
                      controller: qtyCtrl,
                      keyboardType: TextInputType.number,
                      style: TextStyle(color: textColor),
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text('Arte do Pedido (opcional)', style: TextStyle(color: mutedColor, fontSize: 12)),
                    const SizedBox(height: 4),
                    GestureDetector(
                      onTap: () async {
                        final result = await FilePicker.platform.pickFiles(
                          type: FileType.any,
                        );
                        if (result != null && result.files.isNotEmpty) {
                          setStateDialog(() {
                            selectedFile = result.files.first;
                          });
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isDark ? AGColors.surfaceDark : AGColors.surfaceSoft,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: selectedFile != null ? AGColors.brandGreen : borderColor,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              selectedFile != null ? Icons.check_circle_outline : Icons.cloud_upload_outlined,
                              color: selectedFile != null ? AGColors.brandGreen : mutedColor,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                selectedFile != null ? selectedFile!.name : 'Selecionar arquivo...',
                                style: TextStyle(
                                  color: selectedFile != null ? textColor : mutedColor,
                                  fontSize: 13,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (selectedFile != null)
                              GestureDetector(
                                onTap: () {
                                  setStateDialog(() {
                                    selectedFile = null;
                                  });
                                },
                                child: const Icon(Icons.close, size: 18, color: Colors.red),
                              ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text('Observações', style: TextStyle(color: mutedColor, fontSize: 12)),
                    const SizedBox(height: 4),
                    TextField(
                      controller: obsCtrl,
                      maxLines: 2,
                      style: TextStyle(color: textColor),
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancelar'),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: AGColors.brandGreen),
                  onPressed: () async {
                    final qty = int.tryParse(qtyCtrl.text) ?? 1000;
                    final obs = obsCtrl.text.trim();
                    final client = AuthService().currentUser;

                    if (client == null) return;

                    Navigator.pop(context);
                    try {
                      await OsService().createOrdemServico(
                        clienteId: client.id,
                        especificacoes: {
                          'produtoNome': selectedProduct,
                          'quantidade': qty,
                        },
                        observacoes: obs.isNotEmpty ? obs : null,
                        file: selectedFile,
                      );
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Pedido criado com sucesso!')),
                        );
                      }
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Erro ao criar pedido: $e')),
                        );
                      }
                    }
                  },
                  child: const Text('Confirmar', style: TextStyle(color: Colors.white)),
                ),
              ],
            );
          },
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
    final linkColor = isDark ? AGColors.brandGreen : AGColors.brandGreenDark;
    final surfaceBg = isDark ? AGColors.surfaceDark : AGColors.surfaceSoft;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;

    final user = AuthService().currentUser;
    final nome = user?.nome.split(' ').first ?? 'você';

    return Scaffold(
      backgroundColor: bg,
      body: ListView(
        padding: EdgeInsets.only(
          bottom: 100 + MediaQuery.of(context).padding.bottom,
        ),
        children: [
          // ── Top bar
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
              child: Row(
                children: [
                  AGLogoMark.themed(context, size: 32),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Olá,',
                            style: GoogleFonts.inter(
                                fontSize: 12, color: mutedColor)),
                        Text(
                          nome,
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: textColor,
                            height: 1.1,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Notificação
                  GestureDetector(
                    onTap: () {
                      showDialog(
                        context: context,
                        builder: (context) => AlertDialog(
                          backgroundColor: surfaceBg,
                          title: Text('Notificações', style: TextStyle(color: textColor)),
                          content: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              ListTile(
                                leading: const Icon(Icons.info_outline, color: AGColors.brandGreen),
                                title: Text('Seu pedido #A-2847 está em produção!', style: TextStyle(color: textColor, fontSize: 13)),
                                subtitle: Text('Previsão de entrega para quinta-feira.', style: TextStyle(color: mutedColor, fontSize: 11)),
                              ),
                              Divider(color: borderColor),
                              ListTile(
                                leading: const Icon(Icons.local_offer_outlined, color: AGColors.accentOrange),
                                title: Text('Ganhe 10% de desconto na primeira compra!', style: TextStyle(color: textColor, fontSize: 13)),
                                subtitle: Text('Use o cupom AGRAPH10 no WhatsApp da gráfica.', style: TextStyle(color: mutedColor, fontSize: 11)),
                              ),
                            ],
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('Fechar'),
                            ),
                          ],
                        ),
                      );
                    },
                    child: Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: surfaceBg,
                        shape: BoxShape.circle,
                        border: Border.all(color: borderColor),
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Icon(Icons.notifications_outlined,
                              size: 18, color: textColor),
                          Positioned(
                            top: 8,
                            right: 9,
                            child: Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: AGColors.accentOrange,
                                shape: BoxShape.circle,
                                border: Border.all(color: bg, width: 2),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  const ThemeToggleIcon(size: 38),
                ],
              ),
            ),
          ),

          // ── Hero card agente
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: const AgentHeroCard(),
          ),

          // ── Section: Imprima agora
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text('Imprima agora',
                    style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: textColor)),
                GestureDetector(
                  onTap: () => const TabSwitchNotification(AGTab.catalog).dispatch(context),
                  child: Text('Ver tudo',
                      style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: linkColor)),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: ProductGrid(
              onTapProduct: (label) => _showAddOrderDialog(context, initialProduct: label),
            ),
          ),

          // ── Section: Último pedido
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text('Último pedido',
                    style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: textColor)),
                GestureDetector(
                  onTap: () => const TabSwitchNotification(AGTab.orders).dispatch(context),
                  child: Text('Histórico',
                      style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: linkColor)),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: GestureDetector(
              onTap: () => const TabSwitchNotification(AGTab.orders).dispatch(context),
              child: const LastOrderCard(),
            ),
          ),

          // ── Promo banner
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
            child: GestureDetector(
              onTap: () {
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    backgroundColor: surfaceBg,
                    title: Text('Cupom de Desconto', style: TextStyle(color: textColor)),
                    content: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('🎁', style: TextStyle(fontSize: 48)),
                        const SizedBox(height: 12),
                        Text(
                          '10% OFF no seu primeiro pedido!',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Utilize o cupom abaixo em nosso atendimento no WhatsApp para garantir o seu desconto:',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: mutedColor, fontSize: 13),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                          decoration: BoxDecoration(
                            color: isDark ? AGColors.surfaceDark : AGColors.surfaceSoft,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: borderColor),
                          ),
                          child: Text(
                            'AGRAPH10',
                            style: GoogleFonts.jetBrainsMono(
                              color: AGColors.brandGreen,
                              fontWeight: FontWeight.bold,
                              fontSize: 20,
                              letterSpacing: 2,
                            ),
                          ),
                        ),
                      ],
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Voltar'),
                      ),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: AGColors.brandGreen),
                        onPressed: () async {
                          Navigator.pop(context);
                          final Uri url = Uri.parse("https://wa.me/5511999990000?text=Ol%C3%A1,%20gostaria%20de%20fazer%20um%20pedido%20com%20o%20cupom%20AGRAPH10!");
                          if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Não foi possível abrir o WhatsApp.')),
                              );
                            }
                          }
                        },
                        child: const Text('WhatsApp', style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  ),
                );
              },
              child: const PromoBanner(),
            ),
          ),
        ],
      ),
    );
  }
}
