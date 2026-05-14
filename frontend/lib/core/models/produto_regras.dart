class ProdutoRegrasItem {
  final List<String> papeisPermitidos;
  final List<String> acabamentosPermitidos;
  final List<String> entidadesObrigatorias;

  const ProdutoRegrasItem({
    required this.papeisPermitidos,
    required this.acabamentosPermitidos,
    required this.entidadesObrigatorias,
  });

  factory ProdutoRegrasItem.fromJson(Map<String, dynamic> json) {
    return ProdutoRegrasItem(
      papeisPermitidos: List<String>.from(json['papeis_permitidos'] ?? []),
      acabamentosPermitidos: List<String>.from(json['acabamentos_permitidos'] ?? []),
      entidadesObrigatorias: List<String>.from(json['entidades_obrigatorias'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'papeis_permitidos': papeisPermitidos,
      'acabamentos_permitidos': acabamentosPermitidos,
      'entidades_obrigatorias': entidadesObrigatorias,
    };
  }
}

class ProdutoRegrasCatalogo {
  final Map<String, ProdutoRegrasItem> regras;

  const ProdutoRegrasCatalogo(this.regras);

  factory ProdutoRegrasCatalogo.fromJson(Map<String, dynamic> json) {
    final map = <String, ProdutoRegrasItem>{};
    json.forEach((key, value) {
      if (value is Map<String, dynamic>) {
        map[key] = ProdutoRegrasItem.fromJson(value);
      }
    });
    return ProdutoRegrasCatalogo(map);
  }

  ProdutoRegrasItem? getRegrasFor(String produtoKey) {
    return regras[produtoKey];
  }
}
