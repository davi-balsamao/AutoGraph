/**
 * Testes das utilities expostas por base.handler.ts.
 *
 * Foco em cobrir cada Regra Geral mapeada para um helper:
 *  - Regra 5  → validateDiscountMargin / getMaxDiscountPercent
 *  - Regra 9  → enrichForLeigo
 *  - Regra 12 → detectCrossCuttingIntent (DUVIDA/ESCALAR/NOVO)
 *  - Regra 13 → isAudioMessage
 */

import {
  detectCrossCuttingIntent,
  enrichForLeigo,
  getMaxDiscountPercent,
  isAudioMessage,
  validateDiscountMargin,
} from '../../fsm/handlers/base.handler';

describe('detectCrossCuttingIntent', () => {
  it('detecta ESCALAR para pedidos de atendente humano', () => {
    expect(detectCrossCuttingIntent('quero falar com um atendente')).toBe('ESCALAR');
    expect(detectCrossCuttingIntent('chama o gerente')).toBe('ESCALAR');
  });

  it('detecta DUVIDA quando cliente pergunta diferenças/explicações', () => {
    expect(detectCrossCuttingIntent('qual a diferença entre panfleto e flyer?')).toBe('DUVIDA');
    expect(detectCrossCuttingIntent('como funciona a impressão?')).toBe('DUVIDA');
  });

  it('detecta NOVO quando cliente quer reiniciar', () => {
    expect(detectCrossCuttingIntent('quero começar de novo')).toBe('NOVO');
    expect(detectCrossCuttingIntent('cancela tudo')).toBe('NOVO');
  });

  it('retorna null para mensagens neutras', () => {
    expect(detectCrossCuttingIntent('500 unidades em A4')).toBeNull();
    expect(detectCrossCuttingIntent('')).toBeNull();
  });
});

describe('enrichForLeigo', () => {
  it('explica termo técnico desconhecido pelo cliente', () => {
    const r = enrichForLeigo('Aceitamos arquivos em DPI 300.');
    expect(r).toContain('DPI (resolução da imagem) 300');
  });

  it('NÃO enriquece se cliente já demonstrou familiaridade no histórico', () => {
    const r = enrichForLeigo(
      'Aceitamos arquivos em DPI 300.',
      'Cliente: trabalho com DPI alto direto.'
    );
    expect(r).toBe('Aceitamos arquivos em DPI 300.');
  });

  it('NÃO duplica explicação se já há parêntese após o termo', () => {
    const r = enrichForLeigo('Use sangria (margem extra) para evitar corte.');
    expect((r.match(/sangria/g) || []).length).toBe(1);
    expect(r).toBe('Use sangria (margem extra) para evitar corte.');
  });

  it('só enriquece o primeiro termo (evita poluir frase)', () => {
    const r = enrichForLeigo('Use DPI 300 e sangria 3mm.');
    expect(r).toMatch(/DPI \(/);
    expect(r).not.toMatch(/sangria \(/);
  });

  it('idempotente para texto sem termo técnico', () => {
    expect(enrichForLeigo('Oi! Tudo bem?')).toBe('Oi! Tudo bem?');
  });

  it('lida com input vazio', () => {
    expect(enrichForLeigo('')).toBe('');
  });
});

describe('validateDiscountMargin / getMaxDiscountPercent', () => {
  it('aprova desconto dentro da margem', () => {
    expect(validateDiscountMargin(5, 10)).toBe(true);
    expect(validateDiscountMargin(10, 10)).toBe(true);
  });

  it('reprova desconto acima da margem', () => {
    expect(validateDiscountMargin(15, 10)).toBe(false);
  });

  it('reprova entradas inválidas', () => {
    expect(validateDiscountMargin(-1, 10)).toBe(false);
    expect(validateDiscountMargin(NaN, 10)).toBe(false);
  });

  it('aplica as faixas de margem conforme diretrizes', () => {
    expect(getMaxDiscountPercent(0)).toBe(0);
    expect(getMaxDiscountPercent(150)).toBe(0);    // < R$ 200
    expect(getMaxDiscountPercent(350)).toBe(5);    // R$ 200-499
    expect(getMaxDiscountPercent(700)).toBe(10);   // > R$ 500
  });
});

describe('isAudioMessage', () => {
  it('detecta type=audio direto no objeto', () => {
    expect(isAudioMessage({ type: 'audio' })).toBe(true);
    expect(isAudioMessage({ type: 'voice' })).toBe(true);
    expect(isAudioMessage({ type: 'ptt' })).toBe(true);
  });

  it('detecta type=audio em rawPayload', () => {
    expect(isAudioMessage({ rawPayload: { type: 'audio' } })).toBe(true);
  });

  it('não trata mensagens de texto como áudio', () => {
    expect(isAudioMessage({ type: 'text' })).toBe(false);
    expect(isAudioMessage({})).toBe(false);
  });

  it('lida com input inválido', () => {
    expect(isAudioMessage(null)).toBe(false);
    expect(isAudioMessage(undefined)).toBe(false);
    expect(isAudioMessage('string')).toBe(false);
  });
});
