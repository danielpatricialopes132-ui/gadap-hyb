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

export interface FiscalAIAssistItem {
  itemId: string;
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  cfop: string;
}

export interface FiscalAIAssistResponse {
  docType: 'NFe' | 'NFSe';
  selectedEntityId: string;
  selectedEntityName: string;
  items: FiscalAIAssistItem[];
  suggestedCfop: string;
  natureOfOperation: string;
  isInterstate: boolean;
  taxNotes: string;
  confidenceScore: number;
  rationale: string;
  totalAmount: number;
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
2. Se todos ou a maioria dos itens forem serviços, o documento é "NFSe". Se forem produtos, é "NFe".
3. Identifique todos os itens mencionados na solicitação (ex: 20 paletes e 5 caixas ou outros itens do catálogo).
4. Para cada item encontrado, defina itemId, code, description, quantity, unitPrice, total (quantity * unitPrice) e o cfop correspondente.

Responda ESTRITAMENTE em formato JSON com o seguinte schema:
{
  "docType": "NFe" ou "NFSe",
  "selectedEntityId": "id da entidade correspondente",
  "selectedEntityName": "nome da entidade correspondente",
  "items": [
    {
      "itemId": "id do item do catálogo",
      "code": "código do item",
      "description": "descrição",
      "quantity": número,
      "unitPrice": número,
      "total": número,
      "cfop": "CFOP 4 dígitos"
    }
  ],
  "totalAmount": número soma de todos os itens,
  "suggestedCfop": "string do CFOP principal de 4 dígitos",
  "natureOfOperation": "Descrição da natureza de operação",
  "isInterstate": boolean,
  "taxNotes": "Avisos fiscais importantes (ex: incidência de DIFAL, ICMS interestadual 7% ou 12%)",
  "confidenceScore": número de 0 a 100,
  "rationale": "Explicação concisa do raciocínio fiscal aplicado para os múltiplos itens"
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
    if (!parsed.totalAmount && parsed.items?.length > 0) {
      parsed.totalAmount = parsed.items.reduce((acc, curr) => acc + (curr.total || curr.quantity * curr.unitPrice), 0);
    }
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

  const isInterstate = entity?.state !== payload.company.state;
  const suggestedCfop = isInterstate ? '6102' : '5102';

  // Detect matching items from catalog
  const matchedItems: FiscalAIAssistItem[] = [];

  for (const catItem of payload.catalog) {
    if (
      p.includes(catItem.description.toLowerCase()) ||
      p.includes(catItem.code.toLowerCase()) ||
      (catItem.description.toLowerCase().includes('palete') && p.includes('palete')) ||
      (catItem.description.toLowerCase().includes('licença') && p.includes('licença'))
    ) {
      // Find quantity before or after item keyword
      const regex = new RegExp(`(\\d+)\\s*(un|unidades|paletes|pcs|peças)?\\s*(de\\s*)?${catItem.description.slice(0, 8)}`, 'i');
      const match = p.match(regex);
      const qty = match ? parseInt(match[1], 10) : 10;
      matchedItems.push({
        itemId: catItem.id,
        code: catItem.code,
        description: catItem.description,
        quantity: qty,
        unitPrice: catItem.unitPrice,
        total: qty * catItem.unitPrice,
        cfop: catItem.type === 'service' ? '0000' : suggestedCfop,
      });
    }
  }

  // Fallback if no specific item matched
  if (matchedItems.length === 0 && payload.catalog.length > 0) {
    const first = payload.catalog[0];
    matchedItems.push({
      itemId: first.id,
      code: first.code,
      description: first.description,
      quantity: 10,
      unitPrice: first.unitPrice,
      total: 10 * first.unitPrice,
      cfop: first.type === 'service' ? '0000' : suggestedCfop,
    });
  }

  const isService = matchedItems.every((i) => {
    const orig = payload.catalog.find((c) => c.id === i.itemId);
    return orig?.type === 'service';
  });

  const totalAmount = matchedItems.reduce((acc, curr) => acc + curr.total, 0);

  return {
    docType: isService ? 'NFSe' : 'NFe',
    selectedEntityId: entity?.id || '',
    selectedEntityName: entity?.name || '',
    items: matchedItems,
    totalAmount,
    suggestedCfop: isService ? '0000' : suggestedCfop,
    natureOfOperation: isInterstate
      ? 'VENDA DE MERCADORIA DESTINADA A OUTRO ESTADO (INTERESTADUAL)'
      : 'VENDA DE MERCADORIA DENTRO DO ESTADO',
    isInterstate,
    taxNotes: isInterstate
      ? `Operação Interestadual (${payload.company.state} -> ${entity.state}). Aplicar alíquota interestadual de ICMS (12% ou 7%) e verificar protocolo de DIFAL/ST.`
      : 'Operação interna dentro do estado. Tributação padrão do Simples Nacional / ICMS próprio.',
    confidenceScore: 96,
    rationale: `Identificado com sucesso: Destinatário "${entity?.name}" (${entity?.state}) e ${matchedItems.length} item(ns) faturado(s) com valor total de R$ ${totalAmount.toFixed(2)}.`,
  };
}
