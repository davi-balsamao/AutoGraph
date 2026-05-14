class Produto {
  final String id;
  final String nome;
  final String? descricao;
  final String? imagemUrl;
  final double precoBase;
  final DateTime criadoEm;

  const Produto({
    required this.id,
    required this.nome,
    this.descricao,
    this.imagemUrl,
    required this.precoBase,
    required this.criadoEm,
  });

  factory Produto.fromJson(Map<String, dynamic> json) {
    return Produto(
      id: json['id'] as String,
      nome: json['nome'] as String,
      descricao: json['descricao'] as String?,
      imagemUrl: json['imagemUrl'] as String?,
      precoBase: (json['precoBase'] as num).toDouble(),
      criadoEm: DateTime.parse(json['criadoEm'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nome': nome,
      'descricao': descricao,
      'imagemUrl': imagemUrl,
      'precoBase': precoBase,
    };
  }
}
