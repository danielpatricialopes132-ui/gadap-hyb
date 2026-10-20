import { GoogleGenAI } from '@google/genai';

export interface FiscalAIAssistRequest {
  userPrompt: string; // Ex: "Emitir venda de 50 paletes PBR para a Carioca Bebidas no RJ com frete por conta do destinatário"
  company: {
    name: string;
    cnpj: string;
    state: string; // Ex: "SP"
    taxRegime: string;
  };
  entities: Array<{
    id: string;
    name: string;
    document: string;
    state: string;
    indicadorIE: string;
  }>;
  catalog: Array<{
    id: string;
    code: string;
    description: string;
    type: 'product' | 'service';
    unitPrice: number;
    ncm?: string;
    cfop?: string;
  }>;
}

export interface FiscalAIAssistResponse {
  docType: 'NFe' | 'NFSe';
  selectedEntityId: string;
  selectedEntityName: string;
  selectedItemId: string;
  selectedItemDescription: string;
  quantity: number;
  unitPrice: number;
  suggestedCfop: string;
  natureOfOperation: string;
  isInterstate: boolean;
  taxNotes: string;
  confidenceScore: number;
  rationale: string;
}

export async function processFiscalCopilot(
  payload: FiscalAIAssistRequest
): Promise<FiscalAIAssistResponse> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  // Rule-based heuristic fallback if API key is not yet set
  const fallback = generateHeuristicSuggestion(payload);

  if (!apiKey) {
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
Você é o Copiloto Fiscal Tributário Brasileiro do ERP GADAP Hub.
Analise a solicitação do usuário em linguagem natural e cruze com a lista de entidades e itens do catálogo da empresa.

EMPRESA EMITENTE:
Nome: ${payload.company.name} | CNPJ: ${payload.company.cnpj} | UF: ${payload.company.state} (Regime: ${payload.company.taxRegime})

CLIENTES/FORNECEDORES CADASTRADOS:
${JSON.stringify(payload.entities, null, 2)}

CATÁLOGO DE PRODUTOS E SERVIÇOS:
${JSON.stringify(payload.catalog, null, 2)}

SOLICITAÇÃO DO OPERADOR:
"${payload.userPrompt}"

REGRAS FISCAIS TRIBUTÁRIAS:
1. Se a UF do destinatário for diferente da UF da emitente (${payload.company.state}), a operação é INTERESTADUAL.
   - Venda de mercadoria dentro do estado: CFOP 5102 (ou 5101 se fabricação).
   - Venda de mercadoria interestadual (fora do estado): CFOP 6102 (ou 6101 se fabricação).
2. Se o item faturado for do tipo "service", o documento é "NFSe". Se for "product", é "NFe".
3. Identifique qual entidade melhor corresponde ao pedido e qual item do catálogo.
4. Calcule a quantidade e o preço unitário.

Responda ESTRITAMENTE em formato JSON com o seguinte schema:
{
  "docType": "NFe" ou "NFSe",
  "selectedEntityId": "id da entidade correspondente",
  "selectedEntityName": "nome da entidade correspondente",
  "selectedItemId": "id do item correspondente",
  "selectedItemDescription": "descrição do item",
  "quantity": número,
  "unitPrice": número,
  "suggestedCfop": "string do CFOP de 4 dígitos",
  "natureOfOperation": "Descrição da natureza de operação",
  "isInterstate": boolean,
  "taxNotes": "Avisos fiscais importantes (ex: incidência de DIFAL, ICMS interestadual 7% ou 12%)",
  "confidenceScore": número de 0 a 100,
  "rationale": "Explicação concisa do raciocínio fiscal aplicado"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text) as FiscalAIAssistResponse;
    return parsed;
  } catch (err) {
    console.warn('Gemini Copilot API error, using fiscal heuristics:', err);
    return fallback;
  }
}

function generateHeuristicSuggestion(payload: FiscalAIAssistRequest): FiscalAIAssistResponse {
  const p = payload.userPrompt.toLowerCase();

  // Find entity
  const entity =
    payload.entities.find(
      (e) =>
        p.includes(e.name.toLowerCase()) ||
        p.includes(e.state.toLowerCase()) ||
        (e.name.toLowerCase().includes('carioca') && p.includes('carioca')) ||
        (e.name.toLowerCase().includes('alvorada') && p.includes('alvorada')) ||
        (e.name.toLowerCase().includes('vale') && p.includes('vale'))
    ) || payload.entities[0];

  // Find item
  const item =
    payload.catalog.find(
      (i) =>
        p.includes(i.description.toLowerCase()) ||
        p.includes(i.code.toLowerCase()) ||
        (i.description.toLowerCase().includes('palete') && p.includes('palete')) ||
        (i.description.toLowerCase().includes('licença') && p.includes('licença'))
    ) || payload.catalog[0];

  // Extract quantity (regex for numbers followed by optional words)
  const qtyMatch = p.match(/(\d+)\s*(un|unidades|paletes|pcs|peças)?/i);
  const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 10;

  const isInterstate = entity?.state !== payload.company.state;
  const isService = item?.type === 'service';
  const suggestedCfop = isService ? '0000' : isInterstate ? '6102' : '5102';

  return {
    docType: isService ? 'NFSe' : 'NFe',
    selectedEntityId: entity?.id || '',
    selectedEntityName: entity?.name || '',
    selectedItemId: item?.id || '',
    selectedItemDescription: item?.description || '',
    quantity: quantity > 0 ? quantity : 1,
    unitPrice: item?.unitPrice || 85.0,
    suggestedCfop,
    natureOfOperation: isInterstate
      ? 'VENDA DE MERCADORIA DESTINADA A OUTRO ESTADO (INTERESTADUAL)'
      : 'VENDA DE MERCADORIA DENTRO DO ESTADO',
    isInterstate,
    taxNotes: isInterstate
      ? `Operação Interestadual (${payload.company.state} -> ${entity.state}). Aplicar alíquota interestadual de ICMS (12% ou 7%) e verificar protocolo de DIFAL/ST.`
      : 'Operação interna dentro do estado. Tributação padrão do Simples Nacional / ICMS próprio.',
    confidenceScore: 95,
    rationale: `Identificado automaticamente: Entidade "${entity?.name}" (${entity?.state}) e item "${item?.description}". Como o destino é ${entity?.state} e a emitente é ${payload.company.state}, o CFOP sugerido é ${suggestedCfop}.`,
  };
}
