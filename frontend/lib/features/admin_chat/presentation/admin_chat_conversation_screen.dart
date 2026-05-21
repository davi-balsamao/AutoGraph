import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:file_picker/file_picker.dart';
import '../../../core/models/chat_message.dart';
import '../../../core/services/chat_service.dart';
import '../../../core/services/proposta_service.dart';
import '../../../core/utils/snackbar_util.dart';

class AdminChatConversationScreen extends StatefulWidget {
  final String clientId;
  final String clientName;
  final String clientPhone;

  const AdminChatConversationScreen({
    super.key,
    required this.clientId,
    required this.clientName,
    this.clientPhone = '', // 🔥 SOLUÇÃO DOS ERROS: Tiramos o 'required' e definimos vazio por padrão
  });

  @override
  State<AdminChatConversationScreen> createState() => _AdminChatConversationScreenState();
}

class _AdminChatConversationScreenState extends State<AdminChatConversationScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final ChatService _chatService = ChatService();
  List<ChatMessage> _messages = [];
  bool _isLoading = true;
  bool _humanoAssumiu = false;
  bool _togglingTakeover = false;

  StreamSubscription<ChatMessage>? _messageSubscription;
  StreamSubscription<ConversaEvent>? _conversaSubscription;

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _carregarStatusConversa();
    _listenToIncomingMessages();
    _conversaSubscription = _chatService.conversaEventStream.listen((event) {
      if (!mounted) return;
      bool matchesId = event.clienteId == widget.clientId;
      bool matchesPhone = (event.telefone != null && event.telefone == widget.clientPhone) || 
                          (event.telefone != null && event.telefone == widget.clientId) || 
                          (widget.clientPhone.isNotEmpty && event.clienteId == widget.clientPhone);
      
      if (!matchesId && !matchesPhone) return;

      setState(() {
        _humanoAssumiu = event.tipo == ConversaEventTipo.assumida;
      });
    });
  }

  Future<void> _carregarStatusConversa() async {
    try {
      final status = await ConversaService().status(widget.clientId);
      if (!mounted) return;
      setState(() => _humanoAssumiu = status['atendimentoHumano'] == true);
    } catch (_) {
      // Tela ainda funciona sem status — só não pinta o banner.
    }
  }

  Future<void> _toggleTakeover() async {
    setState(() => _togglingTakeover = true);
    try {
      if (_humanoAssumiu) {
        await ConversaService().devolverIa(widget.clientId);
        if (!mounted) return;
        SnackbarUtil.showSuccess(context, 'IA retomou a conversa.');
        setState(() => _humanoAssumiu = false);
      } else {
        await ConversaService().assumir(widget.clientId);
        if (!mounted) return;
        SnackbarUtil.showSuccess(context, 'Você assumiu a conversa. IA pausada.');
        setState(() => _humanoAssumiu = true);
      }
    } catch (e) {
      if (!mounted) return;
      SnackbarUtil.showError(context, 'Falha: $e');
    } finally {
      if (mounted) setState(() => _togglingTakeover = false);
    }
  }

  void _listenToIncomingMessages() {
    _messageSubscription = _chatService.messageStream.listen((message) {
      if (mounted) {
        bool matchesId = message.senderId == widget.clientId || message.receiverId == widget.clientId;
        bool matchesPhone = widget.clientPhone.isNotEmpty && (message.senderId == widget.clientPhone || message.receiverId == widget.clientPhone);
        bool matchesDbId = message.clienteDbId != null && (message.clienteDbId == widget.clientId || message.clienteDbId == widget.clientPhone);

        if (matchesId || matchesPhone || matchesDbId) {
          final bool alreadyExists = _messages.any((m) => m.id == message.id);
          if (!alreadyExists) {
            setState(() {
              _messages.add(message);
            });
            _scrollToBottom();
          }
        }
      }
    });
  }

  Future<void> _loadMessages() async {
    // Tenta buscar pelo clientId (pode ser UUID ou telefone)
    var msgs = await _chatService.getMessages(widget.clientId);
    
    // Se não achou e temos o telefone, tenta por ele também
    if (msgs.isEmpty && widget.clientPhone.isNotEmpty && widget.clientPhone != widget.clientId) {
      msgs = await _chatService.getMessages(widget.clientPhone);
    }
    
    if (mounted) {
      setState(() {
        _messages = msgs;
        _isLoading = false;
      });
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage({String? text, String? mediaUrl, String? fileName, MessageType type = MessageType.text}) async {
    if ((text == null || text.trim().isEmpty) && mediaUrl == null) return;

    final newMessage = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      senderId: 'admin',
      // 🔥 ROTA DE FUGA: Se o telefone estiver na tela, envia pra ele. Se não, tenta usar o ID.
      receiverId: widget.clientPhone.isNotEmpty ? widget.clientPhone : widget.clientId, 
      text: text,
      mediaUrl: mediaUrl,
      fileName: fileName,
      type: type,
      timestamp: DateTime.now(),
      isFromRAG: false,
    );

    setState(() {
      _messages.add(newMessage);
    });
    _messageController.clear();
    _scrollToBottom();

    await _chatService.sendMessage(newMessage);
  }

  Future<void> _pickFile(MessageType type) async {
    FileType fileType = FileType.any;
    if (type == MessageType.image) fileType = FileType.image;
    if (type == MessageType.pdf) fileType = FileType.custom;

    final result = await FilePicker.platform.pickFiles(
      type: fileType,
      allowedExtensions: type == MessageType.pdf ? ['pdf'] : null,
    );

    if (result != null && result.files.single.path != null) {
      _sendMessage(
        mediaUrl: 'file://${result.files.single.path}',
        fileName: result.files.single.name,
        type: type,
      );
    }
  }

  @override
  void dispose() {
    _messageSubscription?.cancel();
    _conversaSubscription?.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.clientName, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
            Text(
              widget.clientPhone.isNotEmpty ? 'WhatsApp: ${widget.clientPhone}' : 'Conexão via ID',
              style: const TextStyle(fontSize: 10, color: Colors.green)
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: _humanoAssumiu ? 'Devolver para IA' : 'Assumir conversa',
            icon: _togglingTakeover
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Icon(_humanoAssumiu ? Icons.smart_toy_outlined : Icons.headset_mic),
            onPressed: _togglingTakeover ? null : _toggleTakeover,
          ),
        ],
      ),
      body: Column(
        children: [
          if (_humanoAssumiu)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: Colors.amber.shade100,
              child: Row(
                children: [
                  Icon(Icons.info_outline, size: 18, color: Colors.amber.shade900),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Você está respondendo direto (IA pausada).',
                      style: TextStyle(color: Colors.amber.shade900, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _messages.isEmpty
                    ? const Center(child: Text("Nenhuma mensagem ainda."))
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          return _ChatBubble(message: _messages[index]);
                        },
                      ),
          ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -5))],
      ),
      child: SafeArea(
        child: Row(
          children: [
            IconButton(
              icon: const Icon(Icons.add_circle_outline, color: Colors.green),
              onPressed: () => _showMediaOptions(),
            ),
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Row(
                  children: [
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextField(
                        controller: _messageController,
                        decoration: const InputDecoration(hintText: 'Digite uma mensagem...', border: InputBorder.none, isDense: true),
                        maxLines: null,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),
            CircleAvatar(
              backgroundColor: Colors.green,
              child: IconButton(
                icon: const Icon(Icons.send, color: Colors.white),
                onPressed: () => _sendMessage(text: _messageController.text),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showMediaOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(leading: const Icon(Icons.image, color: Colors.blue), title: const Text('Image'), onTap: () { Navigator.pop(context); _pickFile(MessageType.image); }),
          ],
        ),
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  final ChatMessage message;

  const _ChatBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isMe = message.isFromAdmin;

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isMe ? Colors.green.shade100 : Colors.grey.shade200,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 0),
            bottomRight: Radius.circular(isMe ? 0 : 16),
          ),
          border: message.isFromRAG ? Border.all(color: Colors.green) : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (message.isFromRAG && !isMe)
              const Padding(
                padding: EdgeInsets.only(bottom: 4),
                child: Text('Assistente Virtual', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.green)),
              ),
            Text(message.text ?? '', style: const TextStyle(color: Colors.black87)),
            const SizedBox(height: 4),
            Text(DateFormat('HH:mm').format(message.timestamp.toLocal()), style: const TextStyle(fontSize: 10, color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}
