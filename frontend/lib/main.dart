import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';

void main() {
  runApp(const AutoGraphApp());
}

class AutoGraphApp extends StatelessWidget {
  const AutoGraphApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AutoGraph',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      home: const _SplashPlaceholder(),
    );
  }
}

class _SplashPlaceholder extends StatelessWidget {
  const _SplashPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Text(
          'AutoGraph',
          style: Theme.of(context).textTheme.displayLarge,
        ),
      ),
    );
  }
}
