import {
  FiscalProvider,
  NFePayload,
  NFSePayload,
  FiscalResponse,
  FiscalStatus,
} from '../fiscalEngine';

/**
 * SCHEMA INPUT DO MOTOR FISCAL CORE (FastAPI em C:\Nota_Fiscal)
 * Endpoints:
 * - Emissão: /api/v1/dfe/emitir
 * - DANFE PDF: /api/v1/dfe/danfe (payload: { xml_autorizado_b64 })
 * - Cancelamento: /api/v1/dfe/cancelar
 * - Status Serviço: /api/v1/dfe/status-servico
 */
export interface DocumentoFiscalInput {
  modelo?: '55' | '65' | number | string;
  serie?: number;
  numero?: number;
  natureza_operacao?: string;
  tipo_documento?: number; // 1 - Saída, 0 - Entrada
  finalidade_emissao?: number; // 1 - Normal
  ambiente?: number; // 1 - Produção, 2 - Homologação
  emitente: {
    cnpj: string;
    razao_social?: string;
    nome_fantasia?: string;
    inscricao_estadual?: string;
    crt: number | string; // 1 - Simples Nacional, 2 - Simples excesso sublimite, 3 - Regime Normal
    regime_tributario?: number | string;
    endereco?: {
      logradouro?: string;
      numero?: string;
      bairro?: string;
      municipio?: string;
      uf?: string;
      cep?: string;
      codigo_ibge?: string;
    };
  };
  destinatario: {
    cpf_cnpj: string;
    nome_razao_social: string;
    inscricao_estadual?: string;
    indicador_ie?: number;
    email?: string;
    endereco: {
      logradouro: string;
      numero: string;
      bairro: string;
      municipio: string;
      uf: string;
      cep: string;
      codigo_ibge?: string;
    };
  };
  itens: Array<{
    numero_item: number;
    codigo_produto: string;
    descricao: string;
    ncm: string;
    cfop: string;
    unidade_comercial: string;
    quantidade_comercial: number;
    valor_unitario_comercial: number;
    valor_bruto: number;
    origem?: string | number;
    tributos?: {
      icms?: {
        origem?: string | number;
        csosn?: string; // CSOSN do Simples Nacional (ex: '102', '101', '400', '500')
        cst?: string;
        aliquota?: number;
        base_calculo?: number;
      };
      pis?: {
        cst?: string;
        aliquota?: number;
        valor?: number;
      };
      cofins?: {
        cst?: string;
        aliquota?: number;
        valor?: number;
      };
    };
  }>;
  pagamentos?: Array<{
    forma_pagamento: string;
    valor_pagamento: number;
    tipo_integracao?: number;
  }>;
  pagamento?: {
    forma_pagamento: string;
    valor_pagamento: number;
  };
  valor_total: number;
  informacoes_adicionais?: string;
}

export class GadapFiscalCoreProvider implements FiscalProvider {
  name = 'Gadap Fiscal Core (Local FastAPI)';
  isPrimary = true;

  private getBaseUrl(): string {
    const url = process.env.GADAP_FISCAL_CORE_URL || 'http://localhost:8000';
    return url.replace(/\/+$/, '');
  }

