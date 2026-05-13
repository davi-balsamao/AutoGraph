import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:autograph/core/routes/app_routes.dart';
import 'package:autograph/core/services/auth_service.dart';

void main() {
  group('AdminDashboardScreen — Renderização', () {
    setUp(() async {
      SharedPreferences.setMockInitialValues({});
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

      expect(find.text('Aguardando Orçamento'), findsOneWidget);
      expect(find.text('Em Produção'), findsOneWidget);
    });

    testWidgets('aba Financeiro mostra KPIs', (tester) async {
      await tester.pumpWidget(MaterialApp(
        initialRoute: AppRoutes.adminDashboard,
        onGenerateRoute: AppRouter.onGenerateRoute,
      ));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Financeiro'));
      await tester.pumpAndSettle();

      expect(find.text('Faturamento'), findsOneWidget);
      expect(find.text('OS Finalizadas'), findsOneWidget);
      expect(find.text('Ticket Médio'), findsOneWidget);
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
