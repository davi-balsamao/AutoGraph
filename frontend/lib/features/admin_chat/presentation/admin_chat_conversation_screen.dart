import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:file_picker/file_picker.dart';
import '../../../core/models/chat_message.dart';
import '../../../core/services/chat_service.dart';
import '../../../core/theme/app_theme.dart';

class AdminChatConversationScreen extends StatefulWidget {
  final String clientId;
  final String clientName;

  const AdminChatConversationScreen({
    super.key,
    required this.clientId,
    required this.clientName,
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

  @override
  void initState() {
    super.initState();
    _loadMessages();
  }

  Future<void> _loadMessages() async {
    final msgs = await _chatService.getMessages(widget.clientId);
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
      receiverId: widget.clientId,
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
      // In a real app, upload the file first and get a URL
      _sendMessage(
        mediaUrl: 'file://${result.files.single.path}',
        fileName: result.files.single.name,
        type: type,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.clientName, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('WhatsApp Connection Active', style: TextStyle(fontSize: 10, color: AppColors.brandGreen)),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.more_vert), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final message = _messages[index];
                      return _ChatBubble(message: message);
                    },
                  ),
          ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildInputArea() {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: cs.surface,
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -5)),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            IconButton(
              icon: const Icon(Icons.add_circle_outline, color: AppColors.brandGreen),
              onPressed: () => _showMediaOptions(),
            ),
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: cs.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Row(
                  children: [
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextField(
                        controller: _messageController,
                        decoration: const InputDecoration(
                          hintText: 'Type a message...',
                          border: InputBorder.none,
                          isDense: true,
                        ),
                        maxLines: null,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.emoji_emotions_outlined, size: 20),
                      onPressed: () {
                        // Placeholder for emoji picker
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onLongPress: () {
                // Simulate recording
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Recording audio...')));
              },
              onLongPressEnd: (_) {
                // Simulate sending audio
                _sendMessage(text: 'Voice message', type: MessageType.audio);
              },
              child: CircleAvatar(
                backgroundColor: AppColors.brandGreen,
                child: IconButton(
                  icon: const Icon(Icons.send, color: AppColors.brandTealDeep),
                  onPressed: () => _sendMessage(text: _messageController.text),
                ),
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
            ListTile(
              leading: const Icon(Icons.image, color: Colors.blue),
              title: const Text('Image'),
              onTap: () {
                Navigator.pop(context);
                _pickFile(MessageType.image);
              },
            ),
            ListTile(
              leading: const Icon(Icons.picture_as_pdf, color: Colors.red),
              title: const Text('PDF Document'),
              onTap: () {
                Navigator.pop(context);
                _pickFile(MessageType.pdf);
              },
            ),
            ListTile(
              leading: const Icon(Icons.mic, color: Colors.green),
              title: const Text('Audio'),
              onTap: () {
                Navigator.pop(context);
                // In real implementation, this would open a recorder
                _sendMessage(text: 'Voice message', type: MessageType.audio);
              },
            ),
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
    final cs = Theme.of(context).colorScheme;

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isMe ? AppColors.brandGreen : (message.isFromRAG ? cs.surfaceContainerHighest : cs.surfaceContainer),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 0),
            bottomRight: Radius.circular(isMe ? 0 : 16),
          ),
          border: message.isFromRAG ? Border.all(color: AppColors.brandGreen.withValues(alpha: 0.3)) : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (message.isFromRAG && !isMe)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.auto_awesome, size: 10, color: Color(0xFF00684A)),
                    const SizedBox(width: 4),
                    Text('RAG Response', style: GoogleFonts.outfit(fontSize: 9, fontWeight: FontWeight.bold, color: const Color(0xFF00684A))),
                  ],
                ),
              ),
            _buildMessageContent(context),
            const SizedBox(height: 4),
            Text(
              DateFormat('HH:mm').format(message.timestamp),
              style: TextStyle(fontSize: 10, color: isMe ? Colors.black54 : Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageContent(BuildContext context) {
    switch (message.type) {
      case MessageType.text:
        return Text(
          message.text ?? '',
          style: TextStyle(color: message.isFromAdmin ? Colors.black87 : Theme.of(context).colorScheme.onSurface),
        );
      case MessageType.image:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.image, size: 40, color: Colors.grey),
            if (message.fileName != null)
              Text(message.fileName!, style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic)),
          ],
        );
      case MessageType.audio:
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.play_arrow),
            const SizedBox(width: 8),
            Container(
              width: 100,
              height: 2,
              color: Colors.grey.withValues(alpha: 0.5),
            ),
            const SizedBox(width: 8),
            const Text('0:15', style: TextStyle(fontSize: 12)),
          ],
        );
      case MessageType.pdf:
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.picture_as_pdf, color: Colors.red),
            const SizedBox(width: 8),
            Expanded(child: Text(message.fileName ?? 'Document.pdf', overflow: TextOverflow.ellipsis)),
          ],
        );
    }
  }
}
