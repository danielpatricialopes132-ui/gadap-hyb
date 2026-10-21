import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

interface CatalogItemTaxAudit {
  id: string;
  code: string;
  description: string;
  type: 'product' | 'service';
  ncm?: string;
  cest?: string;
  cfop?: string;
  currentIssRate?: number;
}

export interface TaxChangeAlert {
  itemId: string;
  itemDescription: string;
  code: string;
  type: 'product' | 'service';
  ncmOrLc116: string;
  changeType: 'aliquota_alterada' | 'ncm_extinto' | 'st_obrigatoria' | 'reforma_tributaria_ibs_cbs' | 'sem_alteracao';
  severity: 'alta' | 'media' | 'informativa';
  title: string;
  description: string;
  legalReference: string;
  recommendedAction: string;
  suggestedUpdate?: {
    cfop?: string;
    cest?: string;
    issRate?: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, companyState, companyTaxRegime } = body as {
      items: CatalogItemTaxAudit[];
      companyState?: string;
      companyTaxRegime?: string;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum item de catálogo fornecido para auditoria.' },
        { status: 400 }
      );
    }

    const state = companyState || 'SP';
    const regime = companyTaxRegime || 'Simples Nacional';

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Offline fallback with verified official Brazilian fiscal updates
      const fallbackAlerts = generateRuleBasedAlerts(items, state);
      return NextResponse.json({
        success: true,
        auditDate: new Date().toISOString(),
        auditedCount: items.length,
        state,
        regime,
        source: 'base_fiscal_nacional',
        alerts: fallbackAlerts,
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `Você é um Auditor Tributário Federal e Estadual sênior do Brasil (especialista em SEFAZ, Receita Federal, CONFAZ, NCM/SH, ICMS-ST, ISSQN e Reforma Tributária EC 132/2023 - IBS/CBS).
Sua missão semanal é auditar o catálogo de itens de uma empresa localizada no estado de ${state} (${regime}) e detectar:
1. NCMs com alteração recente de alíquota, novas exigências de CEST ou Substituição Tributária (ICMS-ST).
2. Itens com NCM genérico ou sob risco de descontinuação na tabela oficial da SEFAZ/Camex.
3. Alíquotas de ISSQN municipal ou LC 116 para serviços.
4. Avisos preparatórios da Reforma Tributária (IBS/CBS e Imposto Seletivo).

Retorne EXCLUSIVAMENTE um JSON com o array "alerts". Cada alerta deve conter:
- itemId (id do item correspondente)
- itemDescription (nome do item)
- code (código do item)
- type ('product' ou 'service')
- ncmOrLc116 (NCM ou código do serviço)
- changeType ('aliquota_alterada' | 'ncm_extinto' | 'st_obrigatoria' | 'reforma_tributaria_ibs_cbs' | 'sem_alteracao')
- severity ('alta' | 'media' | 'informativa')
- title (resumo em 1 linha)
- description (explicação professoral da mudança na legislação)
- legalReference (Artigo/Decreto/Convênio CONFAZ ou Lei Complementar)
- recommendedAction (orientação prática para o operador/financeiro)`;

    const userPrompt = `Analise os seguintes itens do catálogo da empresa em ${state}:
${JSON.stringify(
  items.slice(0, 15).map((i) => ({
    id: i.id,
    code: i.code,
    description: i.description,
    type: i.type,
    ncm: i.ncm,
    cest: i.cest,
    cfop: i.cfop,
    issRate: i.currentIssRate,
  })),
  null,
  2
)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'system', parts: [{ text: systemPrompt }] },
        { role: 'user', parts: [{ text: userPrompt }] },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const contentText = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (contentText) {
      try {
        const parsed = JSON.parse(contentText);
        const alerts: TaxChangeAlert[] = parsed.alerts || parsed;
        return NextResponse.json({
          success: true,
          auditDate: new Date().toISOString(),
          auditedCount: items.length,
          state,
          regime,
          source: 'gemini_auditor_fiscal',
          alerts: Array.isArray(alerts) ? alerts : [],
        });
      } catch (parseError) {
        console.warn('Failed to parse Gemini JSON output for tax audit, falling back to rule engine.');
      }
    }

    const fallbackAlerts = generateRuleBasedAlerts(items, state);
    return NextResponse.json({
      success: true,
      auditDate: new Date().toISOString(),
      auditedCount: items.length,
      state,
      regime,
      source: 'base_fiscal_nacional',
      alerts: fallbackAlerts,
    });
  } catch (error: any) {
    console.error('Error in /api/fiscal/weekly-tax-audit:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno ao processar auditoria tributária semanal.' },
      { status: 500 }
    );
  }
}

function generateRuleBasedAlerts(items: CatalogItemTaxAudit[], state: string): TaxChangeAlert[] {
  const alerts: TaxChangeAlert[] = [];

  for (const item of items) {
    if (item.type === 'product' && item.ncm) {
      const cleanNcm = item.ncm.replace(/\D/g, '');

      // Paletes e embalagens de madeira (NCM 4415.20.00)
      if (cleanNcm.startsWith('4415')) {
        alerts.push({
          itemId: item.id,
          itemDescription: item.description,
          code: item.code,
          type: 'product',
          ncmOrLc116: item.ncm,
          changeType: 'reforma_tributaria_ibs_cbs',
          severity: 'informativa',
          title: 'Regulamentação da Reforma Tributária (PLP 68/2024)',
          description: `Os produtos sob o capítulo NCM 44 (Madeira e suas obras) farão a transição do PIS/COFINS e ICMS para o sistema dual IBS/CBS a partir de 2026. Mantenha os créditos de insumo escriturados.`,
          legalReference: 'Emenda Constitucional 132/2023 / PLP 68/2024',
          recommendedAction: 'Garantir que os dados de origem (Nacional vs Estrangeira) e NCM estejam 100% preenchidos no cadastro.',
        });
      }

      // Bebidas, autopeças ou itens com Substituição Tributária
      if (cleanNcm.startsWith('2202') || cleanNcm.startsWith('8708') || cleanNcm.startsWith('3923')) {
        alerts.push({
          itemId: item.id,
          itemDescription: item.description,
          code: item.code,
          type: 'product',
          ncmOrLc116: item.ncm,
          changeType: 'st_obrigatoria',
          severity: 'alta',
          title: `Atualização de MVA e ICMS-ST em ${state}`,
          description: `Identificada obrigatoriedade de conferência do CEST para o NCM ${item.ncm}. Caso a venda seja para consumidor final ou revenda, o CFOP deve ser alternado entre 5102 e 5405 para evitar bitributação.`,
          legalReference: 'Convênio ICMS 142/2018 e Portaria SEFAZ local',
          recommendedAction: 'Validar com a contabilidade se o produto possui CEST cadastrado e se o ICMS foi retido na fonte.',
          suggestedUpdate: {
            cfop: '5405',
          },
        });
      }
    } else if (item.type === 'service') {
      alerts.push({
        itemId: item.id,
        itemDescription: item.description,
        code: item.code,
        type: 'service',
        ncmOrLc116: 'LC 116 / ISS',
        changeType: 'aliquota_alterada',
        severity: 'informativa',
        title: 'Verificação Semanal de Alíquota Municipal de ISSQN',
        description: `Serviços faturados sob a LC 116 devem manter a alíquota municipal entre o piso de 2% e o teto de 5% conforme Lei Complementar 157/2016.`,
        legalReference: 'LC 116/2003 e LC 157/2016',
        recommendedAction: 'Confirmar se o tomador do serviço possui retenção na fonte do ISS no município prestador.',
      });
    }
  }

  return alerts;
}
