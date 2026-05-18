import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_notifier.dart';
import 'core/routes/app_routes.dart';
import 'core/services/chat_service.dart';

void main() {
  // 2. Garante que os bindings do Flutter estejam prontos antes de inicializar o socket
  WidgetsFlutterBinding.ensureInitialized();

  // 3. ACORDA O SOCKET: Instancia o Singleton e dispara a conexão com o Node.js imediatamente
  ChatService();

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