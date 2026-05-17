import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import '../../../core/services/os_service.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/utils/snackbar_util.dart';
import '../../../core/theme/app_theme.dart';

class OrderWizardScreen extends StatefulWidget {
  final dynamic produto; // Espera-se a model Produto
  const OrderWizardScreen({super.key, required this.produto});

  @override
  State<OrderWizardScreen> createState() => _OrderWizardScreenState();
}

class _OrderWizardScreenState extends State<OrderWizardScreen> {
  final _formKey = GlobalKey<FormState>();
  final _larguraController = TextEditingController();
  final _alturaController = TextEditingController();
  final _observacoesController = TextEditingController();
  final _enderecoConfirmacaoCtrl = TextEditingController();
  final _referenciaConfirmacaoCtrl = TextEditingController();
  
  String _opcaoEntrega = 'retirada'; // 'retirada' ou 'entrega'
  PlatformFile? _selectedFile;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final user = AuthService().currentUser;
    if (user != null) {
      _enderecoConfirmacaoCtrl.text = user.enderecoCompleto ?? '';
      _referenciaConfirmacaoCtrl.text = user.enderecoReferencia ?? '';
    }
  }

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
        withData: true, // Importante para Web carregar os bytes diretamente
      );

      if (result != null && result.files.isNotEmpty) {
        setState(() {
          _selectedFile = result.files.first;
        });
      }
    } catch (e) {
      if (mounted) {
        SnackbarUtil.showError(context, 'Erro ao selecionar arquivo: $e');
      }
    }
  }

  Future<void> _submitOrder() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final clienteId = AuthService().currentUser?.id ?? 'c1'; // Fallback seguro
      final especificacoes = {
        'produtoId': widget.produto.id,
        'produtoNome': widget.produto.nome,
        'dimensoes': {
          'largura': _larguraController.text.trim(),
          'altura': _alturaController.text.trim(),
        },
        'precoBaseReferencia': widget.produto.precoBase,
        'opcaoEntrega': _opcaoEntrega,
        'enderecoEntrega': _opcaoEntrega == 'entrega' ? _enderecoConfirmacaoCtrl.text.trim() : null,
        'referenciaEntrega': _opcaoEntrega == 'entrega' ? _referenciaConfirmacaoCtrl.text.trim() : null,
      };

      await OsService().createOrdemServico(
        clienteId: clienteId,
        especificacoes: especificacoes,
        observacoes: _observacoesController.text.trim(),
        file: _selectedFile,
      );

      if (mounted) {
        SnackbarUtil.showSuccess(context, 'Pedido enviado com sucesso para a produção!');
        if (Navigator.canPop(context)) {
          Navigator.pop(context, true); // Retorna true para sinalizar recarregamento
        }
      }
    } catch (e) {
      if (mounted) {
        SnackbarUtil.showError(context, 'Falha ao enviar pedido: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _larguraController.dispose();
    _alturaController.dispose();
    _observacoesController.dispose();
    _enderecoConfirmacaoCtrl.dispose();
    _referenciaConfirmacaoCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text('Personalizar Pedido', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Cabeçalho do Produto
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: isDark ? cs.surfaceContainerHighest.withValues(alpha: 0.5) : AppColors.surfaceSoft,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: cs.outlineVariant.withValues(alpha: 0.5)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.produto.nome,
                          style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: cs.onSurface),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Preço base de referência: R\$ ${widget.produto.precoBase.toStringAsFixed(2)}',
                          style: TextStyle(color: AppColors.brandGreen, fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Seção 1: Dimensões
                  Text(
                    '1. Dimensões do Produto',
                    style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: cs.onSurface),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          key: const Key('input_largura'),
                          controller: _larguraController,
                          decoration: const InputDecoration(
                            labelText: 'Largura (ex: 9cm)',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.straighten),
                          ),
                          validator: (v) => v == null || v.isEmpty ? 'Obrigatório' : null,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextFormField(
                          key: const Key('input_altura'),
                          controller: _alturaController,
                          decoration: const InputDecoration(
                            labelText: 'Altura (ex: 5cm)',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.height),
                          ),
                          validator: (v) => v == null || v.isEmpty ? 'Obrigatório' : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Seção 2: Arte Pronta
                  Text(
                    '2. Envio da Arte Pronta',
                    style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: cs.onSurface),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Envie nos formatos JPG, PNG ou PDF com boa resolução. Caso não possua arte, deixe em branco e descreva nas observações.',
                    style: TextStyle(fontSize: 13, color: cs.onSurface.withValues(alpha: 0.6)),
                  ),
                  const SizedBox(height: 16),
                  InkWell(
                    key: const Key('btn_pick_file'),
                    onTap: _pickFile,
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: _selectedFile != null ? AppColors.brandGreen : cs.outlineVariant,
                          width: _selectedFile != null ? 2 : 1,
                          style: BorderStyle.solid,
                        ),
                        borderRadius: BorderRadius.circular(12),
                        color: _selectedFile != null
                            ? AppColors.brandGreen.withValues(alpha: 0.05)
                            : Colors.transparent,
                      ),
                      child: Column(
                        children: [
                          Icon(
                            _selectedFile != null ? Icons.check_circle : Icons.cloud_upload_outlined,
                            color: _selectedFile != null ? AppColors.brandGreen : cs.primary,
                            size: 36,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            _selectedFile != null ? _selectedFile!.name : 'Clique para selecionar o arquivo da arte',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: _selectedFile != null ? cs.onSurface : cs.primary,
                            ),
                          ),
                          if (_selectedFile != null && _selectedFile!.size > 0) ...[
                            const SizedBox(height: 4),
                            Text(
                              '${(_selectedFile!.size / 1024).toStringAsFixed(1)} KB',
                              style: TextStyle(fontSize: 12, color: cs.onSurface.withValues(alpha: 0.5)),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Seção 3: Método de Recebimento
                  Text(
                    '3. Método de Recebimento',
                    style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: cs.onSurface),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Escolha se deseja receber o produto em seu endereço ou retirar na loja física.',
                    style: TextStyle(fontSize: 13, color: cs.onSurface.withValues(alpha: 0.6)),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: ChoiceChip(
                          key: const Key('chip_retirada'),
                          label: const Center(child: Text('Retirar na Loja')),
                          selected: _opcaoEntrega == 'retirada',
                          onSelected: (selected) {
                            if (selected) setState(() => _opcaoEntrega = 'retirada');
                          },
                          selectedColor: AppColors.brandGreen.withValues(alpha: 0.2),
                          checkmarkColor: AppColors.brandGreen,
                          labelStyle: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: _opcaoEntrega == 'retirada' ? AppColors.brandGreen : cs.onSurface,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: ChoiceChip(
                          key: const Key('chip_entrega'),
                          label: const Center(child: Text('Entrega em Casa')),
                          selected: _opcaoEntrega == 'entrega',
                          onSelected: (selected) {
                            if (selected) setState(() => _opcaoEntrega = 'entrega');
                          },
                          selectedColor: AppColors.brandGreen.withValues(alpha: 0.2),
                          checkmarkColor: AppColors.brandGreen,
                          labelStyle: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: _opcaoEntrega == 'entrega' ? AppColors.brandGreen : cs.onSurface,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (_opcaoEntrega == 'entrega') ...[
                    const SizedBox(height: 24),
                    Text(
                      'Confirmar Endereço de Entrega',
                      style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: cs.onSurface),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      key: const Key('input_confirm_endereco'),
                      controller: _enderecoConfirmacaoCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Endereço Completo',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.home_outlined),
                      ),
                      validator: (v) => _opcaoEntrega == 'entrega' && (v == null || v.isEmpty) ? 'Obrigatório para entrega' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      key: const Key('input_confirm_referencia'),
                      controller: _referenciaConfirmacaoCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Ponto de Referência',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.pin_drop_outlined),
                      ),
                      validator: (v) => _opcaoEntrega == 'entrega' && (v == null || v.isEmpty) ? 'Obrigatório para entrega' : null,
                    ),
                  ],
                  const SizedBox(height: 32),

                  // Seção 4: Observações
                  Text(
                    '4. Observações / Descrição da Arte',
                    style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: cs.onSurface),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Descreva detalhes de acabamento desejados ou orientações sobre como montar sua arte.',
                    style: TextStyle(fontSize: 13, color: cs.onSurface.withValues(alpha: 0.6)),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    key: const Key('input_observacoes'),
                    controller: _observacoesController,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      hintText: 'Ex: Quero a arte com fundo azul escuro e logo centralizada em dourado...',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 48),

                  // Botão de Envio
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      key: const Key('btn_submit_order'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.brandGreen,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 2,
                      ),
                      onPressed: _isLoading ? null : _submitOrder,
                      child: Text(
                        'ENVIAR PEDIDO',
                        style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_isLoading)
            Container(
              color: Colors.black.withValues(alpha: 0.3),
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            ),
        ],
      ),
    );
  }
}
