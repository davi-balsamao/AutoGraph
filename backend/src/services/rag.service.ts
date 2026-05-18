import dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../config/prisma';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { createChatLlm, nextEmbeddingApiKey } from './llm-factory';
import { RunnableSequence } from '@langchain/core/runnables';
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Document } from '@langchain/core/documents';
import { buildSystemPrompt, RAG_HUMAN_PROMPT, RAG_SYSTEM_PROMPT } from './rag-template';
import { ConversationContext, ConversationState } from '../fsm/states';
import { guardrailsService } from './guardrails.service';

interface RetrievedDocument {
  id: string;
  conteudo: string;
  similaridade: number;
}

export interface RagQueryResult {
  answer: string;
  /** Resposta bruta do LLM antes da correção dos guardrails. Populado apenas quando guardrailApplied=true. */
  rawAnswer?: string;
  sourceDocuments: Array<{ id: string; similaridade: number }>;
  guardrailApplied?: boolean;
}

const TOP_K = 4;

/** Score mínimo de similaridade. Documentos abaixo disso são descartados. */
const MIN_SIMILARITY_SCORE = 0.55;

/** Resposta padrão quando não há contexto suficiente. */
const FALLBACK_RESPONSE = 'Não tenho essa informação no momento.';

/**
 * Remove linhas em branco duplas do output do LLM.
 * LLMs usam \n\n por padrão (markdown); no WhatsApp isso parece artificial.
 */
function stripDoubleNewlines(text: string): string {
  return text.replace(/\n{2,}/g, '\n').trim();
}


export class RagService {
  private embeddings: GoogleGenerativeAIEmbeddings;

