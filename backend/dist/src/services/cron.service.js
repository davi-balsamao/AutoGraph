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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronService = exports.CronService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const sessao_repository_1 = require("../repositories/sessao.repository");
const state_service_1 = require("./state.service");
const whatsapp_service_1 = require("./whatsapp.service");
const states_1 = require("../fsm/states");
const LEMBRETE_MINUTOS = parseInt(process.env.FSM_LEMBRETE_MINUTOS || '30', 10);
const ENCERRAR_MINUTOS = parseInt(process.env.FSM_ENCERRAR_MINUTOS || '1440', 10);
const LEMBRETE_MSG = 'Oi! Vi que nossa conversa ficou parada. Ainda posso te ajudar com o orçamento?';
const ENCERRAR_MSG = 'Como não tive retorno, vou encerrar este atendimento por aqui. Quando quiser, é só mandar uma mensagem que começamos de novo!';
class CronService {
    start() {
        node_cron_1.default.schedule('*/5 * * * *', () => {
            this.processInatividade().catch((err) => console.error('❌ [Cron] Erro ao processar inatividade:', err));
        });
        console.log('⏰ [Cron] Scheduler de inatividade ativo (a cada 5 min)');
    }
    async processInatividade() {
        const sessoes = await sessao_repository_1.sessaoRepository.findAguardandoRetornoInativas(LEMBRETE_MINUTOS);
        for (const sessao of sessoes) {
            const minutos = (Date.now() - sessao.atualizadoEm.getTime()) / (60 * 1000);
            if (minutos >= ENCERRAR_MINUTOS) {
                await whatsapp_service_1.whatsappService.sendMessage(sessao.cliente.telefone, ENCERRAR_MSG);
                await state_service_1.stateService.transition(sessao.id, states_1.ConversationState.ENCERRAR, sessao.contexto || {});
                await sessao_repository_1.sessaoRepository.encerrar(sessao.id);
                console.log(`⏰ [Cron] Sessão ${sessao.id} encerrada por inatividade (24h)`);
                continue;
            }
            if (!sessao.lembreteEnviado && minutos >= LEMBRETE_MINUTOS) {
                await whatsapp_service_1.whatsappService.sendMessage(sessao.cliente.telefone, LEMBRETE_MSG);
                await sessao_repository_1.sessaoRepository.setLembreteEnviado(sessao.id, true);
                console.log(`⏰ [Cron] Lembrete enviado — sessão ${sessao.id}`);
            }
        }
        await this.marcarAguardarRetornoInativos();
    }
    /** Sessões ativas sem resposta recente entram em AGUARDAR_RETORNO */
    async marcarAguardarRetornoInativos() {
        const limite = new Date(Date.now() - LEMBRETE_MINUTOS * 60 * 1000);
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/prisma')));
        const candidatas = await prisma.sessaoAtendimento.findMany({
            where: {
                ativa: true,
                estadoAtual: {
                    notIn: [
                        states_1.ConversationState.ENCERRAR,
                        states_1.ConversationState.AGUARDAR_RETORNO,
                        states_1.ConversationState.ESCALAR_HUMANO,
                        states_1.ConversationState.BOAS_VINDAS,
                    ],
                },
                atualizadoEm: { lt: limite },
            },
        });
        for (const s of candidatas) {
            await state_service_1.stateService.transition(s.id, states_1.ConversationState.AGUARDAR_RETORNO, s.contexto || {}, { previousState: s.estadoAtual });
        }
    }
}
exports.CronService = CronService;
exports.cronService = new CronService();
