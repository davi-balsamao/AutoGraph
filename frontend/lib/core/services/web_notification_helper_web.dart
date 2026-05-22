import 'dart:js_interop';

@JS('eval')
external void _eval(String code);

void showWebNotification(String title, String body) {
  try {
    final String cleanTitle = title.replaceAll('"', '\\"').replaceAll('\n', ' ');
    final String cleanBody = body.replaceAll('"', '\\"').replaceAll('\n', ' ');
    
    _eval('''
      if (Notification.permission === "granted") {
        new Notification("$cleanTitle", {
          body: "$cleanBody",
          icon: "/icons/Icon-192.png"
        });
      }
    ''');
  } catch (e) {
    // ignore
  }
}
