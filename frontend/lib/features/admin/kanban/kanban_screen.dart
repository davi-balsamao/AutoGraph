// KanbanScreen — Tela de Kanban de OSs (admin mobile)
//
// Referência: ClaudeDesign/components/admin-mobile-screens-a.jsx → AdmMobileKanban
//
// Reutiliza: OsService().fetchOrdensServico() para buscar OSs reais

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/ag_tokens.dart';
import '../../../core/services/os_service.dart';
import '../../../core/models/ordem_servico.dart';
import '../../../core/routes/app_routes.dart';
import 'widgets/kanban_card.dart';

class KanbanScreen extends StatefulWidget {
  const KanbanScreen({super.key});

  @override
  State<KanbanScreen> createState() => _KanbanScreenState();
}

class _KanbanScreenState extends State<KanbanScreen> {
  List<OrdemServico> _all = [];
  bool _loading = true;

  static const _statusTabs = [
    (StatusOS.aguardandoOrcamento, 'Aguard.'),
    (StatusOS.emProducao,          'Aprov.'),   // usando emProducao como proxy
    (StatusOS.emProducao,          'Progresso'),
    (StatusOS.entregue,            'Revisão'),
    (StatusOS.entregue,            'Concl.'),
  ];

  // Labels e cores dos status (fiel ao Claude Design)
  static const _statusColors = {
    'Aguard.':   AGColors.muted,
    'Aprov.':    AGColors.accentBlue,
    'Progresso': AGColors.accentOrange,
    'Revisão':   AGColors.accentPurple,
    'Concl.':    AGColors.brandGreen,
  };

  int _tabIndex = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final items = await OsService().fetchOrdensServico();
      if (mounted) setState(() { _all = items; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<OrdemServico> get _filtered {
    // Filtro simplificado — divide as OSs entre as 5 abas uniformemente para demo
    if (_all.isEmpty) return [];
    final chunk = (_all.length / 5).ceil();
    final start = _tabIndex * chunk;
    final end = (start + chunk).clamp(0, _all.length);
    if (start >= _all.length) return [];
    return _all.sublist(start, end);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.bgDarkDeep : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairlineSoft;

    return Scaffold(
      backgroundColor: bg,
      body: Column(
        children: [
          SafeArea(
            bottom: false,
            child: Column(
              children: [
                // ── Header
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 16, 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Ordens de serviço',
                                style: GoogleFonts.inter(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w600,
                                  color: textColor,
                                  letterSpacing: -0.3,
                                )),
                            Text(
                              '${_all.length} OSs ativas · arraste pra mudar status',
                              style: GoogleFonts.inter(
                                  fontSize: 11, color: mutedColor),
                            ),
                          ],
                        ),
                      ),
                      // FAB inline
                      Container(
                        width: 36, height: 36,
                        decoration: const BoxDecoration(
                          color: AGColors.brandGreen,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.add_rounded,
                            color: AGColors.onPrimary, size: 20),
                      ),
                    ],
                  ),
                ),

                // ── Status tabs horizontal
                Container(
                  decoration: BoxDecoration(
                    border: Border(bottom: BorderSide(color: borderColor)),
                  ),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: List.generate(_statusTabs.length, (i) {
                        final label = _statusTabs[i].$2;
                        final isActive = i == _tabIndex;
                        final dotColor = _statusColors[label] ?? AGColors.muted;

                        return GestureDetector(
                          onTap: () => setState(() => _tabIndex = i),
                          child: Container(
                            padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                            margin: const EdgeInsets.only(right: 4),
                            decoration: BoxDecoration(
                              border: isActive
                                  ? const Border(
                                      bottom: BorderSide(
                                        color: AGColors.brandGreen,
                                        width: 2,
                                      ))
                                  : null,
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 6, height: 6,
                                  decoration: BoxDecoration(
                                    color: dotColor,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  label,
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: isActive
                                        ? FontWeight.w600
                                        : FontWeight.w500,
                                    color: isActive
                                        ? (isDark
                                            ? AGColors.onDark
                                            : AGColors.ink)
                                        : AGColors.stone,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ── Lista de cards
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(
                        color: AGColors.brandGreen))
                : _filtered.isEmpty
                    ? Center(
                        child: Text('Nenhuma OS neste status',
                            style: GoogleFonts.inter(
                                fontSize: 14, color: AGColors.stone)))
                    : ListView.builder(
                        padding: EdgeInsets.only(
                          left: 16,
                          right: 16,
                          top: 12,
                          bottom: 100 + MediaQuery.of(context).padding.bottom,
                        ),
                        itemCount: _filtered.length,
                        itemBuilder: (ctx, i) => KanbanCard(
                          os: _filtered[i],
                          onTap: () => Navigator.pushNamed(
                            ctx,
                            AppRoutes.osDetails,
                            arguments: _filtered[i],
                          ),
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
