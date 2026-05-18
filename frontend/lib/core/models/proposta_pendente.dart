/// Modelo de proposta de orçamento aguardando aprovação do admin.
/// Espelha o payload de GET /api/propostas e dos eventos Socket
/// `proposta-pendente` / `proposta-atualizada`.
class OrcamentoProposta {
  final double total;
  final String prazo;
  final String validade;
  final String? detalhes;

  const OrcamentoProposta({
    required this.total,
    required this.prazo,
    required this.validade,
    this.detalhes,
  });

  factory OrcamentoProposta.fromJson(Map<String, dynamic> json) {
    return OrcamentoProposta(
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
      prazo: json['prazo'] as String? ?? '',
      validade: json['validade'] as String? ?? '',
      detalhes: json['detalhes'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'total': total,
        'prazo': prazo,
        'validade': validade,
        if (detalhes != null) 'detalhes': detalhes,
      };

  OrcamentoProposta copyWith({
    double? total,
    String? prazo,
    String? validade,
    String? detalhes,
  }) {
    return OrcamentoProposta(
      total: total ?? this.total,
      prazo: prazo ?? this.prazo,
      validade: validade ?? this.validade,
      detalhes: detalhes ?? this.detalhes,
    );
  }
}

class RequisitoProposta {
  final String pergunta;
  final String resposta;

  const RequisitoProposta({required this.pergunta, required this.resposta});

  factory RequisitoProposta.fromJson(Map<String, dynamic> json) =>
      RequisitoProposta(
        pergunta: json['pergunta'] as String? ?? '',
        resposta: json['resposta'] as String? ?? '',
      );

  Map<String, dynamic> toJson() => {'pergunta': pergunta, 'resposta': resposta};
}

class EspecificacoesProposta {
  final String produto;
  final List<RequisitoProposta> requisitos;
  final OrcamentoProposta orcamento;

  const EspecificacoesProposta({
    required this.produto,
    required this.requisitos,
    required this.orcamento,
  });

  factory EspecificacoesProposta.fromJson(Map<String, dynamic> json) {
    return EspecificacoesProposta(
      produto: json['produto'] as String? ?? 'Produto não informado',
      requisitos: (json['requisitos'] as List<dynamic>? ?? [])
          .map((e) => RequisitoProposta.fromJson(Map<String, dynamic>.from(e)))
          .toList(),
      orcamento: OrcamentoProposta.fromJson(
        Map<String, dynamic>.from(json['orcamento'] ?? {}),
      ),
    );
  }

  Map<String, dynamic> toJson() => {
        'produto': produto,
        'requisitos': requisitos.map((r) => r.toJson()).toList(),
        'orcamento': orcamento.toJson(),
      };
}

class PropostaPendente {
  final String sessaoId;
  final String clienteId;
  final String clienteNome;
  final String clienteTelefone;
  final EspecificacoesProposta especificacoes;
  final OrcamentoProposta orcamento;
  final DateTime criadoEm;

  const PropostaPendente({
    required this.sessaoId,
    required this.clienteId,
    required this.clienteNome,
    required this.clienteTelefone,
    required this.especificacoes,
    required this.orcamento,
    required this.criadoEm,
  });

  factory PropostaPendente.fromListJson(Map<String, dynamic> json) {
    final propostaRaw = Map<String, dynamic>.from(json['proposta'] ?? {});
    final clienteRaw = Map<String, dynamic>.from(json['cliente'] ?? {});
    return PropostaPendente(
      sessaoId: json['sessaoId'] as String,
      clienteId: json['clienteId'] as String,
      clienteNome: clienteRaw['nome'] as String? ?? 'Cliente',
      clienteTelefone: clienteRaw['telefone'] as String? ?? '',
      especificacoes: EspecificacoesProposta.fromJson(
        Map<String, dynamic>.from(propostaRaw['especificacoes'] ?? {}),
      ),
      orcamento: OrcamentoProposta.fromJson(
        Map<String, dynamic>.from(propostaRaw['orcamento'] ?? {}),
      ),
      criadoEm: DateTime.tryParse(propostaRaw['criadoEm'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  /// Constrói uma PropostaPendente a partir do payload do evento Socket
  /// `proposta-pendente` (estrutura distinta da listagem).
  factory PropostaPendente.fromSocketEvent(Map<String, dynamic> json) {
    final propostaRaw = Map<String, dynamic>.from(json['proposta'] ?? {});
    return PropostaPendente(
      sessaoId: json['sessaoId'] as String,
      clienteId: json['clienteId'] as String,
      clienteNome: json['clienteNome'] as String? ?? 'Cliente',
      clienteTelefone: json['clienteTelefone'] as String? ?? '',
      especificacoes: EspecificacoesProposta.fromJson(
        Map<String, dynamic>.from(propostaRaw['especificacoes'] ?? {}),
      ),
      orcamento: OrcamentoProposta.fromJson(
        Map<String, dynamic>.from(propostaRaw['orcamento'] ?? {}),
      ),
      criadoEm: DateTime.tryParse(propostaRaw['criadoEm'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  PropostaPendente copyWith({
    EspecificacoesProposta? especificacoes,
    OrcamentoProposta? orcamento,
  }) {
    return PropostaPendente(
      sessaoId: sessaoId,
      clienteId: clienteId,
      clienteNome: clienteNome,
      clienteTelefone: clienteTelefone,
      especificacoes: especificacoes ?? this.especificacoes,
      orcamento: orcamento ?? this.orcamento,
      criadoEm: criadoEm,
    );
  }
}
