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

    if (isMock) {
      console.log(`[MOCK WPP] Mensagem enviada para ${to}: ${message}`);
      return;
    }

    // TODO: Implementar envio real via WhatsApp Cloud API na Fase de Conexão com a Meta
    throw new Error('Envio real do WhatsApp Cloud API ainda não implementado.');
  }
}

export const whatsappService = new WhatsAppService();
