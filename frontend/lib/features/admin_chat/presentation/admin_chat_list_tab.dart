import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/services/os_service.dart';
import '../../../core/models/ordem_servico.dart';
import '../../../core/services/chat_service.dart';
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
  
  // Lista de contatos ao vivo capturados pelo Socket (antes mesmo de virarem OS)
  final List<Map<String, String>> _liveChats = [];
  StreamSubscription? _chatSubscription;

  @override
  void initState() {
    super.initState();
    _fetchConversations();
    _listenToLiveChats(); // 👈 Começa a ouvir mensagens sem OS
  }

  void _listenToLiveChats() {
    _chatSubscription = ChatService().messageStream.listen((message) {
      // Se a mensagem for de um cliente (não do bot ou admin)
      if (message.senderId != 'bot' && message.senderId != 'admin') {
        final alreadyExists = _liveChats.any((c) => c['id'] == message.senderId);
        
        if (!alreadyExists && mounted) {
          setState(() {
            _liveChats.insert(0, {
              'id': message.senderId,
              'nome': 'Novo Chat (${message.senderId})',
              'telefone': message.senderId,
            });
          });
        }
      }
    });
  }

  Future<void> _fetchConversations() async {
    setState(() => _isLoading = true);
    try {
      final ordens = await OsService().fetchOrdensServico();
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
  void dispose() {
    _chatSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());

    // 1. Pega os clientes que já têm OS
    final clientsFromOS = <String, Map<String, String>>{};
    for (var o in _ordens) {
      clientsFromOS[o.clienteId] = {
        'id': o.clienteId,
        'nome': o.clienteNome ?? 'Cliente #${o.clienteId}',
        'telefone': o.clienteTelefone ?? 'N/A'
      };
    }

    // 2. Mistura os clientes com OS e os Novos Chats ao vivo do Socket
    final combinedClients = [..._liveChats];
    for (var osClient in clientsFromOS.values) {
      // Evita duplicar se o cliente do Socket já apareceu na lista de OS
      if (!combinedClients.any((c) => c['id'] == osClient['id'] || c['telefone'] == osClient['telefone'])) {
        combinedClients.add(osClient);
      }
    }

    // Tela vazia inteligente
    if (combinedClients.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text('Nenhuma conversa ativa.', style: GoogleFonts.outfit(fontSize: 18, color: Colors.grey.shade700)),
            const SizedBox(height: 8),
            const Text('Mande um "Oi" no WhatsApp para testar!', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchConversations,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: combinedClients.length,
        separatorBuilder: (context, index) => const Divider(height: 1),
        itemBuilder: (context, index) {
          final client = combinedClients[index];
          
          return ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            leading: CircleAvatar(
              backgroundColor: AppColors.brandGreen.withValues(alpha: 0.2),
              child: Text(
                (client['nome'] ?? 'C')[0].toUpperCase(),
                style: const TextStyle(color: AppColors.brandGreen, fontWeight: FontWeight.bold),
              ),
            ),
            title: Text(client['nome']!, style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
            subtitle: Text('WhatsApp: ${client['telefone']}', style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => AdminChatConversationScreen(
                    clientId: client['id']!,
                    clientName: client['nome']!,  
                    clientPhone: client['telefone']!,
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