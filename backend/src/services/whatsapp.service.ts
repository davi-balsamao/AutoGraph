export class WhatsAppService {
  /**
   * Envia uma mensagem via WhatsApp Cloud API.
   * @param to Número de destino (ex: 5512997118413)
   * @param message Conteúdo da mensagem
   */
  async sendMessage(to: string, message: string): Promise<void> {
    if (process.env.USE_MOCK_WHATSAPP === 'true') {
      console.log(`[MOCK WPP] Mensagem enviada para ${to}: ${message}`);
      return;
    }

    const token = process.env.WA_ACCESS_TOKEN;
    const phoneId = process.env.WA_PHONE_NUMBER_ID;
    const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;

    // Limpeza radical: mantém APENAS os números.
    // Isso garante que não vá nenhum "+" ou espaço que a Meta possa rejeitar.
    const numeroLimpo = to.replace(/\D/g, '');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: numeroLimpo, // Enviando o número com 13 dígitos (com o 9)
          type: 'text',
          text: {
            preview_url: false,
            body: message
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ [ERRO META API]:', JSON.stringify(data, null, 2));
        throw new Error(`A Meta recusou a mensagem: ${response.statusText}`);
      }

      console.log(`✅ [WPP REAL] Mensagem entregue para a Meta: ${numeroLimpo}`);
      
    } catch (error) {
      console.error(`❌ Falha no envio para ${to}:`, error);
      throw error;
    }
  }
}

export const whatsappService = new WhatsAppService();