class UserModel {
  final String id;
  final String nome;
  final String telefone;
  final String? email;
  final String role; // 'CLIENTE' ou 'GERENTE'
  final String? fcmToken;
  final String? enderecoCompleto;
  final String? enderecoReferencia;
  final bool atendimentoHumano;
  final double ltv;

  const UserModel({
    required this.id,
    required this.nome,
    required this.telefone,
    this.email,
    required this.role,
    this.fcmToken,
    this.enderecoCompleto,
    this.enderecoReferencia,
    this.atendimentoHumano = false,
    this.ltv = 0.0,
  });

  bool get isAdmin => role == 'GERENTE';
  bool get isCliente => role == 'CLIENTE';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      nome: json['nome'] as String,
      telefone: json['telefone'] as String,
      email: json['email'] as String?,
      role: json['role'] as String? ?? 'CLIENTE',
      fcmToken: json['fcmToken'] as String?,
      enderecoCompleto: json['enderecoCompleto'] as String?,
      enderecoReferencia: json['enderecoReferencia'] as String?,
      atendimentoHumano: json['atendimentoHumano'] as bool? ?? false,
      ltv: json['ltv'] != null ? double.tryParse(json['ltv'].toString()) ?? 0.0 : 0.0,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'nome': nome,
        'telefone': telefone,
        'email': email,
        'role': role,
        'fcmToken': fcmToken,
        'enderecoCompleto': enderecoCompleto,
        'enderecoReferencia': enderecoReferencia,
        'atendimentoHumano': atendimentoHumano,
        'ltv': ltv,
      };
}
