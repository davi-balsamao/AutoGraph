import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../models/chat_message.dart';

class ChatService {
  static final ChatService _instance = ChatService._internal();
  factory ChatService() => _instance;

  late io.Socket _socket;
  final StreamController<ChatMessage> _messageStreamController = StreamController<ChatMessage>.broadcast();
  final List<ChatMessage> _messages = [];

  ChatService._internal() {
    _initSocket();
  }

  void _initSocket() {
    const String serverUrl = kIsWeb ? 'http://localhost:3000' : 'http://10.0.2.2:3000';

    _socket = io.io(serverUrl, io.OptionBuilder()
      .setTransports(['websocket'])
      .enableAutoConnect()
      .build());

    _socket.onConnect((_) {
      debugPrint('✅ [SOCKET FRONTEND] Conectado ao Backend Node.js com sucesso!');
    });

    _socket.onDisconnect((_) {
      debugPrint('❌ [SOCKET FRONTEND] Conexão com o servidor perdida.');
    });

    _socket.on('message', (data) {
      debugPrint('📩 [SOCKET FRONTEND] Dado bruto recebido do Node.js: $data');
      try {
        final message = ChatMessage(
          id: data['id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
          senderId: data['senderId']?.toString() ?? '',
          receiverId: data['receiverId']?.toString() ?? '',
          text: data['text']?.toString() ?? '',
          type: data['type'] == 'image' ? MessageType.image : MessageType.text,
          timestamp: data['timestamp'] != null 
              ? DateTime.parse(data['timestamp']) 
              : DateTime.now(),
          isFromRAG: data['isFromRAG'] ?? false,
          mediaUrl: data['mediaUrl']?.toString(),
          fileName: data['fileName']?.toString(),
        );

        _messages.add(message);
        _messageStreamController.add(message);
        debugPrint('✅ [SOCKET FRONTEND] Mensagem adicionada ao fluxo com sucesso!');
      } catch (e) {
        debugPrint('❌ [SOCKET FRONTEND] Erro ao converter JSON: $e');
      }
    });
  }

  // 🎯 FILTRO RESTAURADO: Só retorna as mensagens do cliente específico
  Future<List<ChatMessage>> getMessages(String clientId) async {
    return _messages.where((m) => m.senderId == clientId || m.receiverId == clientId).toList()
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));
  }

  Future<void> sendMessage(ChatMessage message) async {
    _messages.add(message);
    _messageStreamController.add(message);

    _socket.emit('message', {
      'senderId': message.senderId,
      'receiverId': message.receiverId,
      'text': message.text,
      'type': message.type == MessageType.image ? 'image' : 'text',
      'timestamp': message.timestamp.toIso8601String(),
      'isFromRAG': message.isFromRAG,
      'mediaUrl': message.mediaUrl,
      'fileName': message.fileName,
    });
  }

  Stream<ChatMessage> get messageStream => _messageStreamController.stream;

  void dispose() {
    _messageStreamController.close();
    _socket.dispose();
  }
}