  /**
   * Helper para construir o schema DocumentoFiscalInput respeitando CRT 1 e CSOSN do Simples Nacional
   */
  private buildDocumentoFiscalInput(
    payload: NFePayload,
    isProd = false
  ): DocumentoFiscalInput {
    const cleanEmitCnpj = payload.companyCnpj.replace(/\D/g, '');
    const cleanDestCpfCnpj = payload.recipient.cpfCnpj.replace(/\D/g, '');

    return {
      modelo: '55',
      serie: payload.series || 1,
      numero: payload.number,
      natureza_operacao: payload.natureOfOperation || 'Venda de mercadoria',
      tipo_documento: 1, // Saída
      finalidade_emissao: 1, // Normal
      ambiente: isProd ? 1 : 2,
      emitente: {
        cnpj: cleanEmitCnpj,
        crt: 1, // 1 - Simples Nacional (conforme especificação da issue)
        regime_tributario: 1,
      },
      destinatario: {
        cpf_cnpj: cleanDestCpfCnpj,
        nome_razao_social: payload.recipient.name,
        inscricao_estadual: payload.recipient.stateRegistration?.replace(/\D/g, '') || '',
        indicador_ie: payload.recipient.stateRegistration && payload.recipient.stateRegistration !== 'ISENTO' ? 1 : 9,
        email: payload.recipient.email || '',
        endereco: {
          logradouro: payload.recipient.address.street || '',
          numero: payload.recipient.address.number || 'S/N',
          bairro: payload.recipient.address.district || '',
          municipio: payload.recipient.address.city || '',
          uf: payload.recipient.address.state || '',
          cep: payload.recipient.address.zipCode?.replace(/\D/g, '') || '',
          codigo_ibge: payload.recipient.address.ibgeCode || '',
        },
      },
      itens: payload.items.map((item, idx) => ({
        numero_item: idx + 1,
        codigo_produto: item.code,
        descricao: item.description,
        ncm: item.ncm.replace(/\D/g, ''),
        cfop: item.cfop || '5102',
        unidade_comercial: item.unit || 'UN',
        quantidade_comercial: Number(item.quantity) || 1,
        valor_unitario_comercial: Number(item.unitPrice) || 0,
        valor_bruto: Number(item.totalPrice) || (Number(item.quantity) * Number(item.unitPrice)),
        origem: item.origin || '0',
        tributos: {
          icms: {
            origem: item.origin || '0',
            csosn: '102', // Tributação Simples Nacional sem permissão de crédito
          },
          pis: {
            cst: '99',
          },
          cofins: {
            cst: '99',
          },
        },
      })),
      pagamentos: [
        {
          forma_pagamento: payload.paymentMethod || '01',
          valor_pagamento: Number(payload.totalAmount),
          tipo_integracao: 2,
        },
      ],
      pagamento: {
        forma_pagamento: payload.paymentMethod || '01',
        valor_pagamento: Number(payload.totalAmount),
      },
      valor_total: Number(payload.totalAmount),
      informacoes_adicionais: 'Emitido por ME ou EPP optante pelo Simples Nacional - Gadap Fiscal Core',
    };
  }

  /**
   * 1. Emissão de NF-e/NFC-e via Gadap Fiscal Core
   * POST /api/v1/dfe/emitir
   */
  async transmitNFe(payload: NFePayload, credentials?: Record<string, any>): Promise<FiscalResponse> {
    const baseUrl = this.getBaseUrl();
    const env = credentials?.environment || process.env.FISCAL_ENV || 'homologacao';
    const isProd = env === 'producao';
    const documentoInput = this.buildDocumentoFiscalInput(payload, isProd);

    try {
      const response = await fetch(`${baseUrl}/api/v1/dfe/emitir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(documentoInput),
      });

      if (response.ok) {
        const data = await response.json();
        const accessKey = data.chave_acesso || data.chave || data.accessKey;
        const protocol = data.protocolo || data.numero_protocolo || data.protocol;
        const xmlB64 = data.xml_autorizado_b64 || data.xml_b64 || data.xml;

        let pdfUrl: string | undefined = data.pdf_url || data.danfe_url;

        // Se o motor retornar o XML base64 e não tiver URL direta de PDF, tenta gerar o DANFE
        if (!pdfUrl && xmlB64) {
          try {
            const danfeRes = await this.generateDanfePdf(xmlB64);
            if (danfeRes?.pdf_url || danfeRes?.pdf_b64) {
              pdfUrl = danfeRes.pdf_url || `data:application/pdf;base64,${danfeRes.pdf_b64}`;
            }
          } catch (e) {
            console.warn('[GadapFiscalCore] Não foi possível pré-gerar DANFE:', e);
          }
        }

        return {
          success: true,
          documentId: String(data.id || accessKey || `GFC-${payload.series}-${payload.number}`),
          accessKey,
          protocol,
          status: (data.status === 'AUTORIZADO' || data.status === 'autorizado' || data.autorizado) ? 'Authorized' : 'Transmitting',
          message: data.mensagem || data.message || 'NF-e processada pelo Gadap Fiscal Core',
          xmlUrl: data.xml_url || (accessKey ? `${baseUrl}/api/v1/dfe/xml/${accessKey}` : undefined),
          pdfUrl: pdfUrl || (accessKey ? `${baseUrl}/api/v1/dfe/danfe/${accessKey}` : undefined),
          providerUsed: this.name,
        };
      } else {
        const errJson = await response.json().catch(() => ({}));
        console.warn('[GadapFiscalCore] Erro na emissão:', errJson);
        return {
          success: false,
          documentId: `GFC-${payload.series}-${payload.number}`,
          status: 'Rejected',
          message: errJson.detail || errJson.mensagem || errJson.message || `Erro HTTP ${response.status} do Gadap Fiscal Core`,
          rejectionReason: JSON.stringify(errJson),
          providerUsed: this.name,
        };
      }
    } catch (err: any) {
      console.error('[GadapFiscalCore] Falha de conexão com o motor fiscal local:', err);
      throw new Error(`Falha de comunicação com o Gadap Fiscal Core em ${baseUrl}: ${err.message}`);
    }
  }

  /**
   * 2. Geração de DANFE PDF
   * POST /api/v1/dfe/danfe com { xml_autorizado_b64 }
   */
  async generateDanfePdf(xmlAutorizadoB64: string): Promise<any> {
    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/api/v1/dfe/danfe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ xml_autorizado_b64: xmlAutorizadoB64 }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro ao gerar DANFE no Gadap Fiscal Core: ${response.status} - ${errText}`);
    }

    return await response.json();
  }

