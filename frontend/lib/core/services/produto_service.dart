import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/produto.dart';
import '../models/produto_regras.dart';

class ProdutoServiceException implements Exception {
  final String message;
  ProdutoServiceException(this.message);

  @override
  String toString() => message;
}

class ProdutoService {
  static final ProdutoService _instance = ProdutoService._internal();
  factory ProdutoService() => _instance;
  ProdutoService._internal();

  final String baseUrl = 'http://10.10.0.139:3000/api/produtos';

  Future<List<Produto>> fetchProdutos() async {
    try {
      final response = await http.get(Uri.parse(baseUrl));
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Produto.fromJson(json)).toList();
      } else if (response.statusCode == 503) {
        throw ProdutoServiceException('Serviço de banco de dados temporariamente indisponível. Tente novamente em instantes.');
      } else {
        throw ProdutoServiceException('Erro ao carregar catálogo: ${response.statusCode}');
      }
    } catch (e) {
      if (e is ProdutoServiceException) rethrow;
      throw ProdutoServiceException('Falha na conexão: $e');
    }
  }

  Future<Produto> createProduto(String nome, String? descricao, double precoBase, {String? imagemUrl}) async {
    try {
      final body = <String, dynamic>{
        'nome': nome,
        'descricao': descricao,
        'precoBase': precoBase,
      };
      if (imagemUrl != null && imagemUrl.isNotEmpty) {
        body['imagemUrl'] = imagemUrl;
      }
      final response = await http.post(
        Uri.parse(baseUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );
      if (response.statusCode == 201 || response.statusCode == 200) {
        return Produto.fromJson(jsonDecode(response.body));
      } else if (response.statusCode == 503) {
        throw ProdutoServiceException('Serviço de banco de dados temporariamente indisponível. Tente novamente em instantes.');
      } else {
        throw ProdutoServiceException('Erro ao criar produto: ${response.statusCode}');
      }
    } catch (e) {
      if (e is ProdutoServiceException) rethrow;
      throw ProdutoServiceException('Falha na conexão: $e');
    }
  }

  Future<Produto> updateProduto(String id, {String? nome, String? descricao, double? precoBase, String? imagemUrl}) async {
    try {
      final body = <String, dynamic>{};
      if (nome != null) body['nome'] = nome;
      if (descricao != null) body['descricao'] = descricao;
      if (precoBase != null) body['precoBase'] = precoBase;
      if (imagemUrl != null && imagemUrl.isNotEmpty) {
        body['imagemUrl'] = imagemUrl;
      }
      final response = await http.put(
        Uri.parse('$baseUrl/$id'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );
      if (response.statusCode == 200) {
        return Produto.fromJson(jsonDecode(response.body));
      } else if (response.statusCode == 503) {
        throw ProdutoServiceException('Serviço de banco de dados temporariamente indisponível. Tente novamente em instantes.');
      } else {
        throw ProdutoServiceException('Erro ao atualizar produto: ${response.statusCode}');
      }
    } catch (e) {
      if (e is ProdutoServiceException) rethrow;
      throw ProdutoServiceException('Falha na conexão: $e');
    }
  }

  Future<ProdutoRegrasCatalogo> fetchRegrasProdutos() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/regras'));
      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        return ProdutoRegrasCatalogo.fromJson(data);
      } else if (response.statusCode == 503) {
        throw ProdutoServiceException('Serviço de banco de dados temporariamente indisponível. Tente novamente em instantes.');
      } else {
        throw ProdutoServiceException('Erro ao carregar regras de produtos: ${response.statusCode}');
      }
    } catch (e) {
      if (e is ProdutoServiceException) rethrow;
      throw ProdutoServiceException('Falha na conexão: $e');
    }
  }
}
