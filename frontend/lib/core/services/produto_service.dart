import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:file_picker/file_picker.dart';
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

  final String baseUrl = 'https://prescribe-ocean-tiptoeing.ngrok-free.dev/api/produtos';

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

  Future<Produto> createProduto(
    String nome,
    String? descricao,
    double precoBase, {
    String? imagemUrl,
    PlatformFile? file,
  }) async {
    try {
      final uri = Uri.parse(baseUrl);
      final request = http.MultipartRequest('POST', uri);

      request.fields['nome'] = nome;
      if (descricao != null && descricao.isNotEmpty) {
        request.fields['descricao'] = descricao;
      }
      request.fields['precoBase'] = precoBase.toString();
      if (imagemUrl != null && imagemUrl.isNotEmpty) {
        request.fields['imagemUrl'] = imagemUrl;
      }

      if (file != null) {
        if (kIsWeb && file.bytes != null) {
          request.files.add(http.MultipartFile.fromBytes(
            'imagem',
            file.bytes!,
            filename: file.name,
          ));
        } else if (file.path != null) {
          request.files.add(await http.MultipartFile.fromPath(
            'imagem',
            file.path!,
            filename: file.name,
          ));
        }
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

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

  Future<Produto> updateProduto(
    String id, {
    String? nome,
    String? descricao,
    double? precoBase,
    String? imagemUrl,
    PlatformFile? file,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/$id');
      final request = http.MultipartRequest('PUT', uri);

      if (nome != null) request.fields['nome'] = nome;
      if (descricao != null) request.fields['descricao'] = descricao;
      if (precoBase != null) request.fields['precoBase'] = precoBase.toString();
      if (imagemUrl != null && imagemUrl.isNotEmpty) {
        request.fields['imagemUrl'] = imagemUrl;
      }

      if (file != null) {
        if (kIsWeb && file.bytes != null) {
          request.files.add(http.MultipartFile.fromBytes(
            'imagem',
            file.bytes!,
            filename: file.name,
          ));
        } else if (file.path != null) {
          request.files.add(await http.MultipartFile.fromPath(
            'imagem',
            file.path!,
            filename: file.name,
          ));
        }
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

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
