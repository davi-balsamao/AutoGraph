import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:file_picker/file_picker.dart';
import 'package:autograph/core/models/produto.dart';
import 'package:autograph/core/models/ordem_servico.dart';
import 'package:autograph/core/services/os_service.dart';
import 'package:autograph/features/os_cliente/presentation/order_wizard_screen.dart';

class MockWizardOsService implements OsService {
  bool calledCreate = false;
  Map<String, dynamic>? lastSpecs;
  String? lastObs;

  @override
  String get baseUrl => '';

  @override
  Future<List<OrdemServico>> fetchOrdensServico({StatusOS? status}) async => [];

  @override
  Future<void> updateOS(String id, {Map<String, dynamic>? especificacoes, String? observacoes}) async {}

  @override
  Future<void> updateStatus(String id, StatusOS status) async {}

  @override
  Future<void> startTimer(String id) async {}

  @override
  Future<void> stopTimer(String id) async {}

  @override
  Future<OrdemServico> createOrdemServico({
    required String clienteId,
    required Map<String, dynamic> especificacoes,
    String? observacoes,
    PlatformFile? file,
  }) async {
    calledCreate = true;
    lastSpecs = especificacoes;
    lastObs = observacoes;
    final now = DateTime.now();
    return OrdemServico(
      id: 'os-created-123',
      clienteId: clienteId,
      status: StatusOS.criada,
      especificacoes: especificacoes,
      observacoes: observacoes,
      criadoEm: now,
      atualizadoEm: now,
    );
  }
}

void main() {
  group('OrderWizardScreen — Testes de Interface e Submissão', () {
    late MockWizardOsService mockOsService;
    final dummyProduto = Produto(
      id: 'prod-001',
      nome: 'Banner Personalizado',
      precoBase: 120.0,
      criadoEm: DateTime.now(),
    );

    setUp(() {
      mockOsService = MockWizardOsService();
      OsService.setMockInstance(mockOsService);
    });

    testWidgets('renderiza campos de dimensões, botão de arquivo e observações', (tester) async {
      await tester.pumpWidget(MaterialApp(
        home: OrderWizardScreen(produto: dummyProduto),
      ));
      await tester.pumpAndSettle();

      // Verifica o título e nome do produto
      expect(find.text('Personalizar Pedido'), findsOneWidget);
      expect(find.text('Banner Personalizado'), findsOneWidget);

      // Verifica os inputs pelas Keys
      expect(find.byKey(const Key('input_largura')), findsOneWidget);
      expect(find.byKey(const Key('input_altura')), findsOneWidget);
      expect(find.byKey(const Key('btn_pick_file')), findsOneWidget);
      expect(find.byKey(const Key('input_observacoes')), findsOneWidget);
      expect(find.byKey(const Key('btn_submit_order')), findsOneWidget);
    });

    testWidgets('preenche o formulário e envia o pedido com sucesso', (tester) async {
      await tester.pumpWidget(MaterialApp(
        home: OrderWizardScreen(produto: dummyProduto),
      ));
      await tester.pumpAndSettle();

      // Preenche os campos de dimensões
      await tester.enterText(find.byKey(const Key('input_largura')), '120 cm');
      await tester.enterText(find.byKey(const Key('input_altura')), '90 cm');

      // Preenche as observações
      await tester.enterText(
        find.byKey(const Key('input_observacoes')),
        'Acabamento com ilhós nas pontas.',
      );

      // Garante que o botão de envio esteja visível na tela de teste antes de clicar
      await tester.ensureVisible(find.byKey(const Key('btn_submit_order')));
      await tester.tap(find.byKey(const Key('btn_submit_order')));
      await tester.pump(); // Inicia o loading
      await tester.pumpAndSettle(); // Aguarda a conclusão e fechamento do Snackbar/Navigator

      // Valida que o serviço mock foi chamado corretamente
      expect(mockOsService.calledCreate, isTrue);
      expect(mockOsService.lastObs, 'Acabamento com ilhós nas pontas.');
      expect(
        mockOsService.lastSpecs?['dimensoes']?['largura'],
        '120 cm',
      );
    });
  });
}
