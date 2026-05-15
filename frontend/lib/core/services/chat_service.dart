import 'dart:async';
import '../models/chat_message.dart';

class ChatService {
  static final ChatService _instance = ChatService._internal();
  factory ChatService() => _instance;
  ChatService._internal();

  final List<ChatMessage> _mockMessages = [
    ChatMessage(
      id: '1',
      senderId: 'client1',
      receiverId: 'admin',
      text: 'Olá, gostaria de saber o status do meu pedido de panfletos.',
      type: MessageType.text,
      timestamp: DateTime.now().subtract(const Duration(hours: 2)),
      isFromRAG: true,
    ),
    ChatMessage(
      id: '2',
      senderId: 'admin',
      receiverId: 'client1',
      text: 'Olá! Seu pedido está em fase de impressão.',
      type: MessageType.text,
      timestamp: DateTime.now().subtract(const Duration(hours: 1, minutes: 50)),
      isFromRAG: true,
    ),
    ChatMessage(
      id: '3',
      senderId: 'client1',
      receiverId: 'admin',
      text: 'Perfeito. Posso enviar a logo atualizada?',
      type: MessageType.text,
      timestamp: DateTime.now().subtract(const Duration(minutes: 45)),
      isFromRAG: false,
    ),
    ChatMessage(
      id: '4',
      senderId: 'client1',
      receiverId: 'admin',
      mediaUrl: 'https://example.com/logo.png',
      fileName: 'logo_v2.png',
      type: MessageType.image,
      timestamp: DateTime.now().subtract(const Duration(minutes: 44)),
      isFromRAG: false,
    ),
  ];

  Future<List<ChatMessage>> getMessages(String clientId) async {
    // Simulating API call
    await Future.delayed(const Duration(milliseconds: 500));
    return _mockMessages.where((m) => m.senderId == clientId || m.receiverId == clientId).toList()
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));
  }

  Future<void> sendMessage(ChatMessage message) async {
    // Simulating API call
    await Future.delayed(const Duration(milliseconds: 300));
    _mockMessages.add(message);
    print('Message sent to WhatsApp via Backend: ${message.toJson()}');
  }

  Stream<ChatMessage> get messageStream {
    // In a real app, this would be a WebSocket or SSE stream
    return StreamController<ChatMessage>().stream;
  }
}
