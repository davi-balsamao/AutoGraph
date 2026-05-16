import { boasVindasHandler } from '../../fsm/handlers/boas-vindas.handler';
import { ConversationState } from '../../fsm/states';
import { makeDeps, makeSessao } from './helpers';

describe('BoasVindasHandler', () => {
  it('saudação simples termina em "Como posso te ajudar?"', async () => {
    const sessao = makeSessao({ estadoAtual: 'BOAS_VINDAS' });
    const r = await boasVindasHandler.handle('Oi', sessao, makeDeps());
    expect(r.nextState).toBe(ConversationState.IDENTIFICAR_NECESSIDADE);
    expect(r.response).toMatch(/Bom dia|Boa tarde|Boa noite/);
    expect(r.response).toMatch(/Como posso te ajudar\?/);
  });

  it('responde "Tudo bem e voce?" quando cliente pergunta', async () => {
    const sessao = makeSessao({ estadoAtual: 'BOAS_VINDAS' });
    const r = await boasVindasHandler.handle('Oi, tudo bem?', sessao, makeDeps());
    expect(r.response).toMatch(/Tudo bem e voce/);
  });

  it('NÃO lista catálogo de produtos proativamente (Regra do .md)', async () => {
    const sessao = makeSessao({ estadoAtual: 'BOAS_VINDAS' });
    const r = await boasVindasHandler.handle('Oi', sessao, makeDeps());
    expect(r.response).not.toMatch(/Panfletos|Cart[ãa]o|Banner|Apostila|Blocos/);
  });
});
