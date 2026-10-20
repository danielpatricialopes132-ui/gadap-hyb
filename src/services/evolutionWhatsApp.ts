export interface WhatsAppMessagePayload {
  recipientPhone: string; // Ex: "5511999998888" ou "(11) 99999-8888"
  recipientName: string;
  documentType: 'NF-e' | 'NFS-e';
  documentNumber: number;
  documentSeries: number;
  companyName: string;
  totalAmount: number;
  accessKey?: string;
  pdfUrl?: string;
  xmlUrl?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EvolutionWhatsAppService {
  private get baseUrl(): string {
    return (process.env.EVOLUTION_API_URL || 'https://whatsapp-ecostone.onrender.com').replace(/\/$/, '');
  }

  private get instanceName(): string {
    return process.env.EVOLUTION_INSTANCE_NAME || 'ecostone';
  }

  private get apiKey(): string {
    return process.env.EVOLUTION_API_KEY || 'Gabriel2006!';
  }

  /**
   * Sanitizes phone number to standard 55DDD9XXXXXXXX WhatsApp format
   */
  private formatPhoneNumber(rawPhone: string): string {
    const cleaned = rawPhone.replace(/\D/g, '');
    if (cleaned.startsWith('55')) {
      return cleaned;
    }
    // If DDD + 8 or 9 digits, prefix with Brazil country code 55
    if (cleaned.length === 10 || cleaned.length === 11) {
      return `55${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Sends structured WhatsApp notification with DANFE/PDF attachment via Evolution API
   */
  async sendFiscalDocument(payload: WhatsAppMessagePayload): Promise<WhatsAppSendResult> {
    const phone = this.formatPhoneNumber(payload.recipientPhone);
    if (!phone || phone.length < 10) {
      return { success: false, error: 'Número de telefone/WhatsApp inválido ou ausente.' };
    }

    const valorFormatado = payload.totalAmount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const caption = [
      `📄 *Comprovante Fiscal Eletrônico - ${payload.companyName}*`,
      ``,
      `Olá, *${payload.recipientName}*!`,
      `Seu documento fiscal foi emitido e autorizado com sucesso na SEFAZ:`,
      ``,
      `🔹 *Modelo:* ${payload.documentType} (Série ${payload.documentSeries})`,
      `🔹 *Número:* #${payload.documentNumber}`,
      `🔹 *Valor Total:* ${valorFormatado}`,
      payload.accessKey ? `🔑 *Chave de Acesso:* \`${payload.accessKey}\`` : null,
      ``,
      payload.pdfUrl ? `📥 Baixar DANFE (PDF): ${payload.pdfUrl}` : null,
      payload.xmlUrl ? `📦 Baixar XML SEFAZ: ${payload.xmlUrl}` : null,
      ``,
      `_Mensagem automática enviada via GADAP Hub & Evolution API._`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      // 1. If PDF URL is present, send as media document
      if (payload.pdfUrl) {
        const mediaEndpoint = `${this.baseUrl}/message/sendMedia/${this.instanceName}`;
        const mediaRes = await fetch(mediaEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.apiKey,
          },
          body: JSON.stringify({
            number: phone,
            mediatype: 'document',
            mimetype: 'application/pdf',
            caption,
            media: payload.pdfUrl,
            fileName: `${payload.documentType}_${payload.documentNumber}.pdf`,
          }),
        });

        if (mediaRes.ok) {
          const data = await mediaRes.json();
          return { success: true, messageId: data?.key?.id || data?.id };
        }
      }

      // 2. Fallback: Send rich text message
      const textEndpoint = `${this.baseUrl}/message/sendText/${this.instanceName}`;
      const textRes = await fetch(textEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.apiKey,
        },
        body: JSON.stringify({
          number: phone,
          text: caption,
          linkPreview: true,
        }),
      });

      if (textRes.ok) {
        const data = await textRes.json();
        return { success: true, messageId: data?.key?.id || data?.id };
      }

      const errData = await textRes.json().catch(() => ({}));
      return {
        success: false,
        error: errData?.message || `Falha no envio HTTP ${textRes.status}: ${textRes.statusText}`,
      };
    } catch (err: any) {
      console.error('Evolution API error:', err);
      return { success: false, error: err.message || 'Erro de conexão com o servidor Evolution API.' };
    }
  }
}

export const evolutionService = new EvolutionWhatsAppService();
