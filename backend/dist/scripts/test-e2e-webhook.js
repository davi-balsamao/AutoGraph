"use strict";
/**
 * test-e2e-webhook.ts — Teste End-to-End do fluxo completo
 *
 * Simula o envio de mensagens do WhatsApp para o webhook local e
 * exibe os resultados. Testa o fluxo: Webhook → RAG → Guardrails → Resposta.
 *
 * Executar: npm run test:e2e
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const crypto_1 = __importDefault(require("crypto"));
dotenv_1.default.config();
const BASE_URL = `http://127.0.0.1:${process.env.PORT || 3000}`;
function buildPayload(from, name, text) {
    return {
        object: 'whatsapp_business_account',
        entry: [
            {
                id: '123',
                changes: [
                    {
                        value: {
                            messaging_product: 'whatsapp',
                            metadata: {
                                display_phone_number: '15551234567',
                                phone_number_id: '123456',
                            },
                            contacts: [
                                {
                                    profile: { name },
                                    wa_id: from,
                                },
                            ],
                            messages: [
                                {
                                    from,
                                    id: `wamid.test_${Date.now()}`,
                                    timestamp: String(Math.floor(Date.now() / 1000)),
                                    text: { body: text },
                                    type: 'text',
                                },
                            ],
                        },
                        field: 'messages',
                    },
                ],
            },
        ],
    };
}
const prisma_1 = require("../config/prisma");
async function sendMessage(from, name, text) {
    console.log(`\n📤 [${name}] → "${text}"`);
    const payload = buildPayload(from, name, text);
    const bodyString = JSON.stringify(payload);
    const appSecret = process.env.APP_SECRET || '';
    const signature = 'sha256=' + crypto_1.default.createHmac('sha256', appSecret).update(bodyString).digest('hex');
    try {
        const res = await fetch(`${BASE_URL}/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Hub-Signature-256': signature,
            },
            body: bodyString,
        });
        if (res.ok) {
            console.log('   ✅ Requisição enviada. Webhook (200 OK).');
            // Aguarda processamento da IA
            process.stdout.write('   ⏳ Aguardando IA pensar e responder...');
            await new Promise(resolve => setTimeout(resolve, 12000));
            console.log(' Concluído.');
            // Busca a resposta do BOT no banco de dados para mostrar no terminal
            const cliente = await prisma_1.prisma.usuario.findFirst({ where: { telefone: from } });
            if (cliente) {
                const lastMsg = await prisma_1.prisma.mensagens.findFirst({
                    where: { usuarioId: cliente.id, origem: 'BOT' },
                    orderBy: { criadoEm: 'desc' }
                });
                if (lastMsg) {
                    const msgPayload = lastMsg.payload;
                    const botText = msgPayload.text?.body || msgPayload.text || JSON.stringify(msgPayload);
                    console.log(`\n   🤖 [Assistente]: "${botText}"\n`);
                }
                else {
                    console.log(`\n   ⚠️ [Assistente]: (Nenhuma resposta foi salva no banco ainda)\n`);
                }
            }
        }
        else {
            console.log(`   ❌ Erro HTTP ${res.status}: Requisição rejeitada pelo Webhook.`);
        }
    }
    catch (err) {
        console.log(`   ⚠️ Erro de conexão com o servidor:`, err.message);
    }
}
async function main() {
    console.log('============================================');
    console.log('  TESTE E2E — Fluxo Completo do Webhook');
    console.log(`  Servidor: ${BASE_URL}`);
    console.log('============================================');
    // Teste 1: Mensagem de triagem simples
    await sendMessage('5531999990001', 'Davi Teste', 'Oi, quero fazer cartão de visita');
    // Teste 2: Pergunta fora do escopo
    await sendMessage('5531999990002', 'Maria Teste', 'Consegue me explicar o que é sangria?');
    // Teste 3: Produto que existe (Banner)
    await sendMessage('5531999990003', 'João Teste', 'Qual a diferença entre o Verniz localizado e o total?');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('\n============================================');
    console.log('  TESTE 4: Conversa Multi-Turno (Card 17)');
    console.log('============================================');
    const numeroMultiTurno = '5531999990004';
    const nomeMultiTurno = 'Ana Multi-turno';
    // Turno 1: Cliente inicia
    await sendMessage(numeroMultiTurno, nomeMultiTurno, 'Quero fazer 1000 panfletos');
    await new Promise(resolve => setTimeout(resolve, 8000)); // Aguarda processamento
    // Turno 2: Cliente responde uma pergunta da IA (ex: tamanho)
    await sendMessage(numeroMultiTurno, nomeMultiTurno, 'O tamanho vai ser 10x15cm, só frente.');
    await new Promise(resolve => setTimeout(resolve, 8000));
    // Turno 3: Cliente finaliza com a arte
    await sendMessage(numeroMultiTurno, nomeMultiTurno, 'Sim, eu já tenho a arte pronta no Canva.');
    console.log('\n============================================');
    console.log('  Testes concluídos! Verifique os logs do servidor.');
    console.log('============================================\n');
}
main().catch(console.error);
