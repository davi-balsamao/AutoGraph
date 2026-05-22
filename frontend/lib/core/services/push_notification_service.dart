import 'dart:async';
import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'web_notification_helper.dart'
    if (dart.library.js_interop) 'web_notification_helper_web.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

// Canal de alta importância do Android para exibir banners pop-up
const AndroidNotificationChannel _channel = AndroidNotificationChannel(
  'autograph_high_importance_channel', // id
  'Notificações Importantes AutoGraph', // title
  description: 'Canal usado para alertas críticos, novos pedidos e chats.', // description
  importance: Importance.max,
  playSound: true,
  enableVibration: true,
);

final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

/// Função global obrigatória para processar mensagens recebidas com o app em segundo plano/fechado
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint("📩 [FCM] Notificação recebida em Segundo Plano: ${message.messageId}");
}

class PushNotificationService {
  static final PushNotificationService _instance = PushNotificationService._();
  factory PushNotificationService() => _instance;
  PushNotificationService._();

  bool _isInitialized = false;

  /// Broadcast de cliques em notificação. Telas interessadas (ex: dashboard)
  /// se inscrevem e navegam quando vem `type=PROPOSTA_PENDENTE`, etc.
  final StreamController<Map<String, dynamic>> _notificationTapController =
      StreamController<Map<String, dynamic>>.broadcast();
  Stream<Map<String, dynamic>> get onNotificationTap =>
      _notificationTapController.stream;

  void _emitTap(Map<String, dynamic>? data) {
    if (data == null || data.isEmpty) return;
    _notificationTapController.add(Map<String, dynamic>.from(data));
  }

  /// Inicializa as configurações de Push Notifications
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // 1. Configurar Background Handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // 2. Configurações do Local Notifications para o canal do Android
      await _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(_channel);

      // Configuração inicial do Local Notifications para tratar cliques nas notificações em primeiro plano
      const AndroidInitializationSettings initializationSettingsAndroid =
          AndroidInitializationSettings('@mipmap/ic_launcher');
      const InitializationSettings initializationSettings =
          InitializationSettings(android: initializationSettingsAndroid);

      await _localNotifications.initialize(
        settings: initializationSettings,
        onDidReceiveNotificationResponse: (NotificationResponse response) {
          debugPrint("📱 [FCM] Usuário clicou na notificação em primeiro plano: ${response.payload}");
          if (response.payload != null && response.payload!.isNotEmpty) {
            try {
              final data = jsonDecode(response.payload!);
              if (data is Map) _emitTap(Map<String, dynamic>.from(data));
            } catch (_) {}
          }
        },
      );

      // 3. Solicitar Permissões do Usuário
      final NotificationSettings settings = await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      debugPrint('🔔 [FCM] Permissão de notificação concedida: ${settings.authorizationStatus}');

      // 4. Configurar Listeners de mensagens em Primeiro Plano
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('📩 [FCM] Mensagem recebida em Primeiro Plano!');
        
        final RemoteNotification? notification = message.notification;
        final AndroidNotification? android = message.notification?.android;

