import { NextRequest, NextResponse } from 'next/server';
import { processFiscalCopilot, FiscalAIAssistRequest } from '@/services/fiscalAIAssist';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FiscalAIAssistRequest;

    if (!body.userPrompt || !body.userPrompt.trim()) {
      return NextResponse.json(
        { error: 'A solicitação em linguagem natural é obrigatória.' },
        { status: 400 }
      );
    }

    const suggestion = await processFiscalCopilot(body);
    return NextResponse.json({ success: true, suggestion });
  } catch (err: any) {
    console.error('Fiscal Copilot route error:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao processar o assistente fiscal de IA.' },
      { status: 500 }
    );
  }
}
