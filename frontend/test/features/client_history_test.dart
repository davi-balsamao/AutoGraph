import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:file_picker/file_picker.dart';
import 'package:autograph/core/models/ordem_servico.dart';
import 'package:autograph/core/services/os_service.dart';
import 'package:autograph/features/os_cliente/presentation/client_history_screen.dart';

class MockHistoryOsService implements OsService {
  @override
  String get baseUrl => '';

  @override
  Future<List<OrdemServico>> fetchOrdensServico({StatusOS? status}) async {
    final now = DateTime.now();
    return [
      OrdemServico(
        id: 'os-001',
        clienteId: 'c1',
        status: StatusOS.emProducao,
        especificacoes: {
          'produto': 'Cartão de Visita Premium',
          'material': 'Couchê 300g',
          'tamanho': '9x5 cm',
          'quantidade': '1000 un',
          'arte_url': 'https://example.com/arte.pdf',
        },
        observacoes: 'Fundo fosco com verniz localizado.',
        criadoEm: now.subtract(const Duration(days: 1)),
        atualizadoEm: now,
      ),
      OrdemServico(
        id: 'os-002',
        clienteId: 'c1',
        status: StatusOS.entregue,
        especificacoes: {
          'produto': 'Panfleto de Ofertas',
        },
        criadoEm: now.subtract(const Duration(days: 5)),
        atualizadoEm: now.subtract(const Duration(days: 1)),
      ),
    ];
  }

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
    throw UnimplementedError();
  }
}

void main() {
  group('ClientHistoryScreen — Testes do Histórico de Pedidos', () {
    late MockHistoryOsService mockOsService;

    setUp(() {
      mockOsService = MockHistoryOsService();
      OsService.setMockInstance(mockOsService);
    });

    testWidgets('renderiza ordens da API com layout preservado e botões de reorder', (tester) async {
      await tester.pumpWidget(const MaterialApp(
        home: ClientHistoryScreen(),
      ));
      await tester.pumpAndSettle();

      // Navega para a aba de histórico (índice 1 no BottomNavigationBar)
      await tester.tap(find.text('Histórico'));
      await tester.pumpAndSettle();

      // Verifica se os resumos dos produtos vindos da API mock estão presentes
      expect(find.text('Cartão de Visita Premium'), findsOneWidget);
      expect(find.text('Panfleto de Ofertas'), findsOneWidget);

      // Verifica os botões "Pedir Novamente" nos cards
      expect(find.text('Pedir Novamente'), findsWidgets);
    });

    testWidgets('abre o modal de detalhes ao clicar em um card de pedido', (tester) async {
      await tester.pumpWidget(const MaterialApp(
        home: ClientHistoryScreen(),
      ));
      await tester.pumpAndSettle();

      // Navega para a aba de histórico
      await tester.tap(find.text('Histórico'));
      await tester.pumpAndSettle();

      // Clica no card do Cartão de Visita Premium
      await tester.tap(find.text('Cartão de Visita Premium'));
      await tester.pumpAndSettle();

      // Valida que o modal de detalhes foi aberto exibindo as informações extraídas
      expect(find.text('Descrição'), findsOneWidget);
      expect(find.text('Material'), findsOneWidget);
      expect(find.text('Couchê 300g'), findsOneWidget);
      expect(find.text('Tamanho'), findsOneWidget);
      expect(find.text('9x5 cm'), findsOneWidget);
      expect(find.text('Quantidade'), findsOneWidget);
      expect(find.text('1000 un'), findsOneWidget);
      expect(find.text('VISUALIZAR ARTE'), findsOneWidget);
    });
  });
}
