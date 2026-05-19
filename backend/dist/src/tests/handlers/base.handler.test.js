"use strict";
/**
 * Testes das utilities expostas por base.handler.ts.
 *
 * Foco em cobrir cada Regra Geral mapeada para um helper:
 *  - Regra 5  → validateDiscountMargin / getMaxDiscountPercent
 *  - Regra 9  → enrichForLeigo
 *  - Regra 12 → detectCrossCuttingIntent (DUVIDA/ESCALAR/NOVO)
 *  - Regra 13 → isAudioMessage
 */
Object.defineProperty(exports, "__esModule", { value: true });
const base_handler_1 = require("../../fsm/handlers/base.handler");
describe('detectCrossCuttingIntent', () => {
    it('detecta ESCALAR para pedidos de atendente humano', () => {
        expect((0, base_handler_1.detectCrossCuttingIntent)('quero falar com um atendente')).toBe('ESCALAR');
        expect((0, base_handler_1.detectCrossCuttingIntent)('chama o gerente')).toBe('ESCALAR');
    });
    it('detecta DUVIDA quando cliente pergunta diferenças/explicações', () => {
        expect((0, base_handler_1.detectCrossCuttingIntent)('qual a diferença entre panfleto e flyer?')).toBe('DUVIDA');
        expect((0, base_handler_1.detectCrossCuttingIntent)('como funciona a impressão?')).toBe('DUVIDA');
    });
    it('detecta NOVO quando cliente quer reiniciar', () => {
        expect((0, base_handler_1.detectCrossCuttingIntent)('quero começar de novo')).toBe('NOVO');
        expect((0, base_handler_1.detectCrossCuttingIntent)('cancela tudo')).toBe('NOVO');
    });
    it('Fluxo 6: detecta PAUSA quando cliente pede para retornar depois', () => {
        expect((0, base_handler_1.detectCrossCuttingIntent)('Preciso parar por agora, continue meu pedido depois.')).toBe('PAUSA');
        expect((0, base_handler_1.detectCrossCuttingIntent)('Volto mais tarde')).toBe('PAUSA');
        expect((0, base_handler_1.detectCrossCuttingIntent)('Não posso agora, tenho que sair')).toBe('PAUSA');
        expect((0, base_handler_1.detectCrossCuttingIntent)('Pausa aqui, retorno depois')).toBe('PAUSA');
    });
    it('PAUSA tem precedência sobre DUVIDA (interrupção ≠ dúvida)', () => {
        // "preciso parar" não contém "preciso saber" mas é defensivo.
        expect((0, base_handler_1.detectCrossCuttingIntent)('Preciso parar')).toBe('PAUSA');
    });
    it('retorna null para mensagens neutras', () => {
        expect((0, base_handler_1.detectCrossCuttingIntent)('500 unidades em A4')).toBeNull();
        expect((0, base_handler_1.detectCrossCuttingIntent)('')).toBeNull();
    });
});
describe('enrichForLeigo', () => {
    it('explica termo técnico desconhecido pelo cliente', () => {
        const r = (0, base_handler_1.enrichForLeigo)('Aceitamos arquivos em DPI 300.');
        expect(r).toContain('DPI (resolução da imagem) 300');
    });
    it('NÃO enriquece se cliente já demonstrou familiaridade no histórico', () => {
        const r = (0, base_handler_1.enrichForLeigo)('Aceitamos arquivos em DPI 300.', 'Cliente: trabalho com DPI alto direto.');
        expect(r).toBe('Aceitamos arquivos em DPI 300.');
    });
    it('NÃO duplica explicação se já há parêntese após o termo', () => {
        const r = (0, base_handler_1.enrichForLeigo)('Use sangria (margem extra) para evitar corte.');
        expect((r.match(/sangria/g) || []).length).toBe(1);
        expect(r).toBe('Use sangria (margem extra) para evitar corte.');
    });
    it('só enriquece o primeiro termo (evita poluir frase)', () => {
        const r = (0, base_handler_1.enrichForLeigo)('Use DPI 300 e sangria 3mm.');
        expect(r).toMatch(/DPI \(/);
        expect(r).not.toMatch(/sangria \(/);
    });
    it('idempotente para texto sem termo técnico', () => {
        expect((0, base_handler_1.enrichForLeigo)('Oi! Tudo bem?')).toBe('Oi! Tudo bem?');
    });
    it('lida com input vazio', () => {
        expect((0, base_handler_1.enrichForLeigo)('')).toBe('');
    });
});
describe('validateDiscountMargin / getMaxDiscountPercent', () => {
    it('aprova desconto dentro da margem', () => {
        expect((0, base_handler_1.validateDiscountMargin)(5, 10)).toBe(true);
        expect((0, base_handler_1.validateDiscountMargin)(10, 10)).toBe(true);
    });
    it('reprova desconto acima da margem', () => {
        expect((0, base_handler_1.validateDiscountMargin)(15, 10)).toBe(false);
    });
    it('reprova entradas inválidas', () => {
        expect((0, base_handler_1.validateDiscountMargin)(-1, 10)).toBe(false);
        expect((0, base_handler_1.validateDiscountMargin)(NaN, 10)).toBe(false);
    });
    it('aplica as faixas de margem conforme diretrizes', () => {
        expect((0, base_handler_1.getMaxDiscountPercent)(0)).toBe(0);
        expect((0, base_handler_1.getMaxDiscountPercent)(150)).toBe(0); // < R$ 200
        expect((0, base_handler_1.getMaxDiscountPercent)(350)).toBe(5); // R$ 200-499
        expect((0, base_handler_1.getMaxDiscountPercent)(700)).toBe(10); // > R$ 500
    });
});
describe('isAudioMessage', () => {
    it('detecta type=audio direto no objeto', () => {
        expect((0, base_handler_1.isAudioMessage)({ type: 'audio' })).toBe(true);
        expect((0, base_handler_1.isAudioMessage)({ type: 'voice' })).toBe(true);
        expect((0, base_handler_1.isAudioMessage)({ type: 'ptt' })).toBe(true);
    });
    it('detecta type=audio em rawPayload', () => {
        expect((0, base_handler_1.isAudioMessage)({ rawPayload: { type: 'audio' } })).toBe(true);
    });
    it('não trata mensagens de texto como áudio', () => {
        expect((0, base_handler_1.isAudioMessage)({ type: 'text' })).toBe(false);
        expect((0, base_handler_1.isAudioMessage)({})).toBe(false);
    });
    it('lida com input inválido', () => {
        expect((0, base_handler_1.isAudioMessage)(null)).toBe(false);
        expect((0, base_handler_1.isAudioMessage)(undefined)).toBe(false);
        expect((0, base_handler_1.isAudioMessage)('string')).toBe(false);
    });
});
