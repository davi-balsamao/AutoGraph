import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../models/chat_message.dart';

enum PropostaEventTipo { pendente, atualizada, aprovada, rejeitada, cancelada }

class PropostaEvent {
  final PropostaEventTipo tipo;
  final String sessaoId;
  final Map<String, dynamic> raw;
  PropostaEvent(this.tipo, this.sessaoId, this.raw);
}

enum ConversaEventTipo { assumida, devolvida }

class ConversaEvent {
  final ConversaEventTipo tipo;
  final String clienteId;
  final String? telefone;
  final String? estadoRestaurado;
  ConversaEvent(this.tipo, this.clienteId, {this.telefone, this.estadoRestaurado});
}

enum OsEventTipo { nova }

class OsEvent {
  final OsEventTipo tipo;
  final String osId;
  final Map<String, dynamic> raw;
  OsEvent(this.tipo, this.osId, this.raw);
}

class ChatService {
  static final ChatService _instance = ChatService._internal();
  factory ChatService() => _instance;

  late io.Socket _socket;
  final StreamController<ChatMessage> _messageStreamController = StreamController<ChatMessage>.broadcast();
  final StreamController<PropostaEvent> _propostaStreamController = StreamController<PropostaEvent>.broadcast();
  final StreamController<ConversaEvent> _conversaStreamController = StreamController<ConversaEvent>.broadcast();
  final StreamController<OsEvent> _osStreamController = StreamController<OsEvent>.broadcast();
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

    void emitirProposta(PropostaEventTipo tipo, dynamic data) {
      try {
        final map = Map<String, dynamic>.from(data as Map);
        final sessaoId = map['sessaoId']?.toString() ?? '';
        _propostaStreamController.add(PropostaEvent(tipo, sessaoId, map));
      } catch (e) {
        debugPrint('❌ [SOCKET FRONTEND] proposta event parse: $e');
      }
    }

    _socket.on('proposta-pendente', (d) => emitirProposta(PropostaEventTipo.pendente, d));
    _socket.on('proposta-atualizada', (d) => emitirProposta(PropostaEventTipo.atualizada, d));
    _socket.on('proposta-aprovada', (d) => emitirProposta(PropostaEventTipo.aprovada, d));
    _socket.on('proposta-rejeitada', (d) => emitirProposta(PropostaEventTipo.rejeitada, d));
    _socket.on('proposta-cancelada', (d) => emitirProposta(PropostaEventTipo.cancelada, d));

    _socket.on('conversa-assumida', (data) {
      try {
        final map = Map<String, dynamic>.from(data as Map);
        _conversaStreamController.add(
          ConversaEvent(ConversaEventTipo.assumida, map['clienteId']?.toString() ?? '', telefone: map['telefone']?.toString()),
        );
      } catch (_) {}
    });
    _socket.on('conversa-devolvida', (data) {
      try {
        final map = Map<String, dynamic>.from(data as Map);
        _conversaStreamController.add(ConversaEvent(
          ConversaEventTipo.devolvida,
          map['clienteId']?.toString() ?? '',
          telefone: map['telefone']?.toString(),
          estadoRestaurado: map['estadoRestaurado']?.toString(),
        ));
      } catch (_) {}
    });

    _socket.on('nova-os', (data) {
      try {
        final map = Map<String, dynamic>.from(data as Map);
        final osId = map['id']?.toString() ?? '';
        _osStreamController.add(OsEvent(OsEventTipo.nova, osId, map));
      } catch (e) {
        debugPrint('❌ [SOCKET FRONTEND] nova-os parse: $e');
      }
    });
  }

  Stream<PropostaEvent> get propostaEventStream => _propostaStreamController.stream;
  Stream<ConversaEvent> get conversaEventStream => _conversaStreamController.stream;
  Stream<OsEvent> get osEventStream => _osStreamController.stream;

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
    _propostaStreamController.close();
    _conversaStreamController.close();
    _osStreamController.close();
    _socket.dispose();
  }
}