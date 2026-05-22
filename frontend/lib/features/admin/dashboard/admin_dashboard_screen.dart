// AdminDashboardScreen — Dashboard do painel admin (Geral)
//
// Referência: ClaudeDesign/components/admin-mobile-screens-a.jsx → AdmMobileDashboard

import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import '../../../core/theme/ag_tokens.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/services/os_service.dart';
import '../../../core/services/chat_service.dart';
import '../../../core/models/ordem_servico.dart';
import '../../../core/widgets/ag_theme_toggle.dart';

class AdminDashboardScreen extends StatefulWidget {
  final VoidCallback? onViewKanban;
  const AdminDashboardScreen({super.key, this.onViewKanban});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  List<OrdemServico> _orders = [];
  int _propostasCount = 0;
  bool _loading = true;
  StreamSubscription<OsEvent>? _osSub;

  @override
  void initState() {
    super.initState();
    _load();
    _osSub = ChatService().osEventStream.listen((event) {
      if (event.tipo == OsEventTipo.nova || event.tipo == OsEventTipo.atualizada) _load();
    });
  }

  @override
  void dispose() {
    _osSub?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        OsService().fetchOrdensServico(),
        _fetchPropostasCount(),
      ]);
      if (mounted) {
        setState(() {
          _orders = results[0] as List<OrdemServico>;
          _propostasCount = results[1] as int;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<int> _fetchPropostasCount() async {
    try {
      final res = await http.get(
        Uri.parse('${AuthService().baseUrl}/propostas'),
        headers: AuthService().authHeaders,
      );
      if (res.statusCode == 200) {
        final List<dynamic> data = jsonDecode(res.body);
        return data.length;
      }
    } catch (_) {}
    return 0;
  }

  int _count(StatusOS s) => _orders.where((o) => o.status == s).length;
  int get _osAtivas => _orders.length;
  int get _concluidasHoje {
    final hoje = DateTime.now();
    return _orders
        .where((o) =>
            o.status == StatusOS.entregue &&
            o.atualizadoEm.year == hoje.year &&
            o.atualizadoEm.month == hoje.month &&
            o.atualizadoEm.day == hoje.day)
        .length;
  }

  double get _receitaHoje {
    final hoje = DateTime.now();
    return _orders
        .where((o) =>
            o.status != StatusOS.cancelada &&
            o.status != StatusOS.criada &&
            o.status != StatusOS.aguardandoOrcamento &&
            o.criadoEm.year == hoje.year &&
            o.criadoEm.month == hoje.month &&
            o.criadoEm.day == hoje.day)
        .fold(0.0, (sum, o) => sum + o.total);
  }

  double get _ticketMedio {
    final active = _orders
        .where((o) =>
            o.status != StatusOS.cancelada &&
            o.status != StatusOS.criada &&
            o.status != StatusOS.aguardandoOrcamento)
        .toList();
    if (active.isEmpty) return 0.0;
    return active.fold(0.0, (sum, o) => sum + o.total) / active.length;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AGColors.bgDarkDeep : AGColors.canvas;
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    final cardBg = isDark ? AGColors.canvasDark : AGColors.canvas;
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;
    final surfaceBg = isDark ? AGColors.surfaceDark : AGColors.surfaceSoft;

    final user = AuthService().currentUser;
    final nome = user?.nome ?? 'Admin';
    final inicial = nome.isNotEmpty ? nome[0].toUpperCase() : 'A';

    return Scaffold(
      backgroundColor: bg,
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AGColors.brandGreen))
          : RefreshIndicator(
              onRefresh: _load,
              color: AGColors.brandGreen,
              child: ListView(
                padding: EdgeInsets.only(
                  bottom: 100 + MediaQuery.of(context).padding.bottom,
                ),
                children: [
                  SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // ── Greeting block
                          Row(
                            children: [
                              Container(
                                width: 36,
                                height: 36,
                                decoration: const BoxDecoration(
                                  color: AGColors.brandGreen,
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text(
                                    inicial,
                                    style: GoogleFonts.inter(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: AGColors.onPrimary,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Bom dia,',
                                        style: GoogleFonts.inter(fontSize: 11, color: mutedColor)),
                                    Text(
                                      nome,
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: textColor,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: surfaceBg,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: borderColor),
                                ),
                                child: Icon(Icons.notifications_outlined, size: 18, color: textColor),
                              ),
                              const SizedBox(width: 8),
                              const ThemeToggleIcon(size: 36),
                            ],
                          ),

                          const SizedBox(height: 16),

                          // ── Hero: Receita (sem dados reais ainda)
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: isDark ? AGColors.surfaceDark : AGColors.brandTealDeep,
                              borderRadius: BorderRadius.circular(AGRadius.xl - 2),
                              border: isDark ? Border.all(color: AGColors.hairlineDarkStr) : null,
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'RECEITA HOJE',
                                  style: GoogleFonts.inter(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 1,
                                    color: AGColors.brandGreen,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'R\$ ${_receitaHoje.toStringAsFixed(2).replaceAll('.', ',')}',
                                  style: GoogleFonts.inter(
                                    fontSize: 28,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white,
                                    letterSpacing: -0.5,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Faturamento de hoje',
                                  style: GoogleFonts.inter(fontSize: 11, color: AGColors.brandGreen),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  '$_osAtivas OSs ativas no sistema',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: AGColors.brandGreen,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 12),

                          // ── KPI grid 2×2
                          GridView.count(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            crossAxisCount: 2,
                            crossAxisSpacing: 10,
                            mainAxisSpacing: 10,
                            childAspectRatio: 1.55,
                            children: [
                              _KpiCard(
                                label: 'OSS ATIVAS',
                                value: '$_osAtivas',
                                delta: '${_count(StatusOS.emProducao)} em produção',
                                deltaColor: AGColors.brandGreenMid,
                                cardBg: cardBg,
                                borderColor: borderColor,
                                textColor: textColor,
                                mutedColor: mutedColor,
                              ),
                              _KpiCard(
                                label: 'TICKET MÉDIO',
                                value: 'R\$ ${_ticketMedio.toStringAsFixed(2).replaceAll('.', ',')}',
                                delta: 'este mês',
                                deltaColor: AGColors.brandGreenMid,
                                cardBg: cardBg,
                                borderColor: borderColor,
                                textColor: textColor,
                                mutedColor: mutedColor,
                              ),
                              _KpiCard(
                                label: 'RESPOSTA AGENTE',
                                value: '1.2 min',
                                delta: 'em dia',
                                deltaColor: AGColors.brandGreenMid,
                                cardBg: cardBg,
                                borderColor: borderColor,
                                textColor: textColor,
                                mutedColor: mutedColor,
                              ),
                              _KpiCard(
                                label: 'APROVAR',
                                value: '$_propostasCount',
                                delta: _propostasCount > 0 ? 'pendentes' : 'em dia',
                                deltaColor: _propostasCount > 0
                                    ? AGColors.accentOrange
                                    : AGColors.brandGreenMid,
                                cardBg: cardBg,
                                borderColor: borderColor,
                                textColor: textColor,
                                mutedColor: mutedColor,
                              ),
                            ],
                          ),

                          const SizedBox(height: 20),

                          // ── Status das OSs
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Status das OSs',
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: textColor,
                                  )),
                              GestureDetector(
                                onTap: widget.onViewKanban,
                                child: Text(
                                  'Ver Kanban →',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? AGColors.brandGreen : AGColors.brandGreenDark,
                                  ),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 10),

                          Container(
                            decoration: BoxDecoration(
                              color: cardBg,
                              borderRadius: BorderRadius.circular(AGRadius.xl - 4),
                              border: Border.all(color: borderColor),
                            ),
                            child: Column(
                              children: [
                                _StatusRow('Aguardando revisão admin',
                                    _count(StatusOS.aguardandoOrcamento),
                                    AGColors.muted, isDark, borderColor),
                                _StatusRow('Aprovadas pelo cliente',
                                    _count(StatusOS.aprovado),
                                    AGColors.accentBlue, isDark, borderColor),
                                _StatusRow('Em produção',
                                    _count(StatusOS.emProducao),
                                    AGColors.accentOrange, isDark, borderColor),
                                _StatusRow('Pronta para retirada',
                                    _count(StatusOS.prontaParaRetirada),
                                    AGColors.accentPurple, isDark, borderColor),
                                _StatusRow('Concluídas hoje',
                                    _concluidasHoje,
                                    AGColors.brandGreen, isDark, null),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}

// ── KPI Card ──────────────────────────────────────────────────────
class _KpiCard extends StatelessWidget {
  final String label, value, delta;
  final Color deltaColor, cardBg, borderColor, textColor, mutedColor;

  const _KpiCard({
    required this.label,
    required this.value,
    required this.delta,
    required this.deltaColor,
    required this.cardBg,
    required this.borderColor,
    required this.textColor,
    required this.mutedColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(AGRadius.xl - 4),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(label,
                style: GoogleFonts.inter(
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                    color: mutedColor,
                    letterSpacing: 0.5)),
          ),
          const SizedBox(height: 4),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(value,
                style: GoogleFonts.inter(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: textColor,
                    letterSpacing: -0.5)),
          ),
          const SizedBox(height: 2),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(delta,
                style: GoogleFonts.inter(
                    fontSize: 11, color: deltaColor, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}

// ── Status row ────────────────────────────────────────────────────
class _StatusRow extends StatelessWidget {
  final String label;
  final int count;
  final Color dotColor;
  final bool isDark;
  final Color? borderColor;

  const _StatusRow(this.label, this.count, this.dotColor, this.isDark, this.borderColor);

  @override
  Widget build(BuildContext context) {
    final textColor = isDark ? AGColors.onDark : AGColors.ink;
    final mutedColor = isDark ? AGColors.onDarkMuted : AGColors.steel;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: borderColor != null
          ? BoxDecoration(border: Border(bottom: BorderSide(color: borderColor!)))
          : null,
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(label, style: GoogleFonts.inter(fontSize: 13, color: textColor)),
          ),
          Text('$count',
              style: GoogleFonts.inter(
                  fontSize: 13, fontWeight: FontWeight.w600, color: mutedColor)),
        ],
      ),
    );
  }
}
