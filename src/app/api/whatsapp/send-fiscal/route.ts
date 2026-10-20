import { NextResponse } from 'next/server';
import { evolutionService, WhatsAppMessagePayload } from '@/services/evolutionWhatsApp';

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as WhatsAppMessagePayload;

    if (!payload.recipientPhone) {
      return NextResponse.json(
        { success: false, error: 'Número de telefone/WhatsApp não informado.' },
        { status: 400 }
      );
    }

    const result = await evolutionService.sendFiscalDocument(payload);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /api/whatsapp/send-fiscal error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno ao disparar WhatsApp' },
      { status: 500 }
    );
  }
}
