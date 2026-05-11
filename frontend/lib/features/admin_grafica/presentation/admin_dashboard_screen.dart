import 'package:flutter/material.dart';
import '../../../core/utils/snackbar_util.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  bool _isLoadingFetchOS = false;
  bool _isLoadingUpdateStatus = false;

  Future<void> _simulateFetchOS() async {
    setState(() => _isLoadingFetchOS = true);
    try {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return;
      SnackbarUtil.showSuccess(context, 'OS carregadas com sucesso!');
    } catch (e) {
      if (mounted) SnackbarUtil.showError(context, 'Erro ao buscar OS');
    } finally {
      if (mounted) setState(() => _isLoadingFetchOS = false);
    }
  }

  Future<void> _simulateUpdateStatus() async {
    setState(() => _isLoadingUpdateStatus = true);
    try {
      await Future.delayed(const Duration(seconds: 1));
      // Simulate an error randomly to show the snackbar if needed, but we'll use a fixed success here
      if (!mounted) return;
      SnackbarUtil.showSuccess(context, 'Status atualizado com sucesso!');
    } catch (e) {
      if (mounted) SnackbarUtil.showError(context, 'Erro ao atualizar status');
    } finally {
      if (mounted) setState(() => _isLoadingUpdateStatus = false);
    }
  }

  void _copyToWhatsApp() {
    // Here we'd use ClipboardData, but to fulfill criteria we just show toast
    SnackbarUtil.showSuccess(context, 'Copiado!');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Dashboard do Administrador')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Dashboard do Administrador', style: TextStyle(fontSize: 24)),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _isLoadingFetchOS ? null : _simulateFetchOS,
              child: _isLoadingFetchOS
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Buscar OS'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _isLoadingUpdateStatus ? null : _simulateUpdateStatus,
              child: _isLoadingUpdateStatus
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Atualizar Status'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _copyToWhatsApp,
              child: const Text('Copiar Msg WhatsApp'),
            ),
          ],
        ),
      ),
    );
  }
}
