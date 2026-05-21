// AdminShell — Shell principal do painel admin mobile
//
// Gerencia as 5 abas com IndexedStack + AdminBottomTabBar.
// Mantém estado de cada tela ao trocar de aba.
//
// Abas: Geral / OSs / Chat / Pedidos / Mais

import 'package:flutter/material.dart';
import 'shared/admin_bottom_tab_bar.dart';
import 'dashboard/admin_dashboard_screen.dart';
import 'kanban/kanban_screen.dart';
import 'chat/admin_chat_list_screen.dart';
import 'orders/admin_orders_screen.dart';
import 'more/admin_more_screen.dart';

class AdminShell extends StatefulWidget {
  const AdminShell({super.key});

  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  AdminTab _currentTab = AdminTab.geral;

  // Badges que virão de streams em produção (chat escalados, aprovações pendentes)
  final Map<AdminTab, int> _badges = {AdminTab.chat: 3};

  int get _index => switch (_currentTab) {
    AdminTab.geral   => 0,
    AdminTab.oss     => 1,
    AdminTab.chat    => 2,
    AdminTab.pedidos => 3,
    AdminTab.mais    => 4,
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          IndexedStack(
            index: _index,
            children: [
              AdminDashboardScreen(
                onViewKanban: () => setState(() => _currentTab = AdminTab.oss),
              ),
              const KanbanScreen(),
              const AdminChatListScreen(),
              const AdminOrdersScreen(),
              const AdminMoreScreen(),
            ],
          ),

          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: AdminBottomTabBar(
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
