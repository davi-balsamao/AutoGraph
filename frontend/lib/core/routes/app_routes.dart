import 'package:flutter/material.dart';
import '../../features/auth/presentation/forgot_password_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/customer/welcome/welcome_screen.dart';
import '../../features/customer/auth/login_screen.dart';
import '../../features/customer/auth/signup_screen.dart';
import '../../features/customer/customer_shell.dart';
import '../../features/admin/auth/admin_login_screen.dart';
import '../../features/admin/admin_shell.dart';
import '../../features/admin_grafica/presentation/os_details_screen.dart';
import '../models/ordem_servico.dart';
import '../services/auth_service.dart';

abstract final class AppRoutes {
  static const String landing        = '/';
  static const String login          = '/login';
  static const String adminLogin     = '/admin/login';
  static const String register       = '/register';
  static const String forgotPassword = '/forgot-password';

  // App cliente
  static const String customerHome   = '/cliente/home';
  static const String chat           = '/cliente/chat';

  // Admin
  static const String adminHome      = '/admin/home';
  static const String osDetails      = '/admin/os/details';
}

abstract final class AppRouter {
  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      // ── Welcome
      case AppRoutes.landing:
        return MaterialPageRoute(builder: (_) => const WelcomeScreen());

      // ── Login cliente
      case AppRoutes.login:
        return MaterialPageRoute(builder: (_) => const CustomerLoginScreen());

      // ── Login admin
      case AppRoutes.adminLogin:
        return MaterialPageRoute(builder: (_) => const AdminLoginScreen());

      // ── Signup
      case AppRoutes.register:
        final isAdminCreating = settings.arguments == true;
        if (isAdminCreating) {
          return MaterialPageRoute(
              builder: (_) => RegisterScreen(isAdminCreating: true));
        }
        return MaterialPageRoute(builder: (_) => const CustomerSignupScreen());

      case AppRoutes.forgotPassword:
        return MaterialPageRoute(builder: (_) => const ForgotPasswordScreen());

      // ── Chat (placeholder até Sprint 1 completo)
      case AppRoutes.chat:
        if (!AuthService().isLoggedIn) {
          return MaterialPageRoute(builder: (_) => const CustomerLoginScreen());
        }
        return MaterialPageRoute(builder: (_) => const CustomerShell());

      // ── App cliente
      case AppRoutes.customerHome:
        if (!AuthService().isLoggedIn || AuthService().isAdmin) {
          return MaterialPageRoute(builder: (_) => const CustomerLoginScreen());
        }
        return MaterialPageRoute(builder: (_) => const CustomerShell());

      // ── Admin
      case AppRoutes.adminHome:
        if (!AuthService().isLoggedIn || !AuthService().isAdmin) {
          return MaterialPageRoute(builder: (_) => const AdminLoginScreen());
        }
        return MaterialPageRoute(builder: (_) => const AdminShell());

      case AppRoutes.osDetails:
        if (!AuthService().isLoggedIn || !AuthService().isAdmin) {
          return MaterialPageRoute(builder: (_) => const AdminLoginScreen());
        }
        if (settings.arguments is! OrdemServico) {
          return MaterialPageRoute(builder: (_) => const _NotFoundScreen());
        }
        final os = settings.arguments as OrdemServico;
        return MaterialPageRoute(builder: (_) => OsDetailsScreen(os: os));

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
              onPressed: () =>
                  Navigator.pushReplacementNamed(context, AppRoutes.login),
              child: const Text('Voltar ao Login'),
            ),
          ],
        ),
      ),
    );
  }
}
