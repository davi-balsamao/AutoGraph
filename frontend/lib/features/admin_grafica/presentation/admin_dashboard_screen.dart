import 'package:flutter/material.dart';

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Dashboard do Administrador')),
      body: const Center(
        child: Text('Dashboard do Administrador', style: TextStyle(fontSize: 24)),
      ),
    );
  }
}
