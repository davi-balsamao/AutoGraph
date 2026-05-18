// Firebase Messaging Service Worker
// Necessário para que FirebaseMessaging.getToken() funcione no Flutter Web.
// Use a versão "compat" — única suportada em service workers nativos.
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// As mesmas credenciais que estão em lib/firebase_options.dart (web).
firebase.initializeApp({
  apiKey: 'AIzaSyBVFL1hrKpdrUmCTXvOAXeM8QLE4iWrQ_U',
  appId: '1:740185525778:web:0ae925873bb709cbe8d2cb',
  messagingSenderId: '740185525778',
  projectId: 'autograph-5',
  authDomain: 'autograph-5.firebaseapp.com',
  storageBucket: 'autograph-5.firebasestorage.app',
});

const messaging = firebase.messaging();

// Mensagens em background (aba fechada / app não focado).
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message:', payload);
  const title = payload.notification?.title || 'AutoGraph';
  const options = {
    body: payload.notification?.body || '',
    icon: '/icons/Icon-192.png',
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});
