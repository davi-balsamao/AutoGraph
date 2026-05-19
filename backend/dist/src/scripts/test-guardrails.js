"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const documents_1 = require("@langchain/core/documents");
const guardrails_service_1 = require("../services/guardrails.service");
/**
 * Script de testes isolado para a camada de Guardrails (Card 18)
 * Executar com: npm run test:guardrails
 */
async function runTests() {
    console.log('--- Iniciando Testes de Guardrails ---');
    // Documentos mockados (simulando retorno do banco vetorial)
    const mockDocs = [
        new documents_1.Document({
            pageContent: 'O milheiro de cartão de visita couché 300g custa R$ 85,00. Promoção de panfletos: R$ 120,50 o milheiro.',
            metadata: { source: 'tabela_precos' }
        }),
        new documents_1.Document({
            pageContent: 'Banner lona fosca custa R$ 45,00 o metro quadrado. Prazo de entrega de 3 dias úteis.',
            metadata: { source: 'tabela_precos' }
        })
    ];
    console.log('\n✅ Cenário 1: Resposta com preços corretos');
    const response1 = 'O milheiro do cartão de visita fica em R$ 85,00 e o banner sai por R$ 45,00 o metro quadrado.';
    const result1 = guardrails_service_1.guardrailsService.validateResponse(response1, mockDocs);
    console.log('Resultado Cenário 1:', result1.isValid ? 'PASSOU' : 'FALHOU', result1.reason || '');
    console.log('\n❌ Cenário 2: Resposta com preço inventado (Alucinação)');
    const response2 = 'Olá! O milheiro de cartão de visita está em promoção por apenas R$ 50,00 hoje!';
    const result2 = guardrails_service_1.guardrailsService.validateResponse(response2, mockDocs);
    console.log('Resultado Cenário 2:', !result2.isValid ? 'PASSOU (Bloqueado)' : 'FALHOU (Não bloqueou)', result2.reason || '');
    console.log('\n❌ Cenário 3: Resposta com um preço correto e um incorreto');
    const response3 = 'O banner é R$ 45,00 e temos panfletos por R$ 100,00.';
    const result3 = guardrails_service_1.guardrailsService.validateResponse(response3, mockDocs);
    console.log('Resultado Cenário 3:', !result3.isValid ? 'PASSOU (Bloqueado)' : 'FALHOU (Não bloqueou)', result3.reason || '');
    console.log('\n✅ Cenário 4: Resposta sem preços (apenas texto de contexto)');
    const response4 = 'Trabalhamos com cartões de visita, banners e adesivos. O prazo varia conforme o produto.';
    const result4 = guardrails_service_1.guardrailsService.validateResponse(response4, mockDocs);
    console.log('Resultado Cenário 4:', result4.isValid ? 'PASSOU' : 'FALHOU', result4.reason || '');
    console.log('\n❌ Cenário 5: Resposta fora de escopo (negativada)');
    const response5 = 'A previsão do tempo para amanhã é de sol com pancadas de chuva.';
    const result5 = guardrails_service_1.guardrailsService.validateResponse(response5, mockDocs);
    console.log('Resultado Cenário 5:', !result5.isValid && result5.isOutOfScope ? 'PASSOU (Bloqueado)' : 'FALHOU', result5.reason || '');
    console.log('\n❌ Cenário 6: Resposta muito longa fora de escopo (sem palavras-chave)');
    const response6 = 'Para fazer um bom bolo de cenoura, você precisará de 3 cenouras, farinha, ovos, óleo e açúcar. Bata tudo no liquidificador e asse por 40 minutos em temperatura média.';
    const result6 = guardrails_service_1.guardrailsService.validateResponse(response6, mockDocs);
    console.log('Resultado Cenário 6:', !result6.isValid && result6.isOutOfScope ? 'PASSOU (Bloqueado)' : 'FALHOU', result6.reason || '');
    console.log('\n✅ Cenário 7: Saudação curta (sem palavras-chave, mas curta o suficiente para passar)');
    const response7 = 'Olá! Sou a assistente da gráfica. Em que posso te ajudar?';
    const result7 = guardrails_service_1.guardrailsService.validateResponse(response7, mockDocs);
    console.log('Resultado Cenário 7:', result7.isValid ? 'PASSOU' : 'FALHOU', result7.reason || '');
    console.log('\n✅ Cenário 8: Desconto de 5% dentro da margem (pedido R$ 280 na tabela mock)');
    const response8 = 'Consigo fechar em R$ 266,00 no Pix para você agora. O panfleto couché 115g fica nesse valor com a parceria.';
    const mockDocsPanfleto = [
        new documents_1.Document({
            pageContent: 'Panfleto Couché 115g 14x20cm 4x4 — 1000 un: R$ 280,00.',
            metadata: { source: 'tabela_precos_grafica.md' },
        }),
    ];
    const result8 = guardrails_service_1.guardrailsService.validateResponse(response8, mockDocsPanfleto);
    console.log('Resultado Cenário 8:', result8.isValid ? 'PASSOU' : 'FALHOU', result8.reason || '');
    console.log('\n❌ Cenário 9: Desconto acima da margem permitida');
    const response9 = 'Fechado em R$ 200,00 no Pix para os panfletos.';
    const result9 = guardrails_service_1.guardrailsService.validateResponse(response9, mockDocsPanfleto);
    console.log('Resultado Cenário 9:', !result9.isValid ? 'PASSOU (Bloqueado)' : 'FALHOU', result9.reason || '');
    console.log('\n--- Testes Finalizados ---');
}
runTests().catch(console.error);
