enum MessageType {
  text,
  image,
  audio,
  pdf,
}

class ChatMessage {
  final String id;
  final String senderId;
  final String receiverId;
  final String? text;
  final String? mediaUrl;
  final String? fileName;
  final MessageType type;
  final DateTime timestamp;
  final bool isFromRAG;

  const ChatMessage({
    required this.id,
    required this.senderId,
    required this.receiverId,
    this.text,
    this.mediaUrl,
    this.fileName,
    required this.type,
    required this.timestamp,
    this.isFromRAG = false,
  });

  bool get isFromAdmin => !isFromRAG && senderId == 'admin';

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String,
      senderId: json['senderId'] as String,
      receiverId: json['receiverId'] as String,
      text: json['text'] as String?,
      mediaUrl: json['mediaUrl'] as String?,
      fileName: json['fileName'] as String?,
      type: MessageType.values.firstWhere(
        (e) => e.name == (json['type'] as String? ?? 'text'),
        orElse: () => MessageType.text,
      ),
      timestamp: DateTime.parse(json['timestamp'] as String),
      isFromRAG: json['isFromRAG'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'senderId': senderId,
      'receiverId': receiverId,
      'text': text,
      'mediaUrl': mediaUrl,
      'fileName': fileName,
      'type': type.name,
      'timestamp': timestamp.toIso8601String(),
      'isFromRAG': isFromRAG,
    };
  }
}
