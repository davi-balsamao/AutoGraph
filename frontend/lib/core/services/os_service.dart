import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import '../models/ordem_servico.dart';

class OsServiceException implements Exception {
  final String message;
  OsServiceException(this.message);

  @override
  String toString() => message;
}

class OsService {
  static OsService _instance = OsService._internal();
  factory OsService() => _instance;
  OsService._internal();

  @visibleForTesting
  static void setMockInstance(OsService mock) {
    _instance = mock;
  }

  // URL base para a API rodando localmente
  // TODO: Mover para arquivo de ambiente no futuro (.env)
  final String baseUrl = 'http://localhost:3000/api';

  Future<List<OrdemServico>> fetchOrdensServico({StatusOS? status}) async {
    try {
      final uri = Uri.parse('$baseUrl/os${status != null ? '?status=${status.value}' : ''}');
      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => OrdemServico.fromJson(json)).toList();
      } else {
        throw OsServiceException('Erro ao buscar ordens de serviço. Código: ${response.statusCode}');
      }
    } catch (e) {
      if (e is OsServiceException) rethrow;
      throw OsServiceException('Falha na conexão com o servidor: $e');
    }
  }
}
