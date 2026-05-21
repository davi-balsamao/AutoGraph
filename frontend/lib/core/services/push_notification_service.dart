import 'dart:async';
import 'package:flutter/foundation.dart';

class PushNotificationService {
  static final PushNotificationService _instance = PushNotificationService._();

  factory PushNotificationService() => _instance;

  PushNotificationService._();

  final StreamController<Map<String, dynamic>> _notificationTapController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get onNotificationTap =>
      _notificationTapController.stream;

  Future<void> initialize() async {
    debugPrint('PushNotificationService desativado temporariamente para Android.');
  }

  Future<void> syncTokenWithBackend() async {
    debugPrint('Sync FCM ignorado temporariamente.');
  }

  void dispose() {
    _notificationTapController.close();
  }
}
