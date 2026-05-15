import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:autograph/features/admin_chat/presentation/admin_chat_conversation_screen.dart';
import 'package:autograph/core/theme/app_theme.dart';

void main() {
  testWidgets('AdminChatConversationScreen renders correctly', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.darkTheme,
        home: const AdminChatConversationScreen(
          clientId: 'client1',
          clientName: 'Test Client',
        ),
      ),
    );

    expect(find.text('Test Client'), findsOneWidget);
    expect(find.text('WhatsApp Connection Active'), findsOneWidget);
    expect(find.byType(TextField), findsOneWidget);
    expect(find.byIcon(Icons.send), findsOneWidget);
  });
}
