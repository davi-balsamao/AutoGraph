/// Status possíveis para uma Ordem de Serviço — espelha o enum do Prisma.
enum StatusOS {
  criada('CRIADA', 'Criada'),
  aguardandoOrcamento('AGUARDANDO_ORCAMENTO', 'Aguardando Orçamento'),
  emProducao('EM_PRODUCAO', 'Em Produção'),
  prontaParaRetirada('PRONTA_PARA_RETIRADA', 'Pronta para Retirada'),
  entregue('ENTREGUE', 'Entregue'),
  cancelada('CANCELADA', 'Cancelada');

  final String value;
  final String label;
  const StatusOS(this.value, this.label);

  static StatusOS fromValue(String v) =>
      StatusOS.values.firstWhere((e) => e.value == v, orElse: () => StatusOS.criada);
}

/// Modelo de Ordem de Serviço.
class OrdemServico {
  final String id;
  final String clienteId;
  final StatusOS status;
  final Map<String, dynamic> especificacoes;
  final String? observacoes;
  final String? mensagemSugerida;
  final DateTime criadoEm;
  final DateTime atualizadoEm;

  // Campos do Timer de produção
  final DateTime? timerStartedAt;
  final DateTime? timerEndedAt;
  final int durationSeconds;

  // Dados do cliente (join)
  final String? clienteNome;
  final String? clienteTelefone;

  const OrdemServico({
    required this.id,
    required this.clienteId,
    required this.status,
    required this.especificacoes,
    this.observacoes,
    this.mensagemSugerida,
    required this.criadoEm,
    required this.atualizadoEm,
    this.timerStartedAt,
    this.timerEndedAt,
    this.durationSeconds = 0,
    this.clienteNome,
    this.clienteTelefone,
  });

  factory OrdemServico.fromJson(Map<String, dynamic> json) {
    return OrdemServico(
      id: json['id'] as String,
      clienteId: json['clienteId'] as String,
      status: StatusOS.fromValue(json['status'] as String? ?? 'CRIADA'),
      especificacoes: json['especificacoes'] is Map
          ? Map<String, dynamic>.from(json['especificacoes'])
          : {},
      observacoes: json['observacoes'] as String?,
      mensagemSugerida: json['mensagem_sugerida'] as String?,
      criadoEm: DateTime.parse(json['criadoEm'] as String),
      atualizadoEm: DateTime.parse(json['atualizadoEm'] as String),
      timerStartedAt: json['timerStartedAt'] != null
          ? DateTime.parse(json['timerStartedAt'] as String)
          : null,
      timerEndedAt: json['timerEndedAt'] != null
          ? DateTime.parse(json['timerEndedAt'] as String)
          : null,
      durationSeconds: json['durationSeconds'] as int? ?? 0,
      clienteNome: json['cliente']?['nome'] as String?,
      clienteTelefone: json['cliente']?['telefone'] as String?,
    );
  }

  OrdemServico copyWith({
    StatusOS? status,
    Map<String, dynamic>? especificacoes,
    String? observacoes,
    DateTime? timerStartedAt,
    DateTime? timerEndedAt,
    int? durationSeconds,
  }) {
    return OrdemServico(
      id: id,
      clienteId: clienteId,
      status: status ?? this.status,
      especificacoes: especificacoes ?? this.especificacoes,
      observacoes: observacoes ?? this.observacoes,
      mensagemSugerida: mensagemSugerida,
      criadoEm: criadoEm,
      atualizadoEm: DateTime.now(),
      timerStartedAt: timerStartedAt ?? this.timerStartedAt,
      timerEndedAt: timerEndedAt ?? this.timerEndedAt,
      durationSeconds: durationSeconds ?? this.durationSeconds,
      clienteNome: clienteNome,
      clienteTelefone: clienteTelefone,
    );
  }

  /// Duração formatada HH:MM:SS
  String get durationFormatted {
    final d = Duration(seconds: durationSeconds);
    final h = d.inHours.toString().padLeft(2, '0');
    final m = (d.inMinutes % 60).toString().padLeft(2, '0');
    final s = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  /// Resumo do produto na especificação
  String get produtoResumo {
    final produto = (especificacoes['produtoNome'] ?? especificacoes['produto']) as String?;
    return produto ?? 'Produto personalizado';
  }
}
