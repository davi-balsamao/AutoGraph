import 'dart:async';
import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../models/chat_message.dart';
import 'auth_service.dart';

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
  final String? clienteNome;
  final String? estadoRestaurado;
  ConversaEvent(this.tipo, this.clienteId, {this.telefone, this.clienteNome, this.estadoRestaurado});
}

enum OsEventTipo { nova, atualizada }

class OsEvent {
  final OsEventTipo tipo;
  final String osId;
  final Map<String, dynamic> raw;
  OsEvent(this.tipo, this.osId, this.raw);
}

class ChatService {
  static final ChatService _instance = ChatService._internal();
  factory ChatService() => _instance;

  String get _baseUrl {
    return 'https://prescribe-ocean-tiptoeing.ngrok-free.dev/api';
  }

  late io.Socket _socket;
  final StreamController<ChatMessage> _messageStreamController = StreamController<ChatMessage>.broadcast();
  final StreamController<PropostaEvent> _propostaStreamController = StreamController<PropostaEvent>.broadcast();
  final StreamController<ConversaEvent> _conversaStreamController = StreamController<ConversaEvent>.broadcast();
  final StreamController<OsEvent> _osStreamController = StreamController<OsEvent>.broadcast();

  // Cache em memória para mensagens recebidas via Socket (real-time)
  // Usado APENAS como buffer para mensagens que chegam depois do fetch da API
  final List<ChatMessage> _realtimeBuffer = [];

  // Cache do histórico já carregado da API, indexado por todas as chaves
  // conhecidas do cliente (UUID e telefone). Sobrevive entre rebuilds da tela
  // de conversa para que voltar não perca o que já tínhamos.
  final Map<String, List<ChatMessage>> _historyCache = {};

  ChatService._internal() {
    _initSocket();
  }

  void _initSocket() {
    const String serverUrl = 'https://prescribe-ocean-tiptoeing.ngrok-free.dev';

    final token = AuthService().token;
    _socket = io.io(serverUrl, io.OptionBuilder()
      .setTransports(['websocket'])
      .enableAutoConnect()
      .setExtraHeaders(
        token != null ? {'authorization': 'Bearer $token'} : {})
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
          senderName: data['senderName']?.toString(),
          clienteDbId: data['clienteDbId']?.toString(),
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

        _realtimeBuffer.add(message);
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
          ConversaEvent(ConversaEventTipo.assumida, map['clienteId']?.toString() ?? '', telefone: map['telefone']?.toString(), clienteNome: map['clienteNome']?.toString()),
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

    _socket.on('os-nova', (data) {
      try {
        final map = Map<String, dynamic>.from(data as Map);
        final osId = map['id']?.toString() ?? '';
        _osStreamController.add(OsEvent(OsEventTipo.nova, osId, map));
      } catch (e) {
        debugPrint('❌ [SOCKET FRONTEND] os-nova parse: $e');
      }
    });

    _socket.on('os-atualizada', (data) {
      try {
        final map = Map<String, dynamic>.from(data as Map);
        final osId = map['id']?.toString() ?? '';
        _osStreamController.add(OsEvent(OsEventTipo.atualizada, osId, map));
      } catch (e) {
        debugPrint('❌ [SOCKET FRONTEND] os-atualizada parse: $e');
      }
    });
  }

  Stream<PropostaEvent> get propostaEventStream => _propostaStreamController.stream;
  Stream<ConversaEvent> get conversaEventStream => _conversaStreamController.stream;
  Stream<OsEvent> get osEventStream => _osStreamController.stream;

  /// Busca mensagens do banco de dados via API REST, depois mergeia com
  /// quaisquer mensagens que tenham chegado via Socket enquanto isso.
  /// O [clientId] pode ser o UUID do banco ou o telefone do cliente.
  Future<List<ChatMessage>> getMessages(String clientId) async {
    final List<String> keys = [clientId];

    try {
      final res = await http.get(
        Uri.parse('$_baseUrl/conversas/$clientId/mensagens?limit=200'),
        headers: {'ngrok-skip-browser-warning': 'true'},
      );

      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        final dbMessages = data.map((e) => ChatMessage.fromJson(Map<String, dynamic>.from(e))).toList();

        // Descobre todas as chaves possíveis pra esse cliente (UUID + telefone)
        // a partir das mensagens vindas do banco — usado pra casar o buffer.
        for (final m in dbMessages) {
          if (m.clienteDbId != null) keys.add(m.clienteDbId!);
          if (m.senderId != 'bot' && m.senderId != 'admin') keys.add(m.senderId);
          if (m.receiverId != 'bot' && m.receiverId != 'admin') keys.add(m.receiverId);
        }

        final dbIds = dbMessages.map((m) => m.id).toSet();
        final realtimeExtras = _realtimeBuffer.where((m) {
          if (dbIds.contains(m.id)) return false;
          return _messageMatchesAny(m, keys);
        }).toList();

        final allMessages = [...dbMessages, ...realtimeExtras];
        allMessages.sort((a, b) => a.timestamp.compareTo(b.timestamp));

        // Salva no cache sob todas as chaves conhecidas, pra que próximas
        // aberturas (e fallbacks) achem o histórico mesmo se a API falhar.
        for (final k in keys.toSet()) {
          _historyCache[k] = allMessages;
        }

        debugPrint('📋 [ChatService] Carregadas ${dbMessages.length} mensagens do banco + ${realtimeExtras.length} do buffer real-time para $clientId');
        return allMessages;
      } else if (res.statusCode == 404) {
        debugPrint('⚠️ [ChatService] Cliente $clientId não encontrado na API, usando cache/buffer local.');
      } else {
        debugPrint('⚠️ [ChatService] Erro HTTP ${res.statusCode} ao buscar mensagens.');
      }
    } catch (e) {
      debugPrint('⚠️ [ChatService] Falha ao conectar com API: $e — usando cache/buffer local.');
    }

    // Fallback 1: cache de histórico já carregado anteriormente
    final cached = _historyCache[clientId];
    if (cached != null && cached.isNotEmpty) {
      final cachedIds = cached.map((m) => m.id).toSet();
      final extras = _realtimeBuffer
          .where((m) => !cachedIds.contains(m.id) && _messageMatchesAny(m, [clientId]))
          .toList();
      final merged = [...cached, ...extras]
        ..sort((a, b) => a.timestamp.compareTo(b.timestamp));
      return merged;
    }

    // Fallback 2: buffer real-time puro
    return _realtimeBuffer
        .where((m) => _messageMatchesAny(m, [clientId]))
        .toList()
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));
  }

  bool _messageMatchesAny(ChatMessage m, List<String> keys) {
    for (final k in keys) {
      if (k.isEmpty) continue;
      if (m.senderId == k) return true;
      if (m.receiverId == k) return true;
      if (m.clienteDbId != null && m.clienteDbId == k) return true;
    }
    return false;
  }

  Future<void> sendMessage(ChatMessage message) async {
    _realtimeBuffer.add(message);
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