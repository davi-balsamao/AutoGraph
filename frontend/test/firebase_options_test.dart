import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/foundation.dart';
import 'package:autograph/firebase_options.dart';

void main() {
  group('Firebase Configuration Tests', () {
    test('Android configuration options should match the registered project credentials', () {
      const androidOptions = DefaultFirebaseOptions.android;
      
      expect(androidOptions.projectId, equals('autograph-5'));
      expect(androidOptions.apiKey, isNotEmpty);
      expect(androidOptions.appId, contains('android'));
    });

    test('iOS configuration options should match the registered project credentials', () {
      const iosOptions = DefaultFirebaseOptions.ios;
      
      expect(iosOptions.projectId, equals('autograph-5'));
      expect(iosOptions.apiKey, isNotEmpty);
      expect(iosOptions.appId, contains('ios'));
    });

    test('Web configuration options should match the registered project credentials', () {
      const webOptions = DefaultFirebaseOptions.web;
      
      expect(webOptions.projectId, equals('autograph-5'));
      expect(webOptions.apiKey, isNotEmpty);
      expect(webOptions.appId, contains('web'));
    });
  });
}
