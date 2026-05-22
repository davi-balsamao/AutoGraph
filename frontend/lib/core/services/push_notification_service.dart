import 'dart:async';
import 'dart:convert';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'web_notification_helper.dart'
    if (dart.library.js_interop) 'web_notification_helper_web.dart';

const AndroidNotificationChannel _channel = AndroidNotificationChannel(
  'autograph_high_importance_channel',
  'AutoGraph Notifications',
  description: 'Canal usado para notificações importantes da AutoGraph.',
  importance: Importance.max,
);

final FlutterLocalNotificationsPlugin _localNotifications =
    FlutterLocalNotificationsPlugin();

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp();
    }
  } catch (_) {
    // Em alguns ambientes o Firebase já foi inicializado no main.
  }

  debugPrint('[FCM] Mensagem recebida em background: ${message.messageId}');
}

class PushNotificationService {
  static final PushNotificationService _instance = PushNotificationService._();

  factory PushNotificationService() => _instance;

  PushNotificationService._();

  bool _isInitialized = false;

  final StreamController<Map<String, dynamic>> _notificationTapController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get onNotificationTap =>
      _notificationTapController.stream;

  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp();
      }

      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      if (!kIsWeb) {
        await _localNotifications
            .resolvePlatformSpecificImplementation<
                AndroidFlutterLocalNotificationsPlugin>()
            ?.createNotificationChannel(_channel);

        const initializationSettingsAndroid =
            AndroidInitializationSettings('@mipmap/ic_launcher');

        const initializationSettings = InitializationSettings(
          android: initializationSettingsAndroid,
        );

        await _localNotifications.initialize(
          settings: initializationSettings,
          onDidReceiveNotificationResponse: (NotificationResponse response) {
            debugPrint(
              '[FCM] Usuário clicou na notificação em primeiro plano: ${response.payload}',
            );

            if (response.payload != null && response.payload!.isNotEmpty) {
              try {
                final data = jsonDecode(response.payload!);

                if (data is Map) {
                  _emitTap(Map<String, dynamic>.from(data));
                }
              } catch (_) {}
            }
          },
        );
      }

      await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      await syncTokenWithBackend();

      FirebaseMessaging.instance.onTokenRefresh.listen((token) async {
        debugPrint('[FCM] Token atualizado: $token');
        await _sendTokenToBackend(token);
      });

      FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
        debugPrint('[FCM] Mensagem recebida em foreground: ${message.messageId}');

        final notification = message.notification;
        final android = notification?.android;

        if (notification == null) return;

        if (kIsWeb) {
          try {
            showWebNotification(
              notification.title ?? 'AutoGraph',
              notification.body ?? '',
            );
          } catch (e) {
            debugPrint('[FCM] Erro ao exibir notificação web: $e');
          }

          return;
        }

        await _localNotifications.show(
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
      });

      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('[FCM] App aberto a partir de notificação.');
        _emitTap(message.data);
      });

      final initialMessage = await FirebaseMessaging.instance.getInitialMessage();

      if (initialMessage != null) {
        debugPrint('[FCM] App iniciado por notificação.');
        _emitTap(initialMessage.data);
      }

      _isInitialized = true;
      debugPrint('[PushNotificationService] Inicializado com sucesso.');
    } catch (e) {
      debugPrint('[PushNotificationService] Erro ao inicializar: $e');
    }
  }

  Future<void> syncTokenWithBackend() async {
    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp();
      }

      final token = await FirebaseMessaging.instance.getToken();

      if (token == null || token.isEmpty) {
        debugPrint('[FCM] Nenhum token disponível para sincronizar.');
        return;
      }

      debugPrint('[FCM] Token obtido: $token');
      await _sendTokenToBackend(token);
    } catch (e) {
      debugPrint('[FCM] Erro ao sincronizar token com backend: $e');
    }
  }

  Future<void> _sendTokenToBackend(String token) async {
    try {
      // Mantido temporariamente sem integração direta com AuthService,
      // porque o AuthService atual não expõe getCurrentUser() nem registerPushToken().
      //
      // O token já é obtido corretamente aqui. Depois podemos conectar este método
      // ao endpoint correto do backend quando confirmarmos a rota usada para salvar FCM.
      debugPrint('[FCM] Token pronto para envio ao backend: $token');
    } catch (e) {
      debugPrint('[FCM] Erro ao preparar envio do token ao backend: $e');
    }
  }

  void _emitTap(Map<String, dynamic> data) {
    if (_notificationTapController.isClosed) return;
    _notificationTapController.add(data);
  }

  void dispose() {
    if (!_notificationTapController.isClosed) {
      _notificationTapController.close();
    }
  }
}