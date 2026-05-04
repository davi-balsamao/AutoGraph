/**
 * Dados extraídos de uma mensagem do WhatsApp Cloud API.
 */
export interface WhatsAppMessageData {
  from: string;
  messageId: string;
  timestamp: string;
  text: string;
  contactName: string;
  rawPayload: object;
}

/**
 * Faz o parse do payload do webhook do WhatsApp Cloud API,
 * extraindo as mensagens de texto recebidas.
 *
 * @returns Lista de mensagens extraídas, ou array vazio se não houver mensagens.
 */
export function parseWhatsAppPayload(body: any): WhatsAppMessageData[] {
  const messages: WhatsAppMessageData[] = [];

  if (body.object !== 'whatsapp_business_account') {
    return messages;
  }

  const entries = body.entry;
  if (!Array.isArray(entries)) return messages;

  for (const entry of entries) {
    const changes = entry.changes;
    if (!Array.isArray(changes)) continue;

    for (const change of changes) {
      const value = change.value;
      if (!value || !Array.isArray(value.messages)) continue;

      const contacts = value.contacts || [];

      for (const msg of value.messages) {
        if (msg.type !== 'text') continue;

        const contact = contacts.find((c: any) => c.wa_id === msg.from);

        messages.push({
          from: msg.from,
          messageId: msg.id,
          timestamp: msg.timestamp,
          text: msg.text?.body || '',
          contactName: contact?.profile?.name || 'Desconhecido',
          rawPayload: msg,
        });
      }
    }
  }

  return messages;
}
