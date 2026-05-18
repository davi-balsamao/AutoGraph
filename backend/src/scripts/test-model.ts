import dotenv from 'dotenv';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

dotenv.config();

console.log('ENV LLM_MODEL:', process.env.LLM_MODEL);
console.log('ENV GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'Present' : 'Missing');

const history = `
Cliente: Oi! Quero fazer flyers para uma promoção.
Assistente: Bom dia, A AutoGraph agradece o seu contato! Como posso te ajudar?
Cliente: Flyers para uma promoção de verão da minha loja.
Assistente: Qual quantidade deseja?
Cliente: 500 unidades, tamanho A5, frente colorida, papel couchê 115g.
`.trim();

const prompt = `Você é um extrator de entidades de uma conversa de atendimento de gráfica.
Analise o HISTÓRICO abaixo e retorne JSON com a extração estruturada.

# Catálogo disponível
Panfletos, Cartão de Visita, Blocos, Banner ou Lona, Apostila

# Produto travado na sessão
Panfletos

# Perguntas do catálogo para o produto atual
  • "Qual a quantidade desejada?"
  • "Qual o tamanho (A4, A5, A6)?"
  • "Qual a cor (só frente, frente e verso)?"
  • "Qual o tipo de papel (couchê 115g, couchê 150g, couchê 250g)?"

# Histórico da conversa
${history}

# Regras
1. produtoIdentificado: nome EXATO do catálogo (preserve capitalização). Se não houver, null.
2. produtoDesconhecido: true se o cliente pediu impressão de algo que NÃO está no catálogo (camiseta, caneca, adesivo, plotagem, etc.).
3. intent: classifique o turno atual (última fala do cliente):
   - "NOVO_PEDIDO": cliente está iniciando um pedido novo dentro do fluxo normal
   - "TROCAR_PRODUTO": cliente mudou de ideia para outro produto do catálogo
   - "NOVO_ATENDIMENTO": cliente quer recomeçar do zero (cancelar tudo, esquecer)
   - "DUVIDA": pergunta sem decisão (dúvida técnica/comercial)
   - "NEGOCIACAO": questiona preço/prazo/condições
   - "APROVACAO": aceita orçamento/pedido
   - "RECUSA": rejeita orçamento/pedido
   - "OUTRO": qualquer outra coisa
4. specs: para CADA pergunta do catálogo listada acima, extraia a resposta do cliente literal do histórico — preserve números EXATOS (ex: "1000 unidades" NUNCA "10"). Se a resposta não estiver no histórico, null. Use a string da pergunta como chave EXATAMENTE como aparece acima.
5. resolveuReferencia: se o cliente usou referência ambígua ("a primeira", "essa", "a que você sugeriu") e foi possível identificar no histórico recente, preencha { texto, referenciaEncontrada }. Caso contrário null.

Responda APENAS com JSON válido. Sem markdown, sem comentários, sem prefixos.`;

async function main() {
  const modelName = process.env.LLM_MODEL || 'gemini-2.0-flash';
  console.log(`Initializing ChatGoogleGenerativeAI with model: ${modelName}`);
  
  const llm = new ChatGoogleGenerativeAI({
    temperature: 0,
    model: modelName,
    apiKey: process.env.GOOGLE_API_KEY,
  });

  console.log('Sending message to LLM...');
  const start = Date.now();
  try {
    const res = await llm.invoke(prompt);
    console.log(`Response received in ${Date.now() - start}ms:`);
    console.log(res.content);
  } catch (err: any) {
    console.error('Error invoking LLM:', err);
  }
}

main();
