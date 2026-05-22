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
import 'orders/orders_screen.dart';
import 'account/account_screen.dart';

class TabSwitchNotification extends Notification {
  final AGTab tab;
  const TabSwitchNotification(this.tab);
}

class CustomerShell extends StatefulWidget {
  const CustomerShell({super.key});

  @override
  State<CustomerShell> createState() => _CustomerShellState();
}

class _CustomerShellState extends State<CustomerShell> {
  AGTab _currentTab = AGTab.home;

  // badge de notificação no chat removido
  final Map<AGTab, int> _badges = const {};

  int get _index => switch (_currentTab) {
    AGTab.home    => 0,
    AGTab.catalog => 1,
    AGTab.orders  => 2,
    AGTab.account => 3,
    _             => 0,
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: NotificationListener<TabSwitchNotification>(
        onNotification: (notification) {
          setState(() {
            _currentTab = notification.tab;
          });
          return true;
        },
        child: Stack(
          children: [
            IndexedStack(
              index: _index,
              children: const [
                HomeScreen(),
                CatalogScreen(),
                OrdersScreen(),
                AccountScreen(),
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
      ),
    );
  }
}
