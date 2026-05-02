import 'package:flutter/material.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/os_cliente/presentation/client_history_screen.dart';
import '../../features/admin_grafica/presentation/admin_dashboard_screen.dart';

abstract final class AppRoutes {
  static const String login = '/login';
  static const String clientHistory = '/cliente/historico';
  static const String adminDashboard = '/admin/dashboard';
}

abstract final class AppRouter {
  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.login:
        return MaterialPageRoute(builder: (_) => const LoginScreen());

      case AppRoutes.clientHistory:
        return MaterialPageRoute(builder: (_) => const ClientHistoryScreen());

      case AppRoutes.adminDashboard:
        return MaterialPageRoute(builder: (_) => const AdminDashboardScreen());

      default:
        return MaterialPageRoute(builder: (_) => const _NotFoundScreen());
    }
  }
}

class _NotFoundScreen extends StatelessWidget {
  const _NotFoundScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('404 — Página não encontrada')),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 64),
            const SizedBox(height: 16),
            const Text('Rota não mapeada.'),
            const SizedBox(height: 24),
            ElevatedButton(
              key: const Key('btn_go_login_from_404'),
              onPressed: () => Navigator.pushReplacementNamed(
                context,
                AppRoutes.login,
              ),
              child: const Text('Voltar ao Login'),
            ),
          ],
        ),
      ),
    );
  }
}
