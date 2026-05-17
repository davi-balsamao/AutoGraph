import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_notifier.dart';
import 'core/routes/app_routes.dart';
import 'core/services/push_notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  // Confirmar inicialização com sucesso no console
  debugPrint('🔥 [AutoGraph Firebase] Inicializado com sucesso! ID do Projeto: ${Firebase.app().options.projectId}');
  
  // Inicializar serviço de Push Notifications
  await PushNotificationService().initialize();
  
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
