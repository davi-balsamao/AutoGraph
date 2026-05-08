export class WhatsAppService {
  /**
   * Envia uma mensagem via WhatsApp.
   * Se USE_MOCK_WHATSAPP for 'true', apenas imprime no console simulando o envio.
   * 
   * @param to Número de destino
   * @param message Conteúdo da mensagem
   */
  async sendMessage(to: string, message: string): Promise<void> {
    const isMock = process.env.USE_MOCK_WHATSAPP === 'true';

    // --- Tratamento do 9º dígito (Brasil) ---
    // Regra do WhatsApp: DDDs <= 28 USAM o 9º dígito. DDDs > 28 NÃO USAM o 9º dígito na API.
    let normalizedTo = to;
    if (to.startsWith('55')) {
      const ddd = parseInt(to.substring(2, 4), 10);
      if (ddd <= 28 && to.length === 12) {
        // Insere o 9
        normalizedTo = `${to.substring(0, 4)}9${to.substring(4)}`;
        console.log(`[WhatsApp Service] Inserindo 9º dígito (DDD ${ddd}): ${to} -> ${normalizedTo}`);
      } else if (ddd > 28 && to.length === 13) {
        // Remove o 9
        normalizedTo = `${to.substring(0, 4)}${to.substring(5)}`;
        console.log(`[WhatsApp Service] Removendo 9º dígito (DDD ${ddd}): ${to} -> ${normalizedTo}`);
      }
    }

    if (isMock) {
      console.log(`[MOCK WPP] Mensagem enviada para ${normalizedTo}: ${message}`);
      return;
    }

    const token = process.env.WA_ACCESS_TOKEN;
    const phoneId = process.env.WA_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
      console.error('[WhatsApp Service] Credenciais faltando: WA_ACCESS_TOKEN ou WA_PHONE_NUMBER_ID');
      throw new Error('Credenciais do WhatsApp Cloud API não configuradas no .env');
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: normalizedTo,
          type: 'text',
          text: { body: message },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[WhatsApp API Error]', data);
        throw new Error(`WhatsApp API Error: ${data.error?.message || 'Erro desconhecido'}`);
      }
      
      console.log(`[WhatsApp] Mensagem enviada com sucesso para ${to}`);
    } catch (error) {
      console.error('[WhatsApp Service] Falha ao enviar mensagem:', error);
      throw error;
    }
  }
}

export const whatsappService = new WhatsAppService();
