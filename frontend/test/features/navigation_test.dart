import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:autograph/core/routes/app_routes.dart';
import 'package:autograph/features/auth/presentation/login_screen.dart';
import 'package:autograph/features/os_cliente/presentation/client_history_screen.dart';
import 'package:autograph/features/admin_grafica/presentation/admin_dashboard_screen.dart';

Widget _buildTestApp() {
  return MaterialApp(
    initialRoute: AppRoutes.login,
    onGenerateRoute: AppRouter.onGenerateRoute,
  );
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('Navegação — LoginScreen', () {
    testWidgets('renderiza LoginScreen na rota inicial', (tester) async {
      await tester.pumpWidget(_buildTestApp());
      expect(find.byType(LoginScreen), findsOneWidget);
    });

    testWidgets('login como Cliente navega para ClientHistoryScreen', (tester) async {
      await tester.pumpWidget(_buildTestApp());

      await tester.enterText(find.byKey(const Key('field_email')), 'cliente@test.com');
      await tester.enterText(find.byKey(const Key('field_senha')), '1234');
      await tester.tap(find.byKey(const Key('btn_login')));
      await tester.pumpAndSettle();

      expect(find.byType(ClientHistoryScreen), findsOneWidget);
    });

    testWidgets('login como Admin navega para AdminDashboardScreen', (tester) async {
      await tester.pumpWidget(_buildTestApp());

      await tester.enterText(find.byKey(const Key('field_email')), 'admin@autograph.com');
      await tester.enterText(find.byKey(const Key('field_senha')), 'admin123');
      await tester.tap(find.byKey(const Key('btn_login')));
      await tester.pumpAndSettle();

      expect(find.byType(AdminDashboardScreen), findsOneWidget);
    });
  });

  group('Navegação — Fallback 404', () {
    testWidgets('rota não mapeada exibe tela 404 com botão de retorno', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          onGenerateRoute: AppRouter.onGenerateRoute,
          initialRoute: '/rota-inexistente',
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('404 — Página não encontrada'), findsOneWidget);
      expect(find.byKey(const Key('btn_go_login_from_404')), findsOneWidget);
    });
  });
}