  constructor() {
    // Embeddings: usa a primeira chave do pool do Gemini. Rotação faz menos
    // sentido aqui porque embeddings têm cota separada e bem mais alta (15 RPM
    // no free tier do Gemini), e mudar a chave a cada request quebraria cache.
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: 'gemini-embedding-001',
      apiKey: nextEmbeddingApiKey(),
    });
  }

  /** Constrói uma chain stateless com uma chave rotacionada do pool. */
  private buildStatelessChain(): RunnableSequence {
    const llm = createChatLlm('rag');
    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(RAG_SYSTEM_PROMPT),
      HumanMessagePromptTemplate.fromTemplate(RAG_HUMAN_PROMPT),
    ]);
    return RunnableSequence.from([prompt, llm, new StringOutputParser()]);
  }

  private createStateChain(systemPrompt: string): RunnableSequence {
    const llm = createChatLlm('rag');
    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(systemPrompt),
      HumanMessagePromptTemplate.fromTemplate(RAG_HUMAN_PROMPT),
    ]);
    return RunnableSequence.from([prompt, llm, new StringOutputParser()]);
  }

  private async retrieveDocuments(queryEmbedding: number[]): Promise<RetrievedDocument[]> {
    const vectorString = `[${queryEmbedding.join(',')}]`;

    const results: RetrievedDocument[] = await prisma.$queryRaw`
      SELECT 
        id, 
        conteudo, 
        1 - (vetor <=> ${vectorString}::vector) as similaridade
      FROM "DocumentosConhecimento"
      WHERE vetor IS NOT NULL
      ORDER BY vetor <=> ${vectorString}::vector
      LIMIT ${TOP_K}
    `;

    // Filtrar por threshold de similaridade mínima
    const filteredResults = results.filter(
      (doc) => Number(doc.similaridade) >= MIN_SIMILARITY_SCORE
    );

    return filteredResults;
  }

  /**
   * RAG com prompt específico do estado da FSM.
   */
  async queryWithState(
    question: string,
    state: ConversationState,
    context: ConversationContext,
    conversationHistory?: string
  ): Promise<RagQueryResult> {
    const systemPrompt = buildSystemPrompt(state, context);
    const stateChain = this.createStateChain(systemPrompt);

    // Determina se é um estado comportamental/negociação para contornar bloqueios rígidos do guardrail por falta de docs
    const isBehavioralState = state === 'NEGOCIAR' || state === 'ENCERRAR';

    return this.runQuery(question, conversationHistory, stateChain, { 
      alwaysInvokeLlm: true,
      isBehavioralState,
      state
    });
  }

  /**
   * Executa o pipeline RAG completo (modo legado / testes).
   */
  async query(question: string, conversationHistory?: string): Promise<RagQueryResult> {
    return this.runQuery(question, conversationHistory, this.buildStatelessChain());
  }

  private async runQuery(
    question: string,
    conversationHistory: string | undefined,
    chain: RunnableSequence,
    options?: { alwaysInvokeLlm?: boolean; isBehavioralState?: boolean; state?: string }
  ): Promise<RagQueryResult> {
    console.log('\n========== RAG QUERY ==========');
    console.log(`📝 Pergunta: "${question}"`);

    const EMBED_TIMEOUT_MS = 10_000;
    const LLM_TIMEOUT_MS = 60_000;
    const t0 = Date.now();
    const elapsed = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

    const makeAbortTimeout = (ms: number, label: string) => {
      const controller = new AbortController();
      const handle = setTimeout(() => controller.abort(), ms);
      return {
        signal: controller.signal,
        clear: () => clearTimeout(handle),
        aborted: () => controller.signal.aborted,
        errorMsg: `RAG timeout após ${ms / 1000}s (${label})`,
      };
    };

    const embedTimeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`RAG timeout após ${EMBED_TIMEOUT_MS / 1000}s (embedding)`)), EMBED_TIMEOUT_MS)
    );

    try {
      let documents: RetrievedDocument[] = [];
      const trimmedQuestion = question?.trim() || "";

      if (trimmedQuestion !== "") {
        console.log(`⏱  [${elapsed()}] Iniciando embedding...`);
        const queryEmbedding = await Promise.race([
          this.embeddings.embedQuery(trimmedQuestion),
          embedTimeoutPromise,
        ]) as number[];
        console.log(`⏱  [${elapsed()}] Embedding OK. Buscando docs no pgvector...`);
        documents = await this.retrieveDocuments(queryEmbedding);
        console.log(`⏱  [${elapsed()}] ${documents.length} docs recuperados.`);
      } else {
        console.log('⚠️ Pergunta vazia detectada no RAG. Ignorando busca vetorial da KB.');
      }

      if (documents.length === 0) {
        const podeInvocarLlm =
          options?.alwaysInvokeLlm || Boolean(conversationHistory?.trim());

        if (podeInvocarLlm) {
          console.log(
            options?.alwaysInvokeLlm
              ? '⚠️  0 docs na KB — FSM usa prompt do estado + histórico.'
              : '⚠️  0 docs relevantes, usando histórico de conversa como contexto.'
          );

          let kbContext =
            '(Nenhum trecho adicional recuperado da base vetorial para esta pergunta.)';
          if (conversationHistory?.trim()) {
            kbContext += `\n\n## HISTÓRICO DA CONVERSA ATUAL:\n${conversationHistory}`;
          }

          console.log(`⏱  [${elapsed()}] Invocando LLM (0 docs)...`);
          const llmAbort0 = makeAbortTimeout(LLM_TIMEOUT_MS, 'llm-no-docs');
          let contextualAnswer: string;
          try {
            contextualAnswer = await chain.invoke(
              { context: kbContext, question: trimmedQuestion },
              { signal: llmAbort0.signal }
            ) as string;
            llmAbort0.clear();
          } catch (e) {
            if (llmAbort0.aborted()) throw new Error(llmAbort0.errorMsg);
            throw e;
          }
          console.log(`⏱  [${elapsed()}] LLM respondeu (0 docs).`);
          const validation = guardrailsService.validateResponse(contextualAnswer, [], options?.state);
          
          let guardrailApplied = !validation.isValid;
          let finalAnswer = stripDoubleNewlines(contextualAnswer);

          if (guardrailApplied) {
            if (options?.isBehavioralState) {
              guardrailApplied = false;
              console.log('ℹ️ Guardrail de grounding ignorado por se tratar de estado comportamental.');
            } else {
              finalAnswer = validation.correctedResponse || FALLBACK_RESPONSE;
            }
          }

          console.log(`💬 Resposta final: "${finalAnswer}"`);
          return {
            answer: finalAnswer,
            rawAnswer: guardrailApplied ? contextualAnswer : undefined,
            sourceDocuments: [],
            guardrailApplied,
          };
        }

        console.log('⚠️  0 docs e sem histórico — fallback.');
        return { answer: FALLBACK_RESPONSE, sourceDocuments: [] };
      }

      const context = documents
        .map((doc, i) => `--- Documento ${i + 1} (ID: ${doc.id}) ---\n${doc.conteudo}`)
        .join('\n\n');

      // Montar contexto com histórico de conversa
      let fullContext = context;
      if (conversationHistory) {
        fullContext = `${context}\n\n## HISTÓRICO DA CONVERSA ATUAL:\n${conversationHistory}`;
      }

      console.log(`\n📤 [${elapsed()}] Prompt montado (${fullContext.length} chars). Invocando LLM...`);

      const llmAbort = makeAbortTimeout(LLM_TIMEOUT_MS, 'llm');
      let rawAnswer: string;
      try {
        rawAnswer = await chain.invoke(
          { context: fullContext, question: trimmedQuestion },
          { signal: llmAbort.signal }
        ) as string;
        llmAbort.clear();
      } catch (e) {
        if (llmAbort.aborted()) throw new Error(llmAbort.errorMsg);
        throw e;
      }
      console.log(`⏱  [${elapsed()}] LLM respondeu.`);

      const langchainDocs = documents.map(
        (doc) => new Document({ pageContent: doc.conteudo, metadata: { id: doc.id } })
      );
      
      const validation = guardrailsService.validateResponse(rawAnswer, langchainDocs, options?.state);

      let guardrailApplied = !validation.isValid;
      let finalAnswer = stripDoubleNewlines(rawAnswer);

      if (guardrailApplied) {
        if (options?.isBehavioralState) {
          guardrailApplied = false;
          console.log('ℹ️ Guardrail de grounding ignorado no bloco com docs por se tratar de estado comportamental.');
        } else {
          finalAnswer = validation.correctedResponse || FALLBACK_RESPONSE;
        }
      }

      console.log(`💬 Resposta final: "${finalAnswer}"`);
      return {
        answer: finalAnswer,
        rawAnswer: guardrailApplied ? rawAnswer : undefined,
        sourceDocuments: documents.map((doc) => ({
          id: doc.id,
          similaridade: Number(doc.similaridade),
        })),
        guardrailApplied,
      };
    } catch (error) {
      console.error('❌ Erro no RagService:', error);
      return { answer: FALLBACK_RESPONSE, sourceDocuments: [] };
    }
  }

  /**
   * Gera uma mensagem resumida para a OS (Card: Transbordo/Mensagem Sugerida)
   */
  async generateSuggestedMessage(nomeCliente: string, especificacoes: any, historico: string): Promise<string> {
    try {
      const produto = especificacoes.produto || 'produto';
      
      // Tenta achar a quantidade nas respostas, se houver
      const reqQuantidade = especificacoes.requisitos?.find((r: any) => 
        r.pergunta.toLowerCase().includes('quantidade') || r.pergunta.toLowerCase().includes('quantos')
      );
      const quantidade = reqQuantidade ? reqQuantidade.resposta + ' ' : '';

      const prompt = `Você é um assistente de uma gráfica. O cliente ${nomeCliente} acabou de pedir um orçamento para ${quantidade}${produto}.
Baseado no histórico, gere uma mensagem educada de NO MÁXIMO 2 linhas para a recepcionista enviar via WhatsApp após aprovar o orçamento no sistema.
A mensagem DEVE seguir o tom: orçamento aprovado, valor total e formas de pagamento (Pix ou cartão em até 3x).
Se o valor exato não estiver claro no histórico, use "R$ ____" no lugar do valor.
NÃO adicione introduções como "Aqui está a mensagem". Retorne APENAS o texto final.

Histórico da conversa:
${historico}`;

      const llm = createChatLlm('rag');
      const response = await llm.invoke([{ role: 'user', content: prompt }]);
      return response.content.toString().trim();
    } catch (error) {
      console.error('❌ Erro ao gerar mensagem sugerida:', error);
      return `Olá ${nomeCliente}, recebemos as especificações do seu pedido de ${especificacoes.produto}. O valor fica R$ ____.`;
    }
  }
}

export const ragService = new RagService();