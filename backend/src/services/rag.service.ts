import { prisma } from '../config/prisma';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChatGroq } from '@langchain/groq';
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
}

export interface RagQueryResult {
  answer: string;
  sourceDocuments: Array<{ id: string; similaridade: number }>;
  guardrailApplied?: boolean;
}

const TOP_K = 4;
const MIN_SIMILARITY_SCORE = 0.75;
const FALLBACK_RESPONSE = 'Não tenho essa informação no momento.';

export class RagService {
  private embeddings: GoogleGenerativeAIEmbeddings;
  private llm: ChatGroq;
  private chain: RunnableSequence;

  constructor() {
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: 'gemini-embedding-001',
      apiKey: process.env.GOOGLE_API_KEY,
    });

    this.llm = new ChatGroq({
      temperature: 0,
      model: "llama-3.1-8b-instant",
      apiKey: process.env.GROQ_API_KEY as string, 
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

    return results.filter((doc) => Number(doc.similaridade) >= MIN_SIMILARITY_SCORE);
  }

  async query(question: string, conversationHistory?: string): Promise<RagQueryResult> {
    console.log('\n========== RAG QUERY ==========');
    console.log(`📝 Pergunta: "${question}"`);

    try {
      const queryEmbedding = await this.embeddings.embedQuery(question);
      const documents = await this.retrieveDocuments(queryEmbedding);

      if (documents.length === 0) {
        return { answer: FALLBACK_RESPONSE, sourceDocuments: [] };
      }

      const context = documents
        .map((doc, i) => `--- Documento ${i + 1} (ID: ${doc.id}) ---\n${doc.conteudo}`)
        .join('\n\n');

      let fullContext = context;
      if (conversationHistory) {
        fullContext = `${context}\n\n## HISTÓRICO DA CONVERSA ATUAL:\n${conversationHistory}`;
      }

      const rawAnswer = await this.chain.invoke({
        context: fullContext,
        question,
      });

      const langchainDocs = documents.map(
        (doc) => new Document({ pageContent: doc.conteudo, metadata: { id: doc.id } })
      );
      
      const validation = guardrailsService.validateResponse(rawAnswer, langchainDocs);

      let finalAnswer = rawAnswer;
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

      // Invoca o LLM direto sem o RAG, se for penas um resumo de texto
      const response = await this.llm.invoke([{ role: 'user', content: prompt }]);
      return response.content.toString().trim();
    } catch (error) {
      console.error('❌ Erro ao gerar mensagem sugerida:', error);
      // Fallback de segurança se a IA falhar
      return `Olá ${nomeCliente}, recebemos as especificações do seu pedido de ${especificacoes.produto}. O valor fica R$ ____.`;
    }
  }
}

export const ragService = new RagService();