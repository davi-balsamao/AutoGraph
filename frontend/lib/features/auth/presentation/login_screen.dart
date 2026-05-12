import 'package:flutter/material.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/utils/snackbar_util.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _isLoadingClient = false;
  bool _isLoadingAdmin = false;

  Future<void> _simulateLogin(bool isAdmin) async {
    setState(() {
      if (isAdmin) _isLoadingAdmin = true;
      else _isLoadingClient = true;
    });

    try {
      // Simulate HTTP call
      await Future.delayed(const Duration(seconds: 2));
      
      // Simulate an arbitrary random error (e.g. 20% chance) just for testing if needed
      // but let's just make it succeed to proceed, we will use a separate button to force error or just show success
      
      if (!mounted) return;
      
      Navigator.pushNamed(
        context,
        isAdmin ? AppRoutes.adminDashboard : AppRoutes.clientHistory,
      );
    } catch (e) {
      if (mounted) {
        SnackbarUtil.showError(context, 'Erro ao fazer login: $e');
      }
    } finally {
      if (mounted) {
        setState(() {
          if (isAdmin) _isLoadingAdmin = false;
          else _isLoadingClient = false;
        });
      }
    }
  }

  Future<void> _simulateError() async {
    setState(() {
      _isLoadingClient = true;
    });
    try {
      await Future.delayed(const Duration(seconds: 1));
      throw Exception('Falha na API');
    } catch (e) {
      if (mounted) {
        SnackbarUtil.showError(context, 'Erro ao conectar com servidor (Simulado)');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingClient = false;
        });
      }
    }
  }

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
              onPressed: (_isLoadingClient || _isLoadingAdmin) 
                  ? null 
                  : () => _simulateLogin(false),
              child: _isLoadingClient && !_isLoadingAdmin
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Entrar como Cliente'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              key: const Key('btn_login_as_admin'),
              onPressed: (_isLoadingClient || _isLoadingAdmin) 
                  ? null 
                  : () => _simulateLogin(true),
              child: _isLoadingAdmin
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Entrar como Admin'),
            ),
            const SizedBox(height: 32),
            TextButton(
              onPressed: (_isLoadingClient || _isLoadingAdmin) 
                  ? null 
                  : _simulateError,
              child: const Text('Testar Erro de API', style: TextStyle(color: Colors.red)),
            )
          ],
        ),
      ),
    );
  }
}
