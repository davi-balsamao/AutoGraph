import 'package:flutter/material.dart';
import '../../../core/utils/snackbar_util.dart';

class ClientHistoryScreen extends StatefulWidget {
  const ClientHistoryScreen({super.key});

  @override
  State<ClientHistoryScreen> createState() => _ClientHistoryScreenState();
}

class _ClientHistoryScreenState extends State<ClientHistoryScreen> {
  bool _isLoading = false;

  Future<void> _simulateFetchHistory() async {
    setState(() => _isLoading = true);
    try {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return;
      SnackbarUtil.showSuccess(context, 'Histórico carregado com sucesso!');
    } catch (e) {
      if (mounted) SnackbarUtil.showError(context, 'Erro ao buscar histórico');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Histórico do Cliente')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Histórico do Cliente', style: TextStyle(fontSize: 24)),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _isLoading ? null : _simulateFetchHistory,
              child: _isLoading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Buscar Histórico'),
            ),
          ],
        ),
      ),
    );
  }
}
