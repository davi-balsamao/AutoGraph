import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:autograph/main.dart';

void main() {
  testWidgets('App renderiza sem erros', (WidgetTester tester) async {
    await tester.pumpWidget(const AutoGraphApp());
    expect(find.byType(MaterialApp), findsOneWidget);
    await tester.pumpAndSettle(const Duration(seconds: 5));
  });
}
