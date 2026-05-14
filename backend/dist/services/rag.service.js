"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ragService = exports.RagService = void 0;
const prisma_1 = require("../config/prisma");
const google_genai_1 = require("@langchain/google-genai");
const runnables_1 = require("@langchain/core/runnables");
const prompts_1 = require("@langchain/core/prompts");
const output_parsers_1 = require("@langchain/core/output_parsers");
const documents_1 = require("@langchain/core/documents");
const rag_template_1 = require("./rag-template");
const guardrails_service_1 = require("./guardrails.service");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const TOP_K = 4;
/** Score mínimo de similaridade. Documentos abaixo disso são descartados. */
const MIN_SIMILARITY_SCORE = 0.75;
/** Resposta padrão quando não há contexto suficiente. */
const FALLBACK_RESPONSE = 'Não tenho essa informação no momento.';
class RagService {
    embeddings;
    llm;
    chain;
    constructor() {
        this.embeddings = new google_genai_1.GoogleGenerativeAIEmbeddings({
            modelName: 'gemini-embedding-001',
            apiKey: process.env.GOOGLE_API_KEY,
        });
        // LLM — Temperature 0.0 (determinístico, conforme regras de triagem)
        this.llm = new google_genai_1.ChatGoogleGenerativeAI({
            temperature: 0.0,
            model: process.env.LLM_MODEL || 'gemini-2.0-flash',
            apiKey: process.env.GOOGLE_API_KEY,
        });
        const prompt = prompts_1.ChatPromptTemplate.fromMessages([
            prompts_1.SystemMessagePromptTemplate.fromTemplate(rag_template_1.RAG_SYSTEM_PROMPT),
            prompts_1.HumanMessagePromptTemplate.fromTemplate(rag_template_1.RAG_HUMAN_PROMPT),
        ]);
        const outputParser = new output_parsers_1.StringOutputParser();
        this.chain = runnables_1.RunnableSequence.from([prompt, this.llm, outputParser]);
    }
    async retrieveDocuments(queryEmbedding) {
        const vectorString = `[${queryEmbedding.join(',')}]`;
        const results = await prisma_1.prisma.$queryRaw `
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
        const filteredResults = results.filter((doc) => Number(doc.similaridade) >= MIN_SIMILARITY_SCORE);
        return filteredResults;
    }
    /**
     * Executa o pipeline RAG completo.
     */
    async query(question, conversationHistory) {
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
            console.log('\n📤 Prompt final montado. Enviando para o LLM...');
            // Montar contexto com histórico de conversa
            let fullContext = context;
            if (conversationHistory) {
                fullContext = `${context}\n\n## HISTÓRICO DA CONVERSA ATUAL:\n${conversationHistory}`;
            }
            const rawAnswer = await this.chain.invoke({
                context: fullContext,
                question,
            });
            const langchainDocs = documents.map((doc) => new documents_1.Document({ pageContent: doc.conteudo, metadata: { id: doc.id } }));
            const validation = guardrails_service_1.guardrailsService.validateResponse(rawAnswer, langchainDocs);
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
        }
        catch (error) {
            console.error('❌ Erro no RagService:', error);
            return { answer: FALLBACK_RESPONSE, sourceDocuments: [] };
        }
    }
    /**
     * Gera uma mensagem resumida para a OS (Card: Transbordo/Mensagem Sugerida)
     */
    async generateSuggestedMessage(nomeCliente, especificacoes, historico) {
        try {
            const produto = especificacoes.produto || 'produto';
            // Tenta achar a quantidade nas respostas, se houver
            const reqQuantidade = especificacoes.requisitos?.find((r) => r.pergunta.toLowerCase().includes('quantidade') || r.pergunta.toLowerCase().includes('quantos'));
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
        }
        catch (error) {
            console.error('❌ Erro ao gerar mensagem sugerida:', error);
            return `Olá ${nomeCliente}, recebemos as especificações do seu pedido de ${especificacoes.produto}. O valor fica R$ ____.`;
        }
    }
}
exports.RagService = RagService;
exports.ragService = new RagService();