        if (notification != null) {
          if (!kIsWeb) {
            // 📱 FLUXO MOBILE (Android/iOS)
            _localNotifications.show(
              id: notification.hashCode,
              title: notification.title,
              body: notification.body,
              notificationDetails: NotificationDetails(
                android: AndroidNotificationDetails(
                  _channel.id,
                  _channel.name,
                  channelDescription: _channel.description,
                  icon: android?.smallIcon ?? '@mipmap/ic_launcher',
                  importance: Importance.max,
                  priority: Priority.high,
                  playSound: true,
                  enableVibration: true,
                ),
              ),
              payload: jsonEncode(message.data),
            );
          } else {
            // 👇 🌐 FLUXO WEB EM PRIMEIRO PLANO (FOREGROUND)
            // Força o navegador a criar uma notificação nativa HTML5 via JS Interop
            showWebNotification(notification.title ?? '', notification.body ?? '');
          }
        }
      });

      // App Aberto a partir de Notificação (Segundo plano)
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('🎯 [FCM] O aplicativo foi aberto a partir de uma notificação!');
        _emitTap(message.data);
      });

      // App aberto por notificação a partir do estado "fechado".
      // Em web, getInitialMessage depende do service worker estar registrado —
      // se ele falhar, esse await pode travar a inicialização. Em web fazemos
      // fire-and-forget; em mobile mantemos o await porque é instantâneo.
      if (kIsWeb) {
        // ignore: discarded_futures
        FirebaseMessaging.instance.getInitialMessage().then((initial) {
          if (initial != null) _emitTap(initial.data);
        }).catchError((e) {
          debugPrint('⚠️ [FCM] getInitialMessage falhou (web): $e');
        });
      } else {
        final initial = await FirebaseMessaging.instance.getInitialMessage();
        if (initial != null) {
          _emitTap(initial.data);
        }
      }

      // 5. Atualizar Token e escutar novos tokens gerados.
      // Em web sem VAPID key, getToken() pode pendurar — fire-and-forget para
      // não bloquear o boot do app.
      // ignore: discarded_futures
      syncTokenWithBackend();
      FirebaseMessaging.instance.onTokenRefresh.listen((String newToken) async {
        debugPrint('🔄 [FCM] Novo token FCM gerado: $newToken');
        await _sendTokenToBackend(newToken);
      });

      _isInitialized = true;
      debugPrint('🔥 [PushNotificationService] Inicializado com sucesso!');
    } catch (e) {
      debugPrint('❌ [PushNotificationService] Erro ao inicializar: $e');
    }
  }

  /// VAPID key do Firebase Web Push, exigida pelo navegador para emitir um
  /// token FCM válido. Sem ela, getToken() em web retorna null e o backend
  /// não consegue enviar push para o admin (Socket cobre em tempo real).
  ///
  /// Como obter:
  ///   Console Firebase → projeto autograph-83959
  ///   → Project settings → Cloud Messaging → Web push certificates
  ///   → "Generate key pair" → copiar a chave pública e colar abaixo.
  ///
  /// Quando deixada vazia, a chamada simplesmente omite o parâmetro e o
  /// comportamento atual (sem push web funcional) é preservado.
  static const String _webVapidKey = ''; // Nota: colar VAPID key do autograph-83959

  /// Sincroniza o token atual do dispositivo com o backend caso o usuário esteja logado
  Future<void> syncTokenWithBackend() async {
    try {
      final String? token = await FirebaseMessaging.instance.getToken(
        vapidKey: (kIsWeb && _webVapidKey.isNotEmpty) ? _webVapidKey : null,
      );
      if (token != null) {
        debugPrint('🔑 [FCM] Token FCM Atual: $token');
        await _sendTokenToBackend(token);
      } else if (kIsWeb && _webVapidKey.isEmpty) {
        debugPrint('ℹ️ [FCM] Token FCM web indisponível: VAPID key não configurada (ver _webVapidKey).');
      }
    } catch (e) {
      debugPrint('❌ [PushNotificationService] Falha ao sincronizar token: $e');
    }
  }

  /// Envia o token FCM para o backend do usuário ativo
  Future<void> _sendTokenToBackend(String token) async {
    final authService = AuthService();
    if (!authService.isLoggedIn) {
      debugPrint('🤫 [FCM] Ignorando envio do token FCM: Nenhum usuário autenticado no momento.');
      return;
    }

    final userId = authService.currentUser!.id;
    final url = '${authService.baseUrl}/auth/users/$userId/fcm';

    try {
      final response = await http.put(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'fcmToken': token}),
      );

      if (response.statusCode == 200) {
        debugPrint('✅ [FCM] Token FCM registrado no backend para o usuário $userId.');
      } else {
        debugPrint('⚠️ [FCM] Falha ao registrar token no backend: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      debugPrint('❌ [FCM] Erro na requisição para registrar token FCM: $e');
    }
  }
}