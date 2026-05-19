import 'dart:convert';
import 'dart:io' show Platform;
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart' show kIsWeb, ChangeNotifier, debugPrint;

import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import 'push_notification_service.dart';

/// Serviço de autenticação local.
/// Armazena sessão via SharedPreferences e expõe role para AuthGuard.
class AuthService extends ChangeNotifier {
  static final AuthService _instance = AuthService._();
  factory AuthService() => _instance;
  AuthService._();

  UserModel? _currentUser;
  UserModel? get currentUser => _currentUser;
  bool get isLoggedIn => _currentUser != null;
  bool get isAdmin => _currentUser?.isAdmin ?? false;

  String get baseUrl {
    if (kIsWeb) return 'http://10.10.0.139:3000/api';
    try {
      if (Platform.isAndroid) return 'http://10.10.0.139:3000/api';
    } catch (_) {}
    return 'http://10.10.0.139:3000/api';
  }

  /// Realiza login com e-mail e senha.
  Future<UserModel> login(String email, String senha) async {
    // 1. Tenta login real via API
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'senha': senha}),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final user = UserModel.fromJson(data['user']);
        _currentUser = user;
        await _persistSession(user);
        
        // Sincronizar Token do FCM ao fazer Login
        PushNotificationService().syncTokenWithBackend();
        
        notifyListeners();
        return user;
      }
    } catch (e) {
      debugPrint('⚠️ Erro na conexão com API (usando mock): $e');
    }

    // 2. Fallback para Mock (para desenvolvimento/demonstração)
    if (email.toLowerCase().trim() == 'admin@autograph.com' && senha == 'admin123') {
      final user = UserModel(
        id: 'usr-admin-mock',
        nome: 'Gerente AutoGraph (Offline)',
        telefone: '11999990000',
        email: email,
        role: 'GERENTE',
      );
      _currentUser = user;
      await _persistSession(user);
      
      PushNotificationService().syncTokenWithBackend();
      
      notifyListeners();
      return user;
    } else if (email.isNotEmpty && senha.length >= 4) {
      final user = UserModel(
        id: 'usr-client-mock',
        nome: 'Cliente (Offline)',
        telefone: '11999990001',
        email: email,
        role: 'CLIENTE',
      );
      _currentUser = user;
      await _persistSession(user);
      
      PushNotificationService().syncTokenWithBackend();
      
      notifyListeners();
      return user;
    }

    throw AuthException('Credenciais inválidas ou servidor indisponível.');
  }

  /// Realiza registo de novo cliente.
  Future<UserModel> register({
    required String nome,
    required String email,
    required String senha,
    String? telefone,
    String? enderecoCompleto,
    String? enderecoReferencia,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'nome': nome,
          'email': email,
          'senha': senha,
          'telefone': telefone,
          'enderecoCompleto': enderecoCompleto,
          'enderecoReferencia': enderecoReferencia,
        }),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return UserModel.fromJson(data['user']);
      } else {
        final data = jsonDecode(response.body);
        throw AuthException(data['error'] ?? 'Erro no registo.');
      }
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException('Falha na conexão: $e');
    }
  }

  /// Restaura sessão salva localmente.
  Future<bool> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final json = prefs.getString('autograph_user');
    if (json == null) return false;

    try {
      _currentUser = UserModel.fromJson(jsonDecode(json));
      
      // Sincronizar Token do FCM ao restaurar Sessão
      PushNotificationService().syncTokenWithBackend();
      
      notifyListeners();
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Encerra a sessão.
  Future<void> logout() async {
    _currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('autograph_user');
    notifyListeners();
  }

  /// Busca todos os utilizadores do sistema (apenas Admin/Gerente).
  Future<List<UserModel>> fetchUsers() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/users'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => UserModel.fromJson(json)).toList();
      } else {
        throw AuthException('Falha ao buscar utilizadores do sistema.');
      }
    } catch (e) {
      debugPrint('⚠️ Erro ao buscar utilizadores da API (retornando mock): $e');
      // Mock de desenvolvimento offline
      return [
        const UserModel(id: 'c1', nome: 'Cliente 1 (Mock)', telefone: '11999990001', email: 'cliente1@test.com', role: 'CLIENTE', atendimentoHumano: false),
        const UserModel(id: 'c2', nome: 'Cliente 2 (Mock)', telefone: '11999990002', email: 'cliente2@test.com', role: 'CLIENTE', atendimentoHumano: true),
        const UserModel(id: 'usr-admin-mock', nome: 'Gerente AutoGraph (Mock)', telefone: '11999990000', email: 'admin@autograph.com', role: 'GERENTE', atendimentoHumano: false),
      ];
    }
  }

  /// Atualiza os dados de um utilizador pelo ID (apenas Admin/Gerente).
  Future<UserModel> updateUser(String id, {
    required String nome,
    required String email,
    required String telefone,
    required String role,
    required bool atendimentoHumano,
    String? enderecoCompleto,
    String? enderecoReferencia,
    String? senha,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/auth/users/$id'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'nome': nome,
          'email': email,
          'telefone': telefone,
          'role': role,
          'atendimentoHumano': atendimentoHumano,
          'enderecoCompleto': enderecoCompleto,
          'enderecoReferencia': enderecoReferencia,
          if (senha != null && senha.isNotEmpty) 'senha': senha,
        }),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final updatedUser = UserModel.fromJson(data['user']);
        
        // Se o utilizador editado for o próprio utilizador logado, atualiza o _currentUser
        if (_currentUser?.id == id) {
          _currentUser = updatedUser;
          await _persistSession(updatedUser);
          notifyListeners();
        }
        return updatedUser;
      } else {
        final data = jsonDecode(response.body);
        throw AuthException(data['error'] ?? 'Falha ao atualizar dados do utilizador.');
      }
    } catch (e) {
      if (e is AuthException) rethrow;
      throw AuthException('Erro de conexão ao atualizar utilizador: $e');
    }
  }

  Future<void> _persistSession(UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('autograph_user', jsonEncode(user.toJson()));
  }
}

/// Exceção de autenticação.
class AuthException implements Exception {
  final String message;
  AuthException(this.message);

  @override
  String toString() => message;
}