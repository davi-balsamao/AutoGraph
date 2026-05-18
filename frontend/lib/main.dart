import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_notifier.dart';
import 'core/routes/app_routes.dart';
import 'core/services/push_notification_service.dart';

bool get _fcmSupported {
  if (kIsWeb) return true;
  return Platform.isAndroid || Platform.isIOS || Platform.isMacOS;
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (_fcmSupported) {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    debugPrint('🔥 [AutoGraph Firebase] Inicializado! ID do Projeto: ${Firebase.app().options.projectId}');
    // Fire-and-forget: setar listeners do FCM não pode bloquear o boot do app.
    // Em web especialmente, getToken/getInitialMessage podem demorar pelo SW.
    // ignore: discarded_futures
    PushNotificationService().initialize();
  } else {
    debugPrint('⚠️ [AutoGraph] Plataforma sem suporte a FCM (Windows/Linux desktop) — pulando Firebase. Socket.io continua funcionando.');
  }

  runApp(const AutoGraphApp());
}

class AutoGraphApp extends StatelessWidget {
  const AutoGraphApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: themeNotifier,
      builder: (context, _) {
        return MaterialApp(
          title: 'AutoGraph',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: themeNotifier.themeMode,
          initialRoute: AppRoutes.landing,
          onGenerateRoute: AppRouter.onGenerateRoute,
        );
      },
    );
  }
}