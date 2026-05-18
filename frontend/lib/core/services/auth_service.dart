import 'dart:convert';
import 'dart:io' show Platform;
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart' show kIsWeb, ChangeNotifier, debugPrint;

import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';


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
    if (kIsWeb) return 'http://localhost:3000/api';
    try {
      if (Platform.isAndroid) return 'http://10.0.2.2:3000/api';
    } catch (_) {}
    return 'http://localhost:3000/api';
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
      notifyListeners();
      return user;
    }

    throw AuthException('Credenciais inválidas ou servidor indisponível.');
  }


  /// Realiza registro de novo cliente.
  Future<UserModel> register({
    required String nome,
    required String email,
    required String senha,
    String? telefone,
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
        }),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return UserModel.fromJson(data['user']);
      } else {
        final data = jsonDecode(response.body);
        throw AuthException(data['error'] ?? 'Erro no registro.');
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
