// CustomerShell — Shell principal do app cliente
//
// Gerencia as 5 abas do BottomTabBar via IndexedStack.
// Mantém o estado de cada tela ao trocar de aba (sem recriar).
//
// Abas:
//   0: HomeScreen      → Início
//   1: CatalogScreen   → Catálogo
//   2: ChatPlaceholder → Atendimento (Sprint 1 completo)
//   3: OrdersPlaceholder → Pedidos (Sprint 2)
//   4: AccountPlaceholder → Conta (Sprint 2)

import 'package:flutter/material.dart';
import '../../core/widgets/ag_bottom_tab_bar.dart';
import 'home/home_screen.dart';
import 'catalog/catalog_screen.dart';

class CustomerShell extends StatefulWidget {
  const CustomerShell({super.key});

  @override
  State<CustomerShell> createState() => _CustomerShellState();
}

class _CustomerShellState extends State<CustomerShell> {
  AGTab _currentTab = AGTab.home;

  // badge de notificação no chat (virá de Socket.io em implementação futura)
  final Map<AGTab, int> _badges = {AGTab.chat: 2};

  int get _index => switch (_currentTab) {
    AGTab.home    => 0,
    AGTab.catalog => 1,
    AGTab.chat    => 2,
    AGTab.orders  => 3,
    AGTab.account => 4,
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          IndexedStack(
            index: _index,
            children: const [
              HomeScreen(),
              CatalogScreen(),
              _PlaceholderTab(icon: Icons.chat_bubble_outline_rounded, label: 'Atendimento'),
              _PlaceholderTab(icon: Icons.assignment_outlined, label: 'Pedidos'),
              _PlaceholderTab(icon: Icons.person_outline_rounded, label: 'Conta'),
            ],
          ),

          // Bottom tab bar sobreposto (absolute bottom)
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: AGBottomTabBar(
              current: _currentTab,
              badges: _badges,
              onTap: (tab) => setState(() => _currentTab = tab),
            ),
          ),
        ],
      ),
    );
  }
}

/// Placeholder para telas ainda não implementadas
class _PlaceholderTab extends StatelessWidget {
  final IconData icon;
  final String label;

  const _PlaceholderTab({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF001017)
          : const Color(0xFFFFFFFF),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 48, color: const Color(0xFF7C8C9A)),
            const SizedBox(height: 12),
            Text(
              label,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: isDark
                    ? const Color(0xFFA8B3BC)
                    : const Color(0xFF5C6C7A),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Em breve',
              style: TextStyle(
                fontSize: 13,
                color: isDark
                    ? const Color(0xFF7C8C9A)
                    : const Color(0xFF7C8C9A),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
