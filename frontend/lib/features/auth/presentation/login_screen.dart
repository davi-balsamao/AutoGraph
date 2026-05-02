import 'package:flutter/material.dart';
import '../../../core/routes/app_routes.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login — AutoGraph')),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Login', style: TextStyle(fontSize: 24)),
            const SizedBox(height: 32),
            ElevatedButton(
              key: const Key('btn_login_as_client'),
              onPressed: () => Navigator.pushNamed(
                context,
                AppRoutes.clientHistory,
              ),
              child: const Text('Entrar como Cliente'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              key: const Key('btn_login_as_admin'),
              onPressed: () => Navigator.pushNamed(
                context,
                AppRoutes.adminDashboard,
              ),
              child: const Text('Entrar como Admin'),
            ),
          ],
        ),
      ),
    );
  }
}
