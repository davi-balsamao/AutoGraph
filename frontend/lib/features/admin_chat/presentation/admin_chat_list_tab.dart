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
  State<AdminChatListTab> createState() => AdminChatListTabState();
}

class AdminChatListTabState extends State<AdminChatListTab> {
  bool _isLoading = true;
  List<OrdemServico> _ordens = [];
  
  // Lista de contatos ao vivo capturados pelo Socket (antes mesmo de virarem OS)
  final List<Map<String, String>> _liveChats = [];
  
  // Conjunto de telefones/clienteIds que foram escalados (aguardando atendimento humano)
  final Set<String> _escalados = {};
  
  int get escaladosCount => _escalados.length;
  
  StreamSubscription? _chatSubscription;
  StreamSubscription? _conversaSubscription;

  @override
  void initState() {
    super.initState();
    _fetchConversations();
    _listenToLiveChats(); // 👈 Começa a ouvir mensagens sem OS
    _listenToEscalacoes(); // 👈 Ouve escalações para badge amarelo
  }

  void _listenToLiveChats() {
    _chatSubscription = ChatService().messageStream.listen((message) {
      // Se a mensagem for de um cliente (não do bot ou admin)
      if (message.senderId != 'bot' && message.senderId != 'admin') {
        final alreadyExists = _liveChats.any((c) => c['id'] == message.senderId);
        
        // Se já existe, atualiza o nome caso tenhamos recebido um senderName novo
        if (alreadyExists) {
          if (message.senderName != null && message.senderName!.isNotEmpty && mounted) {
            setState(() {
              final idx = _liveChats.indexWhere((c) => c['id'] == message.senderId);
              if (idx != -1) {
                final current = _liveChats[idx];
                // Só atualiza se ainda era "Novo Chat (telefone)"
                if (current['nome']?.startsWith('Novo Chat') == true) {
                  _liveChats[idx] = {
                    ...current,
                    'nome': message.senderName!,
                    if (message.clienteDbId != null) 'dbId': message.clienteDbId!,
                  };
                }
              }
            });
          }
          return;
        }
        
        if (mounted) {
          final nome = (message.senderName != null && message.senderName!.isNotEmpty)
              ? message.senderName!
              : 'Novo Chat (${message.senderId})';
          setState(() {
            _liveChats.insert(0, {
              'id': message.senderId,
              'nome': nome,
              'telefone': message.senderId,
              if (message.clienteDbId != null) 'dbId': message.clienteDbId!,
            });
          });
        }
      }
    });
  }

  void _listenToEscalacoes() {
    _conversaSubscription = ChatService().conversaEventStream.listen((event) {
      if (!mounted) return;
      
      if (event.tipo == ConversaEventTipo.assumida) {
        setState(() {
          // Marca esse cliente como escalado
          _escalados.add(event.telefone ?? event.clienteId);
          
          // Se o chat já existe na lista, atualiza o nome se necessário
          final idx = _liveChats.indexWhere((c) => 
            c['id'] == event.clienteId || 
            c['telefone'] == event.telefone ||
            c['id'] == event.telefone
          );
          if (idx != -1 && event.clienteNome != null && event.clienteNome!.isNotEmpty) {
            final current = _liveChats[idx];
            if (current['nome']?.startsWith('Novo Chat') == true) {
              _liveChats[idx] = {...current, 'nome': event.clienteNome!};
            }
          }
          // Se o chat não existe ainda, cria (caso o agente tenha escalado antes de qualquer emissão)
          if (idx == -1) {
            _liveChats.insert(0, {
              'id': event.telefone ?? event.clienteId,
              'nome': event.clienteNome ?? 'Cliente Escalado',
              'telefone': event.telefone ?? event.clienteId,
            });
          }
        });
      } else if (event.tipo == ConversaEventTipo.devolvida) {
        setState(() {
          _escalados.remove(event.telefone ?? event.clienteId);
        });
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
    _conversaSubscription?.cancel();
    super.dispose();
  }

  bool _isEscalado(Map<String, String> client) {
    return _escalados.contains(client['id']) || 
           _escalados.contains(client['telefone']);
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
          final escalado = _isEscalado(client);
          
          return ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            leading: Stack(
              clipBehavior: Clip.none,
              children: [
                CircleAvatar(
                  backgroundColor: escalado 
                      ? Colors.amber.shade700.withValues(alpha: 0.2)
                      : AppColors.brandGreen.withValues(alpha: 0.2),
                  child: Text(
                    (client['nome'] ?? 'C')[0].toUpperCase(),
                    style: TextStyle(
                      color: escalado ? Colors.amber.shade700 : AppColors.brandGreen, 
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                if (escalado)
                  Positioned(
                    right: -4,
                    top: -4,
                    child: Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: Colors.amber.shade700,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Theme.of(context).scaffoldBackgroundColor,
                          width: 2,
                        ),
                      ),
                      child: const Icon(
                        Icons.priority_high,
                        size: 10,
                        color: Colors.white,
                      ),
                    ),
                  ),
              ],
            ),
            title: Row(
              children: [
                Expanded(
                  child: Text(client['nome']!, style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                ),
                if (escalado)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.amber.shade700,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'ESCALADO',
                      style: GoogleFonts.outfit(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
              ],
            ),
            subtitle: Text('WhatsApp: ${client['telefone']}', style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              // Ao abrir o chat, remove da lista de escalados (o gerente está vendo)
              if (escalado) {
                setState(() {
                  _escalados.remove(client['id']);
                  _escalados.remove(client['telefone']);
                });
              }
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => AdminChatConversationScreen(
                    clientId: client['dbId'] ?? client['id']!,
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
