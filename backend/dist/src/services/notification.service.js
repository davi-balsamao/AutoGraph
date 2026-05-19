"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const admin = __importStar(require("firebase-admin"));
const prisma_1 = require("../config/prisma");
class NotificationService {
    isInitialized = false;
    constructor() {
        this.initialize();
    }
    initialize() {
        try {
            const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
            if (serviceAccountPath) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccountPath),
                });
                this.isInitialized = true;
                console.log('🔥 [Firebase Admin] Inicializado com sucesso via arquivo de credenciais!');
            }
            else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                });
                this.isInitialized = true;
                console.log('🔥 [Firebase Admin] Inicializado com sucesso via Application Default Credentials!');
            }
            else {
                console.warn('⚠️ [Firebase Admin] Nenhuma credencial do Firebase configurada no .env (FIREBASE_SERVICE_ACCOUNT_JSON ou GOOGLE_APPLICATION_CREDENTIALS). O sistema rodará em MODO SIMULADO (logs no console).');
            }
        }
        catch (error) {
            console.error('❌ [Firebase Admin] Erro ao inicializar SDK do Firebase:', error);
            console.warn('⚠️ [Firebase Admin] Rodando em MODO SIMULADO.');
        }
    }
    /**
     * Envia notificação para um usuário específico pelo ID.
     */
    async sendToUser(userId, title, body, data) {
        try {
            const usuario = await prisma_1.prisma.usuario.findUnique({
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
        }
        catch (error) {
            console.error(`❌ Erro ao enviar notificação para usuário ${userId}:`, error);
            return false;
        }
    }
    /**
     * Envia notificação para todos os administradores (GERENTES).
     */
    async sendToAdmins(title, body, data) {
        try {
            const admins = await prisma_1.prisma.usuario.findMany({
                where: { role: 'GERENTE' },
                select: { id: true, nome: true, fcmToken: true }
            });
            let sentCount = 0;
            for (const adminUser of admins) {
                if (adminUser.fcmToken) {
                    const success = await this.sendToToken(adminUser.fcmToken, title, body, data, `Admin ${adminUser.nome}`);
                    if (success)
                        sentCount++;
                }
                else {
                    console.log(`[Notification MOCK] Admin ${adminUser.nome} não possui fcmToken. Título: "${title}" | Corpo: "${body}"`);
                }
            }
            return sentCount;
        }
        catch (error) {
            console.error('❌ Erro ao enviar notificação para administradores:', error);
            return 0;
        }
    }
    /**
     * Envia notificação para múltiplos usuários pelos IDs.
     */
    async sendToUsers(userIds, title, body, data) {
        try {
            const usuarios = await prisma_1.prisma.usuario.findMany({
                where: { id: { in: userIds } },
                select: { id: true, nome: true, fcmToken: true }
            });
            let sentCount = 0;
            for (const usuario of usuarios) {
                if (usuario.fcmToken) {
                    const success = await this.sendToToken(usuario.fcmToken, title, body, data, usuario.nome);
                    if (success)
                        sentCount++;
                }
                else {
                    console.log(`[Notification MOCK] Usuário ${usuario.nome} não possui fcmToken. Título: "${title}" | Corpo: "${body}"`);
                }
            }
            return sentCount;
        }
        catch (error) {
            console.error('❌ Erro ao enviar notificações em lote:', error);
            return 0;
        }
    }
    /**
     * Envia notificação diretamente para um token FCM.
     */
    async sendToToken(token, title, body, data, recipientName) {
        if (!this.isInitialized) {
            console.log(`📱 [Firebase MOCK - ${recipientName || 'Token'}] Envio simulado:\n  Título: ${title}\n  Corpo: ${body}\n  Dados: ${JSON.stringify(data || {})}`);
            return true;
        }
        try {
            const message = {
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
        }
        catch (error) {
            console.error(`❌ [Firebase FCM] Erro ao enviar mensagem para ${recipientName || 'Token'}:`, error);
            return false;
        }
    }
}
exports.notificationService = new NotificationService();
