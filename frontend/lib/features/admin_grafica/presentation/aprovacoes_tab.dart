import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/models/proposta_pendente.dart';
import '../../../core/services/chat_service.dart';
import '../../../core/services/proposta_service.dart';
import '../../../core/theme/app_theme.dart';
import 'aprovacao_proposta_screen.dart';

/// Tab que lista propostas de orçamento aguardando aprovação do admin.
/// Atualiza em tempo real via Socket events `proposta-pendente`,
/// `proposta-aprovada`, `proposta-rejeitada`, `proposta-atualizada` e
/// `proposta-cancelada`.
class AprovacoesTab extends StatefulWidget {
  const AprovacoesTab({super.key});

  @override
  State<AprovacoesTab> createState() => _AprovacoesTabState();
}

class _AprovacoesTabState extends State<AprovacoesTab> {
  List<PropostaPendente> _propostas = [];
  bool _loading = true;
  String? _error;
  StreamSubscription? _eventSub;

  @override
  void initState() {
    super.initState();
    _carregar();
    _eventSub = ChatService().propostaEventStream.listen(_handleEvent);
  }

  @override
  void dispose() {
    _eventSub?.cancel();
    super.dispose();
  }

  void _handleEvent(PropostaEvent event) {
    switch (event.tipo) {
      case PropostaEventTipo.pendente:
      case PropostaEventTipo.atualizada:
        _carregar();
        break;
      case PropostaEventTipo.aprovada:
      case PropostaEventTipo.rejeitada:
      case PropostaEventTipo.cancelada:
        setState(() {
          _propostas = _propostas.where((p) => p.sessaoId != event.sessaoId).toList();
        });
        break;
    }
  }

  Future<void> _carregar() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final lista = await PropostaService().listarPendentes();
      if (!mounted) return;
      setState(() {
        _propostas = lista;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return _ErrorView(error: _error!, onRetry: _carregar);
    }
    if (_propostas.isEmpty) {
      return _EmptyView(onRefresh: _carregar);
    }

    return RefreshIndicator(
      onRefresh: _carregar,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _propostas.length,
        separatorBuilder: (_, index) => const SizedBox(height: 12),
        itemBuilder: (context, i) => _PropostaCard(
          proposta: _propostas[i],
          onTap: () async {
            final result = await Navigator.of(context).push<bool>(
              MaterialPageRoute(
                builder: (_) => AprovacaoPropostaScreen(proposta: _propostas[i]),
              ),
            );
            if (result == true) _carregar();
          },
        ),
      ),
    );
  }
}

class _PropostaCard extends StatelessWidget {
  final PropostaPendente proposta;
  final VoidCallback onTap;

  const _PropostaCard({required this.proposta, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final valor = proposta.orcamento.total.toStringAsFixed(2).replaceAll('.', ',');
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: Colors.amber.shade300, width: 1),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.pending_actions, color: Colors.amber.shade700, size: 22),
                  const SizedBox(width: 8),
                  Text(
                    'Aguardando aprovação',
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.amber.shade800,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    'R\$ $valor',
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.brandGreen,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                proposta.clienteNome,
                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                proposta.especificacoes.produto,
                style: GoogleFonts.outfit(fontSize: 14, color: Colors.grey.shade700),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 4,
                children: proposta.especificacoes.requisitos.take(3).map((r) {
                  return Chip(
                    label: Text(
                      '${r.pergunta}: ${r.resposta}',
                      style: const TextStyle(fontSize: 11),
                    ),
                    visualDensity: VisualDensity.compact,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  );
                }).toList(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyView extends StatelessWidget {
  final VoidCallback onRefresh;
  const _EmptyView({required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const SizedBox(height: 80),
          const Icon(Icons.check_circle_outline, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          Center(
            child: Text(
              'Nenhuma proposta aguardando aprovação',
              style: GoogleFonts.outfit(fontSize: 16, color: Colors.grey.shade700),
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _ErrorView({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, color: Colors.red, size: 48),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(error, textAlign: TextAlign.center),
          ),
          const SizedBox(height: 12),
          ElevatedButton(onPressed: onRetry, child: const Text('Tentar novamente')),
        ],
      ),
    );
  }
}
