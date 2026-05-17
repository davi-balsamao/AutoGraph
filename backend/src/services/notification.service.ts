import * as admin from 'firebase-admin';
import { prisma } from '../config/prisma';

class NotificationService {
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      
      if (serviceAccountPath) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
        });
        this.isInitialized = true;
        console.log('🔥 [Firebase Admin] Inicializado com sucesso via arquivo de credenciais!');
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
        this.isInitialized = true;
        console.log('🔥 [Firebase Admin] Inicializado com sucesso via Application Default Credentials!');
      } else {
        console.warn('⚠️ [Firebase Admin] Nenhuma credencial do Firebase configurada no .env (FIREBASE_SERVICE_ACCOUNT_JSON ou GOOGLE_APPLICATION_CREDENTIALS). O sistema rodará em MODO SIMULADO (logs no console).');
      }
    } catch (error) {
      console.error('❌ [Firebase Admin] Erro ao inicializar SDK do Firebase:', error);
      console.warn('⚠️ [Firebase Admin] Rodando em MODO SIMULADO.');
    }
  }

  /**
   * Envia notificação para um usuário específico pelo ID.
   */
  async sendToUser(userId: string, title: string, body: string, data?: Record<string, string>): Promise<boolean> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { id: true, nome: true, fcmToken: true }
      });

      if (!usuario) {
        console.warn(`⚠️ [Notification] Usuário ${userId} não encontrado.`);
        return false;
      }

      if (!usuario.fcmToken) {
        console.log(`[Notification MOCK] Usuário ${usuario.nome} (${userId}) não possui fcmToken. Título: "${title}" | Corpo: "${body}"`);
        return false;
      }

      return await this.sendToToken(usuario.fcmToken, title, body, data, usuario.nome);
    } catch (error) {
      console.error(`❌ Erro ao enviar notificação para usuário ${userId}:`, error);
      return false;
    }
  }

  /**
   * Envia notificação para todos os administradores (GERENTES).
   */
  async sendToAdmins(title: string, body: string, data?: Record<string, string>): Promise<number> {
    try {
      const admins = await prisma.usuario.findMany({
        where: { role: 'GERENTE' },
        select: { id: true, nome: true, fcmToken: true }
      });

      let sentCount = 0;
      for (const adminUser of admins) {
        if (adminUser.fcmToken) {
          const success = await this.sendToToken(adminUser.fcmToken, title, body, data, `Admin ${adminUser.nome}`);
          if (success) sentCount++;
        } else {
          console.log(`[Notification MOCK] Admin ${adminUser.nome} não possui fcmToken. Título: "${title}" | Corpo: "${body}"`);
        }
      }
      return sentCount;
    } catch (error) {
      console.error('❌ Erro ao enviar notificação para administradores:', error);
      return 0;
    }
  }

  /**
   * Envia notificação para múltiplos usuários pelos IDs.
   */
  async sendToUsers(userIds: string[], title: string, body: string, data?: Record<string, string>): Promise<number> {
    try {
      const usuarios = await prisma.usuario.findMany({
        where: { id: { in: userIds } },
        select: { id: true, nome: true, fcmToken: true }
      });

      let sentCount = 0;
      for (const usuario of usuarios) {
        if (usuario.fcmToken) {
          const success = await this.sendToToken(usuario.fcmToken, title, body, data, usuario.nome);
          if (success) sentCount++;
        } else {
          console.log(`[Notification MOCK] Usuário ${usuario.nome} não possui fcmToken. Título: "${title}" | Corpo: "${body}"`);
        }
      }
      return sentCount;
    } catch (error) {
      console.error('❌ Erro ao enviar notificações em lote:', error);
      return 0;
    }
  }

  /**
   * Envia notificação diretamente para um token FCM.
   */
  async sendToToken(token: string, title: string, body: string, data?: Record<string, string>, recipientName?: string): Promise<boolean> {
    if (!this.isInitialized) {
      console.log(`📱 [Firebase MOCK - ${recipientName || 'Token'}] Envio simulado:\n  Título: ${title}\n  Corpo: ${body}\n  Dados: ${JSON.stringify(data || {})}`);
      return true;
    }

    try {
      const message: admin.messaging.Message = {
        token: token,
        notification: {
          title: title,
          body: body,
        },
        data: data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      console.log(`✉️ [Firebase FCM] Notificação enviada para ${recipientName || 'Token'}! ID: ${response}`);
      return true;
    } catch (error) {
      console.error(`❌ [Firebase FCM] Erro ao enviar mensagem para ${recipientName || 'Token'}:`, error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
