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
import { RAG_SYSTEM_PROMPT, RAG_HUMAN_PROMPT } from './rag-template';
import { guardrailsService } from './guardrails.service';
import dotenv from 'dotenv';

dotenv.config();

interface RetrievedDocument {
  id: string;
  conteudo: string;
  similaridade: number;
  source?: string;
  doc_type?: string;
}

export interface RagQueryResult {
  answer: string;
  sourceDocuments: Array<{ id: string; similaridade: number }>;
  guardrailApplied?: boolean;
}

const TOP_K = 4;

/** Score mínimo de similaridade — filtrado diretamente no SQL. */
const MIN_SIMILARITY_SCORE = 0.55;

/** Máximo de caracteres de histórico a incluir no contexto (evita overflow). */
const MAX_HISTORY_CHARS = 2000;

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

  constructor() {
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: 'gemini-embedding-001',
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // LLM — Temperature 0.3: naturalidade suficiente sem perder consistência
    this.llm = new ChatGoogleGenerativeAI({
      temperature: 0.3,
      model: process.env.LLM_MODEL || 'gemini-2.0-flash',
      apiKey: process.env.GOOGLE_API_KEY,
    });


    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(RAG_SYSTEM_PROMPT),
      HumanMessagePromptTemplate.fromTemplate(RAG_HUMAN_PROMPT),
    ]);

    const outputParser = new StringOutputParser();
    this.chain = RunnableSequence.from([prompt, this.llm, outputParser]);
  }

  private async retrieveDocuments(queryEmbedding: number[]): Promise<RetrievedDocument[]> {
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // Phase 2 fix (C3): threshold is enforced in SQL — no JS post-filter needed.
    const results: RetrievedDocument[] = await prisma.$queryRaw`
      SELECT
        id,
        conteudo,
        source,
        doc_type,
        1 - (vetor <=> ${vectorString}::vector) AS similaridade
      FROM "DocumentosConhecimento"
      WHERE vetor IS NOT NULL
        AND 1 - (vetor <=> ${vectorString}::vector) >= ${MIN_SIMILARITY_SCORE}
      ORDER BY vetor <=> ${vectorString}::vector
      LIMIT ${TOP_K}
    `;

    results.forEach((doc) =>
      console.log(
        `  📎 [${doc.doc_type ?? '?'}] ${doc.source ?? '?'} — score: ${Number(doc.similaridade).toFixed(3)}`,
      ),
    );

    return results;
  }

  /**
   * Executa o pipeline RAG completo.
   */
  async query(question: string, conversationHistory?: string): Promise<RagQueryResult> {
    console.log('\n========== RAG QUERY ==========');
    console.log(`📝 Pergunta: "${question}"`);

    try {
      const queryEmbedding = await this.embeddings.embedQuery(question);
      const documents = await this.retrieveDocuments(queryEmbedding);

      if (documents.length === 0) {
        // Se existe histórico, o LLM consegue responder usando o contexto da conversa
        // (ex: cliente diz "Sim" ou "500 unidades" sem precisar de docs da KB)
        if (conversationHistory) {
          console.log('⚠️  0 docs relevantes, usando histórico de conversa como contexto.');
          const contextualAnswer = await this.chain.invoke({
            context: `## HISTÓRICO DA CONVERSA ATÉ AGORA:\n${conversationHistory}`,
            question,
          });
          const validation = guardrailsService.validateResponse(contextualAnswer, []);
          const finalAnswer = validation.isValid
            ? stripDoubleNewlines(contextualAnswer)
            : (validation.correctedResponse || FALLBACK_RESPONSE);
          return { answer: finalAnswer, sourceDocuments: [], guardrailApplied: !validation.isValid };

        }
        return { answer: FALLBACK_RESPONSE, sourceDocuments: [] };
      }

      const context = documents
        .map((doc, i) => `--- Documento ${i + 1} (ID: ${doc.id}) ---\n${doc.conteudo}`)
        .join('\n\n');

      console.log('\n📤 Prompt final montado. Enviando para o LLM...');

      // Montar contexto com histórico de conversa
      let fullContext = context;
      if (conversationHistory) {
        // Phase 3 fix (W3): cap history to avoid context window overflow.
        const safeHistory = conversationHistory.slice(-MAX_HISTORY_CHARS);
        fullContext = `${context}\n\n## HISTÓRICO DA CONVERSA ATUAL:\n${safeHistory}`;
      }

      const rawAnswer = await this.chain.invoke({
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
Baseado no histórico, gere uma mensagem educada de NO MÁXIMO 2 linhas para a recepcionista enviar via WhatsApp.
A mensagem DEVE ter exatamente este formato:
"Olá ${nomeCliente}, vimos que você quer [Resumo do Pedido]. O valor fica R$ ____."
Deixe o espaço em branco "____" para a recepcionista preencher o preço.
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