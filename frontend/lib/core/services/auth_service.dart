import 'dart:convert';
import 'package:flutter/foundation.dart';
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

  /// Realiza login com e-mail e senha.
  /// Numa implementação real, faria POST /api/auth/login.
  /// Aqui usa credenciais offline para independência do backend.
  Future<UserModel> login(String email, String senha) async {
    // Simulação determinística: admin@autograph.com → GERENTE, qualquer outro → CLIENTE
    await Future.delayed(const Duration(milliseconds: 800));

    final UserModel user;
    if (email.toLowerCase().trim() == 'admin@autograph.com' &&
        senha == 'admin123') {
      user = UserModel(
        id: 'usr-admin-001',
        nome: 'Gerente AutoGraph',
        telefone: '11999990000',
        email: email,
        role: 'GERENTE',
      );
    } else if (email.isNotEmpty && senha.length >= 4) {
      user = UserModel(
        id: 'usr-client-001',
        nome: 'Cliente',
        telefone: '11999990001',
        email: email,
        role: 'CLIENTE',
      );
    } else {
      throw AuthException('Credenciais inválidas.');
    }

    _currentUser = user;
    await _persistSession(user);
    notifyListeners();
    return user;
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
