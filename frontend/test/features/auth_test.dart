import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:autograph/core/routes/app_routes.dart';

Widget _buildTestApp() {
  return MaterialApp(
    initialRoute: AppRoutes.login,
    onGenerateRoute: AppRouter.onGenerateRoute,
  );
}

void main() {
  group('LoginScreen — Renderização', () {
    testWidgets('renderiza campos de e-mail e senha', (tester) async {
      await tester.pumpWidget(_buildTestApp());
      expect(find.byKey(const Key('field_email')), findsOneWidget);
      expect(find.byKey(const Key('field_senha')), findsOneWidget);
      expect(find.byKey(const Key('btn_login')), findsOneWidget);
    });

    testWidgets('renderiza logo e título AutoGraph', (tester) async {
      await tester.pumpWidget(_buildTestApp());
      expect(find.text('AutoGraph'), findsOneWidget);
      expect(find.byIcon(Icons.auto_awesome), findsOneWidget);
    });
  });

  group('LoginScreen — Validação de Formulário', () {
    testWidgets('mostra erro quando e-mail está vazio', (tester) async {
      await tester.pumpWidget(_buildTestApp());
      await tester.tap(find.byKey(const Key('btn_login')));
      await tester.pumpAndSettle();
      expect(find.text('Informe o e-mail'), findsOneWidget);
    });

    testWidgets('mostra erro quando e-mail é inválido', (tester) async {
      await tester.pumpWidget(_buildTestApp());
      await tester.enterText(find.byKey(const Key('field_email')), 'emailsemarroba');
      await tester.enterText(find.byKey(const Key('field_senha')), '1234');
      await tester.tap(find.byKey(const Key('btn_login')));
      await tester.pumpAndSettle();
      expect(find.text('E-mail inválido'), findsOneWidget);
    });

    testWidgets('mostra erro quando senha é muito curta', (tester) async {
      await tester.pumpWidget(_buildTestApp());
      await tester.enterText(find.byKey(const Key('field_email')), 'user@test.com');
      await tester.enterText(find.byKey(const Key('field_senha')), '12');
      await tester.tap(find.byKey(const Key('btn_login')));
      await tester.pumpAndSettle();
      expect(find.text('Mínimo 4 caracteres'), findsOneWidget);
    });
  });

  group('LoginScreen — Toggle de Senha', () {
    testWidgets('alterna visibilidade da senha', (tester) async {
      await tester.pumpWidget(_buildTestApp());
      // Senha começa obscurecida (visibility_off ícone)
      expect(find.byIcon(Icons.visibility_off), findsOneWidget);
      
      await tester.tap(find.byKey(const Key('btn_toggle_senha')));
      await tester.pumpAndSettle();
      
      // Após tap, mostra visibility ícone
      expect(find.byIcon(Icons.visibility), findsOneWidget);
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
