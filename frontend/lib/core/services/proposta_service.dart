import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/proposta_pendente.dart';

class PropostaServiceException implements Exception {
  final String message;
  PropostaServiceException(this.message);
  @override
  String toString() => message;
}

class PropostaService {
  static final PropostaService _instance = PropostaService._internal();
  factory PropostaService() => _instance;
  PropostaService._internal();

  final String baseUrl = 'https://prescribe-ocean-tiptoeing.ngrok-free.dev/api';

  Future<List<PropostaPendente>> listarPendentes() async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/propostas'),
        headers: {'ngrok-skip-browser-warning': 'true'},
      );
      if (res.statusCode != 200) {
        throw PropostaServiceException(
          'Erro ao listar propostas: ${res.statusCode}',
        );
      }
      final List<dynamic> data = jsonDecode(res.body);
      return data
          .map((e) => PropostaPendente.fromListJson(Map<String, dynamic>.from(e)))
          .toList();
    } catch (e) {
      if (e is PropostaServiceException) rethrow;
      throw PropostaServiceException('Falha na conexão: $e');
    }
  }

  Future<void> editar(
    String sessaoId, {
    EspecificacoesProposta? especificacoes,
    OrcamentoProposta? orcamento,
  }) async {
    try {
      final body = <String, dynamic>{
        'proposta': {
          if (especificacoes != null) 'especificacoes': especificacoes.toJson(),
          if (orcamento != null) 'orcamento': orcamento.toJson(),
        }
      };
      final res = await http.patch(
        Uri.parse('$baseUrl/propostas/$sessaoId'),
        headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
        body: jsonEncode(body),
      );
      if (res.statusCode != 200) {
        throw PropostaServiceException(
          'Erro ao editar proposta: ${res.statusCode}',
        );
      }
    } catch (e) {
      if (e is PropostaServiceException) rethrow;
      throw PropostaServiceException('Falha na conexão: $e');
    }
  }

  Future<void> aprovar(String sessaoId) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/propostas/$sessaoId/aprovar'),
        headers: {'ngrok-skip-browser-warning': 'true'},
      );
      if (res.statusCode != 200) {
        throw PropostaServiceException(
          'Erro ao aprovar proposta: ${res.statusCode}',
        );
      }
    } catch (e) {
      if (e is PropostaServiceException) rethrow;
      throw PropostaServiceException('Falha na conexão: $e');
    }
  }

  Future<void> rejeitar(String sessaoId, {String? motivo}) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/propostas/$sessaoId/rejeitar'),
        headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'},
        body: jsonEncode({if (motivo != null && motivo.isNotEmpty) 'motivo': motivo}),
      );
      if (res.statusCode != 200) {
        throw PropostaServiceException(
          'Erro ao rejeitar proposta: ${res.statusCode}',
        );
      }
    } catch (e) {
      if (e is PropostaServiceException) rethrow;
      throw PropostaServiceException('Falha na conexão: $e');
    }
  }
}

class ConversaService {
  static final ConversaService _instance = ConversaService._internal();
  factory ConversaService() => _instance;
  ConversaService._internal();

  final String baseUrl = 'https://prescribe-ocean-tiptoeing.ngrok-free.dev/api';

  Future<void> assumir(String userId) async {
    final res = await http.post(
      Uri.parse('$baseUrl/conversas/$userId/assumir'),
      headers: {'ngrok-skip-browser-warning': 'true'},
    );
    if (res.statusCode != 200) {
      throw PropostaServiceException('Erro ao assumir conversa: ${res.statusCode}');
    }
  }

  Future<void> devolverIa(String userId) async {
    final res = await http.post(
      Uri.parse('$baseUrl/conversas/$userId/devolver-ia'),
      headers: {'ngrok-skip-browser-warning': 'true'},
    );
    if (res.statusCode != 200) {
      throw PropostaServiceException('Erro ao devolver conversa: ${res.statusCode}');
    }
  }

  Future<Map<String, dynamic>> status(String userId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/conversas/$userId/status'),
      headers: {'ngrok-skip-browser-warning': 'true'},
    );
    if (res.statusCode != 200) {
      throw PropostaServiceException('Erro ao buscar status: ${res.statusCode}');
    }
    return Map<String, dynamic>.from(jsonDecode(res.body));
  }
}
