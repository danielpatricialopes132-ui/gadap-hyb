import {
  FiscalProvider,
  NFePayload,
  NFSePayload,
  FiscalResponse,
  FiscalStatus,
  FocusNFeProvider,
  FiscalContoraProvider,
} from '../fiscalEngine';
import { ContoraProvider } from './contora';

/**
 * MOCK FISCAL PROVIDER
 * Safe fallback for local/offline testing when no API key is provided
 */
export class MockFiscalProvider implements FiscalProvider {
  name = 'Mock Fiscal Provider (Local Sandbox)';
  isPrimary = false;

  async transmitNFe(payload: NFePayload): Promise<FiscalResponse> {
    await new Promise((r) => setTimeout(r, 400));
    const cleanCnpj = payload.companyCnpj.replace(/\D/g, '').padEnd(14, '0');
    const randomKey = `352610${cleanCnpj}55001${String(payload.number).padStart(9, '0')}0000111199`;
    return {
      success: true,
      documentId: `MOCK-${payload.series}-${payload.number}`,
      accessKey: randomKey,
      protocol: `1352600${Math.floor(10000000 + Math.random() * 90000000)}`,
      status: 'Authorized',
      message: 'NF-e homologada com sucesso (Simulador Fiscal Local)',
      xmlUrl: `/api/danfe/${randomKey}?format=xml`,
      pdfUrl: `/api/danfe/${randomKey}?type=NFe&num=${payload.number}&series=${payload.series}&total=${payload.totalAmount}`,
      providerUsed: this.name,
    };
  }

  async transmitNFSe(payload: NFSePayload): Promise<FiscalResponse> {
    await new Promise((r) => setTimeout(r, 350));
    const docId = `NFSE-MOCK-${payload.number}`;
    return {
      success: true,
      documentId: docId,
      protocol: `MOCK-PREF-${Math.floor(1000000 + Math.random() * 9000000)}`,
      status: 'Authorized',
      message: 'NFS-e gerada em ambiente de teste local',
      pdfUrl: `https://gadap.com.br/mock-danfse/${docId}.pdf`,
      xmlUrl: `https://gadap.com.br/mock-danfse/${docId}.xml`,
      providerUsed: this.name,
    };
  }

  async checkStatus(documentId: string): Promise<FiscalStatus> {
    return {
      documentId,
      status: 'Authorized',
      updatedAt: new Date().toISOString(),
    };
  }

  async cancelDocument(documentId: string, justification: string): Promise<boolean> {
    if (justification.length < 15) throw new Error('A justificativa de cancelamento exige no mínimo 15 caracteres.');
    return true;
  }
}

/**
 * FISCAL FACTORY / STRATEGY
 * Instantiates the appropriate fiscal adapter based on company configuration:
 * - FocusNFeProvider (Primary default, uses FOCUS_NFE_TOKEN / FOCUS_NFE_ENV)
 * - ContoraProvider (Secondary adapter, uses CONTORA_API_KEY / CONTORA_ENV)
 * - MockFiscalProvider (Local sandbox fallback if no credentials are configured)
 */
export function getFiscalProvider(
  providerType?: 'focus_nfe' | 'fiscal_contora' | 'contora' | string,
  credentials?: {
    focusToken?: string;
    contoraApiKey?: string;
    contoraSecret?: string;
  }
): FiscalProvider {
  const chosen = providerType?.toLowerCase();

  if (chosen === 'contora' || chosen === 'fiscal_contora') {
    const hasContoraKey =
      Boolean(credentials?.contoraApiKey) ||
      Boolean(process.env.CONTORA_API_KEY) ||
      Boolean(process.env.FISCAL_CONTORA_API_KEY);

    if (!hasContoraKey) {
      // If user explicitly chose Contora but has neither company nor global env key
      return new ContoraProvider();
    }
    return new ContoraProvider();
  }

  // Focus NFe (Default)
  const hasFocusToken =
    Boolean(credentials?.focusToken) ||
    Boolean(process.env.FOCUS_NFE_TOKEN);

  if (hasFocusToken) {
    return new FocusNFeProvider();
  }

  // Fallback to Mock if neither key exists
  if (!hasFocusToken && !process.env.CONTORA_API_KEY) {
    return new MockFiscalProvider();
  }

  return new FocusNFeProvider();
}

// Re-export providers & interfaces for standard usage
export { FocusNFeProvider, ContoraProvider, FiscalContoraProvider };
export type {
  FiscalProvider,
  NFePayload,
  NFSePayload,
  FiscalResponse,
  FiscalStatus,
} from '../fiscalEngine';
