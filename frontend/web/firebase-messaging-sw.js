// Importa os scripts do Firebase para o Service Worker (versão de compatibilidade)
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyAMAihqtz6yF_M974Erhx6x7yzZnffnXrs",
  authDomain: "autograph-83959.firebaseapp.com",
  projectId: "autograph-83959",
  storageBucket: "autograph-83959.firebasestorage.app",
  messagingSenderId: "858603345303",
  appId: "1:858603345303:web:e5c45f0262646f856ae0d2"
};

// Inicializa o Firebase no Service Worker usando o objeto global
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Lida com as notificações quando a aba do navegador estiver em segundo plano ou fechada
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Notificação recebida em background: ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/Icon-192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
