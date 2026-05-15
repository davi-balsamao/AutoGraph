import { prisma } from '../config/prisma';
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from '@langchain/google-genai';
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
import dotenv from 'dotenv';

dotenv.config();

interface RetrievedDocument {
  id: string;
  conteudo: string;
  similaridade: number;
}

export interface RagQueryResult {
  answer: string;
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
  private llm: ChatGoogleGenerativeAI;
  private chain: RunnableSequence;
  private statelessChain: RunnableSequence;

  constructor() {
    const safeApiKey = process.env.GOOGLE_API_KEY || 'AIzaSyMockKeyForLocalTestingOnlyDoNotUse';
    
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: 'gemini-embedding-001',
      apiKey: safeApiKey,
    });

    // LLM — Temperature 0.3: naturalidade suficiente sem perder consistência
    this.llm = new ChatGoogleGenerativeAI({
      temperature: 0.3,
      model: process.env.LLM_MODEL || 'gemini-2.0-flash',
      apiKey: safeApiKey,
    });


    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(RAG_SYSTEM_PROMPT),
      HumanMessagePromptTemplate.fromTemplate(RAG_HUMAN_PROMPT),
    ]);

    const outputParser = new StringOutputParser();
    this.statelessChain = RunnableSequence.from([prompt, this.llm, outputParser]);

    this.chain = this.statelessChain;
  }

  private createStateChain(systemPrompt: string): RunnableSequence {
    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(systemPrompt),
      HumanMessagePromptTemplate.fromTemplate(RAG_HUMAN_PROMPT),
    ]);
    return RunnableSequence.from([prompt, this.llm, new StringOutputParser()]);
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
    return this.runQuery(question, conversationHistory, stateChain, { alwaysInvokeLlm: true });
  }

  /**
   * Executa o pipeline RAG completo (modo legado / testes).
   */
  async query(question: string, conversationHistory?: string): Promise<RagQueryResult> {
    return this.runQuery(question, conversationHistory, this.statelessChain);
  }

  private async runQuery(
    question: string,
    conversationHistory: string | undefined,
    chain: RunnableSequence,
    options?: { alwaysInvokeLlm?: boolean }
  ): Promise<RagQueryResult> {
    console.log('\n========== RAG QUERY ==========');
    console.log(`📝 Pergunta: "${question}"`);

    try {
      const queryEmbedding = await this.embeddings.embedQuery(question);
      const documents = await this.retrieveDocuments(queryEmbedding);

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

          const contextualAnswer = await chain.invoke({ context: kbContext, question });
          const validation = guardrailsService.validateResponse(contextualAnswer, []);
          const finalAnswer = validation.isValid
            ? stripDoubleNewlines(contextualAnswer)
            : validation.correctedResponse || FALLBACK_RESPONSE;

          console.log(`💬 Resposta final: "${finalAnswer}"`);
          return {
            answer: finalAnswer,
            sourceDocuments: [],
            guardrailApplied: !validation.isValid,
          };
        }

        console.log('⚠️  0 docs e sem histórico — fallback.');
        return { answer: FALLBACK_RESPONSE, sourceDocuments: [] };
      }

      const context = documents
        .map((doc, i) => `--- Documento ${i + 1} (ID: ${doc.id}) ---\n${doc.conteudo}`)
        .join('\n\n');

      console.log('\n📤 Prompt final montado. Enviando para o LLM...');

      // Montar contexto com histórico de conversa
      let fullContext = context;
      if (conversationHistory) {
        fullContext = `${context}\n\n## HISTÓRICO DA CONVERSA ATUAL:\n${conversationHistory}`;
      }

      const rawAnswer = await chain.invoke({
        context: fullContext,
        question,
      });

      const langchainDocs = documents.map(
        (doc) => new Document({ pageContent: doc.conteudo, metadata: { id: doc.id } })
      );
      
      const validation = guardrailsService.validateResponse(rawAnswer, langchainDocs);

      let finalAnswer = stripDoubleNewlines(rawAnswer);
      let guardrailApplied = false;

      if (!validation.isValid) {
        finalAnswer = validation.correctedResponse || FALLBACK_RESPONSE;
        guardrailApplied = true;
      }


      console.log(`💬 Resposta final: "${finalAnswer}"`);
      return {
        answer: finalAnswer,
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

      const response = await this.llm.invoke([{ role: 'user', content: prompt }]);
      return response.content.toString().trim();
    } catch (error) {
      console.error('❌ Erro ao gerar mensagem sugerida:', error);
      return `Olá ${nomeCliente}, recebemos as especificações do seu pedido de ${especificacoes.produto}. O valor fica R$ ____.`;
    }
  }
}

export const ragService = new RagService();