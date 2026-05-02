import 'package:flutter/material.dart';

class ClientHistoryScreen extends StatelessWidget {
  const ClientHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Histórico do Cliente')),
      body: const Center(
        child: Text('Histórico do Cliente', style: TextStyle(fontSize: 24)),
      ),
    );
  }
}
