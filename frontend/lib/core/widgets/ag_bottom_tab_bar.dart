// AGBottomTabBar — Bottom tab bar do app cliente
//
// Tokens usados:
//   AGColors.brandTealDeep (active light), AGColors.brandGreen (active dark)
//   AGColors.stone (inactive)
//   AGColors.hairline / hairlineDark (borda superior)
//   AGColors.brandGreen (badge bg), AGColors.onPrimary (badge text)
//
// Referência: ClaudeDesign/components/app-ui.jsx → BottomTabBar
//
// Uso:
//   AGBottomTabBar(
//     current: AGTab.home,
//     badges: {AGTab.chat: 2},
//     onTap: (tab) => setState(() => _tab = tab),
//   )

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/ag_tokens.dart';

enum AGTab { home, catalog, chat, orders, account }

class AGBottomTabBar extends StatelessWidget {
  final AGTab current;
  final Map<AGTab, int> badges;
  final ValueChanged<AGTab> onTap;

  const AGBottomTabBar({
    super.key,
    required this.current,
    required this.onTap,
    this.badges = const {},
  });

  static const _tabs = [
    (AGTab.home,    'Início',      _TabIcon.home),
    (AGTab.catalog, 'Catálogo',   _TabIcon.shop),
    (AGTab.orders,  'Pedidos',     _TabIcon.orders),
    (AGTab.account, 'Conta',       _TabIcon.account),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final barBg = isDark
        ? const Color(0xEB001017) // rgba(0,16,23,0.92)
        : const Color(0xEBFFFFFF); // rgba(255,255,255,0.92)
    final borderColor = isDark ? AGColors.hairlineDark : AGColors.hairline;

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          decoration: BoxDecoration(
            color: barBg,
            border: Border(top: BorderSide(color: borderColor)),
          ),
          padding: EdgeInsets.only(
            left: 8,
            right: 8,
            top: 8,
            bottom: MediaQuery.of(context).padding.bottom + 8,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: _tabs.map((t) {
              final (tab, label, iconType) = t;
              final isActive = tab == current;
              final activeColor = isDark ? AGColors.brandGreen : AGColors.brandTealDeep;
              final color = isActive ? activeColor : AGColors.stone;
              final badge = badges[tab];

              return Expanded(
                child: GestureDetector(
                  onTap: () => onTap(tab),
                  behavior: HitTestBehavior.opaque,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(height: 6),
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          _TabIconWidget(type: iconType, active: isActive, color: color),
                          if (badge != null && badge > 0)
                            Positioned(
                              top: -4,
                              right: -8,
                              child: Container(
                                constraints: const BoxConstraints(minWidth: 16),
                                height: 16,
                                padding: const EdgeInsets.symmetric(horizontal: 4),
                                decoration: BoxDecoration(
                                  color: AGColors.brandGreen,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: barBg, width: 2),
                                ),
                                child: Center(
                                  child: Text(
                                    '$badge',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color: AGColors.onPrimary,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        label,
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                          color: color,
                        ),
                      ),
                      const SizedBox(height: 2),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }
}

// ─── Tipos de ícone ──────────────────────────────────────────────
enum _TabIcon { home, shop, chat, orders, account }

class _TabIconWidget extends StatelessWidget {
  final _TabIcon type;
  final bool active;
  final Color color;

  const _TabIconWidget({required this.type, required this.active, required this.color});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 22,
      height: 22,
      child: CustomPaint(painter: _TabIconPainter(type: type, active: active, color: color)),
    );
  }
}

class _TabIconPainter extends CustomPainter {
  final _TabIcon type;
  final bool active;
  final Color color;

  const _TabIconPainter({required this.type, required this.active, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final sw = active ? 2.4 : 1.8;
    final stroke = Paint()
      ..color = color
      ..strokeWidth = sw
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;
    final fill = Paint()..color = color..style = PaintingStyle.fill;
    final s = size.width / 24; // scale factor

    switch (type) {
      case _TabIcon.home:
        // Casa
        final path = Path()
          ..moveTo(3 * s, 11 * s)
          ..lineTo(12 * s, 4 * s)
          ..lineTo(21 * s, 11 * s)
          ..lineTo(21 * s, 21 * s)
          ..arcToPoint(Offset(20 * s, 22 * s), radius: const Radius.circular(1))
          ..lineTo(15 * s, 22 * s)
          ..lineTo(15 * s, 15 * s)
          ..lineTo(9 * s, 15 * s)
          ..lineTo(9 * s, 22 * s)
          ..lineTo(4 * s, 22 * s)
          ..arcToPoint(Offset(3 * s, 21 * s), radius: const Radius.circular(1))
          ..close();
        if (active) canvas.drawPath(path, fill);
        canvas.drawPath(path, stroke..style = active ? PaintingStyle.fill : PaintingStyle.stroke);
        if (!active) canvas.drawPath(path, stroke);

      case _TabIcon.shop:
        // Sacola
        final bag = Path()
          ..moveTo(3 * s, 7 * s)
          ..lineTo(21 * s, 7 * s)
          ..lineTo(19.5 * s, 18 * s)
          ..arcToPoint(Offset(17.5 * s, 19.7 * s), radius: const Radius.circular(2))
          ..lineTo(6.5 * s, 19.7 * s)
          ..arcToPoint(Offset(4.5 * s, 18 * s), radius: const Radius.circular(2))
          ..close();
        if (active) canvas.drawPath(bag, fill);
        canvas.drawPath(bag, stroke..style = active ? PaintingStyle.fill : PaintingStyle.stroke);
        if (!active) canvas.drawPath(bag, stroke);
        // Handle
        final handle = Path()
          ..moveTo(8 * s, 7 * s)
          ..lineTo(8 * s, 5 * s)
          ..arcToPoint(Offset(16 * s, 5 * s), radius: const Radius.circular(4))
          ..lineTo(16 * s, 7 * s);
        canvas.drawPath(handle, stroke..style = PaintingStyle.stroke);

      case _TabIcon.chat:
        // Balão de chat
        final bubble = Path()
          ..moveTo(21 * s, 12 * s)
          ..arcToPoint(Offset(12 * s, 20 * s), radius: Radius.circular(9 * s), clockwise: false)
          ..arcToPoint(Offset(8.1 * s, 19.2 * s), radius: Radius.circular(2 * s))
          ..lineTo(3 * s, 21 * s)
          ..lineTo(4.8 * s, 16.3 * s)
          ..arcToPoint(Offset(3 * s, 12 * s), radius: Radius.circular(2 * s))
          ..arcToPoint(Offset(12 * s, 4 * s), radius: Radius.circular(9 * s))
          ..arcToPoint(Offset(21 * s, 12 * s), radius: Radius.circular(9 * s))
          ..close();
        if (active) canvas.drawPath(bubble, fill);
        canvas.drawPath(bubble, stroke..style = active ? PaintingStyle.fill : PaintingStyle.stroke);
        if (!active) canvas.drawPath(bubble, stroke);

      case _TabIcon.orders:
        // Prancheta
        final rect = RRect.fromRectAndRadius(
          Rect.fromLTWH(4 * s, 3 * s, 16 * s, 18 * s),
          Radius.circular(2 * s),
        );
        if (active) canvas.drawRRect(rect, fill);
        canvas.drawRRect(rect, stroke..style = active ? PaintingStyle.fill : PaintingStyle.stroke);
        if (!active) canvas.drawRRect(rect, stroke);
        // Linhas
        final lineColor = active ? (color == AGColors.brandGreen ? AGColors.brandTealDeep : Colors.white) : color;
        final linePaint = Paint()..color = lineColor..strokeWidth = sw..strokeCap = StrokeCap.round;
        canvas.drawLine(Offset(8 * s, 8 * s), Offset(16 * s, 8 * s), linePaint);
        canvas.drawLine(Offset(8 * s, 12 * s), Offset(16 * s, 12 * s), linePaint);
        canvas.drawLine(Offset(8 * s, 16 * s), Offset(13 * s, 16 * s), linePaint);

      case _TabIcon.account:
        // Pessoa
        final head = Paint()..color = color;
        if (active) {
          canvas.drawCircle(Offset(12 * s, 8 * s), 4 * s, head);
        } else {
          canvas.drawCircle(Offset(12 * s, 8 * s), 4 * s, stroke..style = PaintingStyle.stroke);
        }
        final body = Path()
          ..moveTo(4 * s, 21 * s)
          ..arcToPoint(
            Offset(20 * s, 21 * s),
            radius: Radius.circular(8 * s),
            clockwise: false,
          );
        canvas.drawPath(body, stroke..style = PaintingStyle.stroke);
    }
  }

  @override
  bool shouldRepaint(_TabIconPainter old) =>
      old.type != type || old.active != active || old.color != color;
}
