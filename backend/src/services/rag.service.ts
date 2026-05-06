/**
 * RagService — Card 13: Implementação da RAG Chain
 *
 * Serviço que implementa o pipeline RAG completo:
 *   Query → Embeddings → Busca Vetorial → Montagem de Contexto → LLM → Guardrails → Resposta
 *
 * Diretrizes de segurança aplicadas:
 * - Temperature 0.0 (determinístico, sem criatividade em preços/prazos)
 * - Threshold de similaridade mínima (minScore: 0.75)
 * - No Math Policy (codificada no prompt)
 * - Prompt Injection Guard (pergunta isolada como variável)
 * - Context Transparency (retorna IDs dos documentos usados)
 * - Guardrails (Card 18): Validação anti-alucinação de preços e escopo
 */

import { prisma } from '../config/prisma';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
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

// --- Tipos ---

/** Documento recuperado da busca vetorial com score de similaridade. */
interface RetrievedDocument {
  id: string;
  conteudo: string;
  similaridade: number;
}

/** Resultado da query RAG com transparência de contexto. */
export interface RagQueryResult {
  answer: string;
  sourceDocuments: Array<{ id: string; similaridade: number }>;
  guardrailApplied?: boolean;
}

// --- Configurações ---

/** Número de documentos retornados pelo retriever (top-K). */
const TOP_K = 4;

/** Score mínimo de similaridade. Documentos abaixo disso são descartados. */
const MIN_SIMILARITY_SCORE = 0.75;

/** Resposta padrão quando não há contexto suficiente. */
const FALLBACK_RESPONSE = 'Não tenho essa informação no momento.';

// --- Classe RagService ---

export class RagService {
  private embeddings: GoogleGenerativeAIEmbeddings;
  private llm: ChatGoogleGenerativeAI;
  private chain: RunnableSequence;

  constructor() {
    // Embeddings — Google Gemini (text-embedding-004)
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: 'gemini-embedding-001',
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // LLM — Temperature 0.0 (determinístico, conforme regras de triagem)
    this.llm = new ChatGoogleGenerativeAI({
      temperature: 0.0,
      model: process.env.LLM_MODEL || 'gemini-2.0-flash',
      apiKey: process.env.GOOGLE_API_KEY,
    });

    // Monta a RunnableSequence: Retriever → Prompt → LLM → Parser
    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(RAG_SYSTEM_PROMPT),
      HumanMessagePromptTemplate.fromTemplate(RAG_HUMAN_PROMPT),
    ]);

    const outputParser = new StringOutputParser();

    this.chain = RunnableSequence.from([prompt, this.llm, outputParser]);
  }

  /**
   * Busca vetorial por similaridade na tabela DocumentosConhecimento.
   * Utiliza o operador <=> do pgvector (cosine distance).
   *
   * @param queryEmbedding Vetor de embedding da pergunta
   * @returns Top-K documentos acima do threshold de similaridade
   */
  private async retrieveDocuments(
    queryEmbedding: number[]
  ): Promise<RetrievedDocument[]> {
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // <=> calcula cosine distance; similaridade = 1 - distance
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
   * Executa o pipeline RAG completo.
   *
   * Pipeline:
   * 1. Gera embedding da pergunta
   * 2. Busca vetorial (top-K com threshold)
   * 3. Monta contexto a partir dos documentos recuperados
   * 4. Envia para o LLM com prompt anti-alucinação
   * 5. Retorna resposta + IDs dos documentos (auditoria)
   *
   * @param question Pergunta do cliente (tratada como variável isolada)
   * @returns Resposta gerada + documentos fonte
   */
  async query(question: string, conversationHistory?: string): Promise<RagQueryResult> {
    console.log('\n========== RAG QUERY ==========');
    console.log(`📝 Pergunta: "${question}"`);

    // 1. Gerar embedding da pergunta
    const queryEmbedding = await this.embeddings.embedQuery(question);
    console.log(`🔢 Embedding gerado (dimensões: ${queryEmbedding.length})`);

    // 2. Busca vetorial com threshold
    const documents = await this.retrieveDocuments(queryEmbedding);
    console.log(
      `📚 Documentos recuperados: ${documents.length} (threshold >= ${MIN_SIMILARITY_SCORE})`
    );

    // Log dos documentos recuperados
    documents.forEach((doc, i) => {
      console.log(
        `   📄 [${i + 1}] ID: ${doc.id} | Score: ${Number(doc.similaridade).toFixed(4)}`
      );
      console.log(
        `       Conteúdo: ${doc.conteudo.substring(0, 120).replace(/\n/g, ' ')}...`
      );
    });

    // 3. Se nenhum documento atingiu o threshold, retornar fallback
    if (documents.length === 0) {
      console.log('⚠️ Nenhum documento relevante encontrado. Usando fallback.');
      console.log(`💬 Resposta: "${FALLBACK_RESPONSE}"`);
      console.log('================================\n');
      return {
        answer: FALLBACK_RESPONSE,
        sourceDocuments: [],
      };
    }

    // 4. Montar contexto a partir dos documentos
    const context = documents
      .map(
        (doc, i) =>
          `--- Documento ${i + 1} (ID: ${doc.id}) ---\n${doc.conteudo}`
      )
      .join('\n\n');

    // 5. Executar a chain (Prompt → LLM → Parser)
    console.log('\n📤 Prompt final montado. Enviando para o LLM...');

    // Montar contexto com histórico de conversa (Card 17)
    let fullContext = context;
    if (conversationHistory) {
      fullContext = `${context}\n\n## HISTÓRICO DA CONVERSA ATUAL:\n${conversationHistory}`;
    }

    const rawAnswer = await this.chain.invoke({
      context: fullContext,
      question,
    });

    console.log(`💬 Resposta bruta do LLM: "${rawAnswer}"`);

    // 6. Guardrails (Card 18): Validar resposta contra documentos recuperados
    const langchainDocs = documents.map(
      (doc) => new Document({ pageContent: doc.conteudo, metadata: { id: doc.id } })
    );
    const validation = guardrailsService.validateResponse(rawAnswer, langchainDocs);

    let finalAnswer = rawAnswer;
    let guardrailApplied = false;

    if (!validation.isValid) {
      console.warn(`🛡️ [Guardrails] Resposta bloqueada: ${validation.reason}`);
      finalAnswer = validation.correctedResponse || FALLBACK_RESPONSE;
      guardrailApplied = true;
    } else {
      console.log('✅ [Guardrails] Resposta validada com sucesso.');
    }

    console.log(`💬 Resposta final: "${finalAnswer}"`);
    console.log('================================\n');

    // 7. Retornar resposta + source documents para auditoria
    return {
      answer: finalAnswer,
      sourceDocuments: documents.map((doc) => ({
        id: doc.id,
        similaridade: Number(doc.similaridade),
      })),
      guardrailApplied,
    };
  }
}

export const ragService = new RagService();
