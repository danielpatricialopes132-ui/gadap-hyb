import { NextRequest, NextResponse } from 'next/server';
import { getFiscalProvider, NFePayload } from '@/services/fiscal';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, credentials, company, items } = body;

    const fiscalAdapter = getFiscalProvider(provider || 'focus_nfe', {
      focusToken: credentials?.focusToken,
      contoraApiKey: credentials?.contoraApiKey,
      contoraSecret: credentials?.contoraSecret,
    });

    const testPayload: NFePayload = {
      companyId: company?.id || 'emp-teste',
      companyCnpj: company?.cnpj || '12.345.678/0001-90',
      series: company?.series || 1,
      number: company?.number || 9999,
      natureOfOperation: 'Remessa de Teste / Simulação Fiscal SEFAZ',
      recipient: {
        cpfCnpj: '00.000.000/0001-91',
        name: 'CLIENTE TESTE HOMOLOGAÇÃO LTDA',
        stateRegistration: 'ISENTO',
        email: 'fiscal@teste.com.br',
        address: {
          street: 'Avenida Paulista',
          number: '1000',
          district: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          ibgeCode: '3550308',
        },
      },
      items: items && items.length > 0 ? items : [
        {
          code: 'TEST-001',
          description: 'Item Demonstrativo para Teste SEFAZ',
          ncm: '8471.30.12',
          cfop: '5102',
          unit: 'UN',
          quantity: 1,
          unitPrice: 100.0,
          totalPrice: 100.0,
          origin: '0',
        },
      ],
      totalAmount: 100.0,
      paymentMethod: '01',
    };

    const startTime = Date.now();
    const result = await fiscalAdapter.transmitNFe(testPayload, credentials);
    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      providerUsed: fiscalAdapter.name,
      durationMs,
      result,
      transmittedPayload: testPayload,
      logs: [
        `[${new Date().toISOString()}] Inicializando emissão de teste...`,
        `[${new Date().toISOString()}] Provedor selecionado: ${fiscalAdapter.name}`,
        `[${new Date().toISOString()}] Endpoint de envio: ${provider === 'contora' || provider === 'fiscal_contora' ? 'https://api.fiscal.contora.com.br/v1/nfe/emitir' : 'https://homologacao.focusnfe.com.br/v2/nfe'}`,
        `[${new Date().toISOString()}] Payload validado com sucesso (1 item, R$ 100,00)`,
        `[${new Date().toISOString()}] Resposta SEFAZ: Status ${result.status} - Protocolo ${result.protocol || 'N/A'}`,
        `[${new Date().toISOString()}] Chave de Acesso: ${result.accessKey || 'N/A'}`,
        `[${new Date().toISOString()}] Tempo de resposta SEFAZ: ${durationMs}ms`,
      ],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao executar teste de emissão',
      },
      { status: 500 }
    );
  }
}
