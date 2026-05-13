import 'dart:convert';
import 'package:flutter/material.dart';
import '../../../core/models/ordem_servico.dart';
import 'package:intl/intl.dart';

class OsDetailsScreen extends StatelessWidget {
  final OrdemServico os;

  const OsDetailsScreen({super.key, required this.os});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final jsonSpecs = const JsonEncoder.withIndent('  ').convert(os.especificacoes);
    final DateFormat dateFormat = DateFormat('dd/MM/yyyy HH:mm');

    return Scaffold(
      appBar: AppBar(
        title: Text('Detalhes: OS #${os.id.split('-').last}'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cabeçalho
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: _getStatusColor(os.status),
                  radius: 8,
                ),
                const SizedBox(width: 8),
                Text(
                  os.status.label,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: _getStatusColor(os.status),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // Informações principais
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _InfoRow(label: 'Produto', value: os.produtoResumo),
                    const Divider(),
                    _InfoRow(label: 'Cliente', value: os.clienteNome ?? 'Não informado'),
                    _InfoRow(label: 'Telefone', value: os.clienteTelefone ?? 'Não informado'),
                    const Divider(),
                    _InfoRow(label: 'Criado em', value: dateFormat.format(os.criadoEm)),
                    _InfoRow(label: 'Atualizado em', value: dateFormat.format(os.atualizadoEm)),
                    if (os.durationSeconds > 0) ...[
                      const Divider(),
                      _InfoRow(label: 'Tempo de Produção', value: os.durationFormatted),
                    ],
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            Text('Especificações Técnicas', style: theme.textTheme.titleLarge),
            const SizedBox(height: 8),
            
            // Especificações em JSON formatado
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: theme.colorScheme.outlineVariant),
              ),
              child: SelectableText(
                jsonSpecs,
                style: const TextStyle(fontFamily: 'monospace', fontSize: 13),
              ),
            ),

            if (os.mensagemSugerida != null && os.mensagemSugerida!.isNotEmpty) ...[
              const SizedBox(height: 24),
              Text('Mensagem Sugerida (IA)', style: theme.textTheme.titleLarge),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: SelectableText(
                  os.mensagemSugerida!,
                  style: TextStyle(color: theme.colorScheme.onPrimaryContainer),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(StatusOS status) {
    switch (status) {
      case StatusOS.aguardandoOrcamento:
        return Colors.orange;
      case StatusOS.emProducao:
        return Colors.blue;
      case StatusOS.prontaParaRetirada:
        return Colors.green;
      case StatusOS.entregue:
        return Colors.grey;
      case StatusOS.cancelada:
        return Colors.red;
      default:
        return Colors.blueGrey;
    }
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey),
            ),
          ),
          Expanded(
            child: Text(value),
          ),
        ],
      ),
    );
  }
}
