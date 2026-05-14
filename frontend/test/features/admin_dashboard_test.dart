import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:autograph/core/routes/app_routes.dart';
import 'package:autograph/core/services/auth_service.dart';
import 'package:autograph/core/services/os_service.dart';
import 'package:autograph/core/models/ordem_servico.dart';

class MockOsService implements OsService {
  @override
  String get baseUrl => '';

  @override
  Future<List<OrdemServico>> fetchOrdensServico({StatusOS? status}) async {
    final now = DateTime.now();
    return [
      OrdemServico(id: 'os-001', clienteId: 'c1', status: StatusOS.aguardandoOrcamento, especificacoes: {'produto': 'Mock'}, criadoEm: now, atualizadoEm: now),
      OrdemServico(id: 'os-002', clienteId: 'c1', status: StatusOS.emProducao, especificacoes: {'produto': 'Mock'}, criadoEm: now, atualizadoEm: now),
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
}

void main() {
  group('AdminDashboardScreen — Renderização', () {
    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      OsService.setMockInstance(MockOsService());
      await AuthService().login('admin@autograph.com', 'admin123');
    });

    testWidgets('renderiza as abas Kanban e Financeiro', (tester) async {
      await tester.pumpWidget(MaterialApp(
        initialRoute: AppRoutes.adminDashboard,
        onGenerateRoute: AppRouter.onGenerateRoute,
      ));
      await tester.pumpAndSettle();

      expect(find.text('Kanban'), findsOneWidget);
      expect(find.text('Financeiro'), findsOneWidget);
    });

    testWidgets('aba Kanban mostra colunas de status', (tester) async {
      await tester.pumpWidget(MaterialApp(
        initialRoute: AppRoutes.adminDashboard,
        onGenerateRoute: AppRouter.onGenerateRoute,
      ));
      await tester.pumpAndSettle();

      expect(find.text('AGUARDANDO ORÇAMENTO'), findsOneWidget);
      expect(find.text('EM PRODUÇÃO'), findsOneWidget);
    });

    testWidgets('aba Financeiro mostra KPIs', (tester) async {
      await tester.pumpWidget(MaterialApp(
        initialRoute: AppRoutes.adminDashboard,
        onGenerateRoute: AppRouter.onGenerateRoute,
      ));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Financeiro'));
      await tester.pumpAndSettle();

      expect(find.text('FATURAMENTO'), findsOneWidget);
      expect(find.text('OS FINALIZADAS'), findsOneWidget);
      expect(find.text('TICKET MÉDIO'), findsOneWidget);
    });

    testWidgets('botão logout existe na AppBar', (tester) async {
      await tester.pumpWidget(MaterialApp(
        initialRoute: AppRoutes.adminDashboard,
        onGenerateRoute: AppRouter.onGenerateRoute,
      ));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('btn_logout')), findsOneWidget);
    });
  });
}
