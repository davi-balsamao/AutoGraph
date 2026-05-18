import { RagService } from '../services/rag.service';
import { ConversationContext, ConversationState, SessaoRecord } from './states';

export interface HandlerDeps {
  ragService: RagService;
  conversationHistory: string;
  clienteNome: string;
  clienteTelefone: string;
}

export interface HandlerResult {
  response: string;
  nextState: ConversationState;
  updatedContext: ConversationContext;
  /** Encadeia outro handler no mesmo turno (ex: CALCULAR → APRESENTAR) */
  chainNext?: ConversationState;
  escalarHumano?: boolean;
  gerarOs?: boolean;
}

export interface StateHandler {
  handle(
    message: string,
    sessao: SessaoRecord,
    deps: HandlerDeps
  ): Promise<HandlerResult>;
}
