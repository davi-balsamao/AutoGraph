import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/services/os_service.dart';
import '../../../core/models/ordem_servico.dart';
import 'admin_chat_conversation_screen.dart';
import '../../../core/theme/app_theme.dart';

class AdminChatListTab extends StatefulWidget {
  const AdminChatListTab({super.key});

  @override
  State<AdminChatListTab> createState() => _AdminChatListTabState();
}

class _AdminChatListTabState extends State<AdminChatListTab> {
  bool _isLoading = true;
  List<OrdemServico> _ordens = [];

  @override
  void initState() {
    super.initState();
    _fetchConversations();
  }

  Future<void> _fetchConversations() async {
    setState(() => _isLoading = true);
    try {
      final ordens = await OsService().fetchOrdensServico();
      // Em um app real, buscaríamos uma lista de "Conversas" ou "Contatos"
      // Aqui usamos os pedidos para identificar os clientes ativos
      if (mounted) {
        setState(() {
          _ordens = ordens;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());

    // Agrupar por cliente para não repetir
    final clients = <String, OrdemServico>{};
    for (var o in _ordens) {
      clients[o.clienteId] = o;
    }

    final clientList = clients.values.toList();

    return RefreshIndicator(
      onRefresh: _fetchConversations,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: clientList.length,
        separatorBuilder: (context, index) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final os = clientList[index];
          return ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            leading: CircleAvatar(
              backgroundColor: AppColors.brandGreen.withValues(alpha: 0.2),
              child: Text(
                (os.clienteNome ?? 'C')[0].toUpperCase(),
                style: const TextStyle(color: AppColors.brandGreen, fontWeight: FontWeight.bold),
              ),
            ),
            title: Text(os.clienteNome ?? 'Cliente #${os.clienteId}', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
            subtitle: Text('WhatsApp: ${os.clienteTelefone ?? 'N/A'}', style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => AdminChatConversationScreen(
                    clientId: os.clienteId,
                    clientName: os.clienteNome ?? 'Cliente',
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
