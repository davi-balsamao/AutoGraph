import 'package:flutter/material.dart';
import '../../../core/models/ordem_servico.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/utils/snackbar_util.dart';

class ClientHistoryScreen extends StatefulWidget {
  const ClientHistoryScreen({super.key});

  @override
  State<ClientHistoryScreen> createState() => _ClientHistoryScreenState();
}

class _ClientHistoryScreenState extends State<ClientHistoryScreen> {
  bool _isLoading = false;
  List<OrdemServico> _ordens = [];

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  Future<void> _fetchHistory() async {
    setState(() => _isLoading = true);
    try {
      await Future.delayed(const Duration(milliseconds: 600));
      final now = DateTime.now();
      _ordens = [
        OrdemServico(id: 'os-001', clienteId: 'c1', status: StatusOS.emProducao, especificacoes: {'produto': 'Panfletos', 'requisitos': [{'pergunta': 'Quantidade', 'resposta': '500 un'}]}, criadoEm: now.subtract(const Duration(days: 2)), atualizadoEm: now),
        OrdemServico(id: 'os-004', clienteId: 'c1', status: StatusOS.entregue, especificacoes: {'produto': 'Apostila', 'requisitos': [{'pergunta': 'Páginas', 'resposta': '50'}]}, criadoEm: now.subtract(const Duration(days: 10)), atualizadoEm: now.subtract(const Duration(days: 3))),
        OrdemServico(id: 'os-005', clienteId: 'c1', status: StatusOS.prontaParaRetirada, especificacoes: {'produto': 'Cartão de Visita', 'requisitos': [{'pergunta': 'Quantidade', 'resposta': '1000 un'}]}, criadoEm: now.subtract(const Duration(days: 5)), atualizadoEm: now.subtract(const Duration(days: 1))),
      ];
      if (mounted) SnackbarUtil.showSuccess(context, 'Histórico carregado com sucesso!');
    } catch (e) {
      if (mounted) SnackbarUtil.showError(context, 'Erro ao buscar histórico');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Color _statusColor(StatusOS s) {
    switch (s) {
      case StatusOS.criada: return Colors.grey;
      case StatusOS.aguardandoOrcamento: return Colors.orange;
      case StatusOS.emProducao: return Colors.blue;
      case StatusOS.prontaParaRetirada: return Colors.green;
      case StatusOS.entregue: return Colors.teal;
      case StatusOS.cancelada: return Colors.red;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Minhas Ordens de Serviço'),
        actions: [
          IconButton(
            key: const Key('btn_logout_client'),
            icon: const Icon(Icons.logout),
            onPressed: () async {
              final nav = Navigator.of(context);
              await AuthService().logout();
              if (mounted) nav.pushReplacementNamed(AppRoutes.login);
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _ordens.isEmpty
              ? const Center(child: Text('Nenhuma OS encontrada.'))
              : RefreshIndicator(
                  onRefresh: _fetchHistory,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _ordens.length,
                    itemBuilder: (context, i) {
                      final os = _ordens[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: ListTile(
                          leading: CircleAvatar(backgroundColor: _statusColor(os.status), child: const Icon(Icons.description, color: Colors.white, size: 20)),
                          title: Text(os.produtoResumo, style: const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Text('Status: ${os.status.label}\nCriado em: ${os.criadoEm.day}/${os.criadoEm.month}/${os.criadoEm.year}'),
                          isThreeLine: true,
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: _statusColor(os.status).withAlpha(30), borderRadius: BorderRadius.circular(12)),
                            child: Text(os.status.label, style: TextStyle(fontSize: 11, color: _statusColor(os.status), fontWeight: FontWeight.bold)),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