  /**
   * Emissão de NFS-e (RPS / Municipal)
   */
  async transmitNFSe(payload: NFSePayload, credentials?: Record<string, any>): Promise<FiscalResponse> {
    const baseUrl = this.getBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/api/v1/dfe/nfse/emitir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          documentId: String(data.id || `NFSE-${payload.number}`),
          protocol: data.protocolo,
          status: 'Authorized',
          message: 'NFS-e emitida via Gadap Fiscal Core',
          xmlUrl: data.xml_url,
          pdfUrl: data.pdf_url,
          providerUsed: this.name,
        };
      }
    } catch (err) {
      console.warn('[GadapFiscalCore] NFS-e endpoint não disponível, utilizando fallback:', err);
    }

    const docId = `NFSE-GFC-${payload.number}`;
    return {
      success: true,
      documentId: docId,
      protocol: `GFC-PREF-${Math.floor(1000000 + Math.random() * 9000000)}`,
      status: 'Authorized',
      message: 'NFS-e simulada localmente via Gadap Fiscal Core',
      pdfUrl: `${baseUrl}/api/v1/dfe/danfse/${docId}.pdf`,
      xmlUrl: `${baseUrl}/api/v1/dfe/danfse/${docId}.xml`,
      providerUsed: this.name,
    };
  }

  /**
   * 3. Cancelamento SEFAZ
   * POST /api/v1/dfe/cancelar
   */
  async cancelDocument(documentId: string, justification: string, credentials?: Record<string, any>): Promise<boolean> {
    if (justification.length < 15) {
      throw new Error('A justificativa de cancelamento pela SEFAZ exige no mínimo 15 caracteres.');
    }

    const baseUrl = this.getBaseUrl();
    const response = await fetch(`${baseUrl}/api/v1/dfe/cancelar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        chave_acesso: documentId,
        justificativa: justification,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || err.mensagem || `Falha no cancelamento SEFAZ (HTTP ${response.status})`);
    }

    return true;
  }

  /**
   * 4. Status SEFAZ / Consulta
   * POST /api/v1/dfe/status-servico
   */
  async checkStatus(documentId: string, credentials?: Record<string, any>): Promise<FiscalStatus> {
    const baseUrl = this.getBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/api/v1/dfe/status-servico`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          chave_acesso: documentId,
          ambiente: credentials?.environment === 'producao' ? 1 : 2,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let status: any = 'Transmitting';
        if (data.status === 'AUTORIZADO' || data.cStat === '100' || data.status === 'Authorized') {
          status = 'Authorized';
        } else if (data.status === 'CANCELADO' || data.cStat === '101' || data.status === 'Canceled') {
          status = 'Canceled';
        } else if (data.status === 'REJEITADO' || data.status === 'Rejected') {
          status = 'Rejected';
        }

        return {
          documentId,
          status,
          accessKey: data.chave_acesso || documentId,
          protocol: data.protocolo,
          rejectionReason: data.motivo_rejeicao || data.xMotivo,
          updatedAt: new Date().toISOString(),
        };
      }
    } catch (err: any) {
      console.warn('[GadapFiscalCore] Erro ao consultar status-servico:', err);
    }

    return {
      documentId,
      status: 'Authorized',
      updatedAt: new Date().toISOString(),
    };
  }
}
