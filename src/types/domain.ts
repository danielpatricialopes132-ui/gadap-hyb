export type UserRole = 'Admin' | 'Financeiro' | 'Fiscal' | 'Operador';

export type TaxRegime = 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | 'MEI';

export interface Company {
  id: string;
  name: string;
  tradeName: string; // Nome fantasia
  cnpj: string;
  ie: string; // Inscrição Estadual
  im?: string; // Inscrição Municipal
  taxRegime: TaxRegime;
  accessCode: string; // Chave de acesso única da empresa
  status: 'active' | 'inactive';
  address: {
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    zipCode: string;
  };
  fiscalSettings: {
    provider?: 'focus_nfe' | 'fiscal_contora' | 'contora';
    environment: 'homologacao' | 'producao';
    certificateA1Installed: boolean;
    certificateExpiresAt?: string;
    nfeSeries: number;
    nfeCurrentNumber: number;
    nfseSeries: number;
    nfseCurrentNumber: number;
    defaultCNAE?: string;
    // Focus NFe credentials (Provedor Principal)
    focusNfeToken?: string;
    // Fiscal Contora credentials (Provedor Secundário/Alternativo)
    fiscalContoraApiKey?: string;
    fiscalContoraSecret?: string;
  };
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  activeCompanyId: string;
}

export type EntityType = 'PJ' | 'PF';
export type EntityRole = 'cliente' | 'fornecedor' | 'ambos';

export interface Entity {
  id: string;
  companyId: string; // Logical isolation
  type: EntityType;
  role: EntityRole;
  name: string; // Razão Social / Nome Completo
  tradeName?: string; // Nome Fantasia
  document: string; // CPF ou CNPJ
  stateRegistration?: string; // IE
  municipalRegistration?: string; // IM
  email: string;
  phone: string;
  address: {
    zipCode: string;
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
  };
  fiscalProfile?: {
    suframa?: string;
    indicadorIE: '1' | '2' | '9'; // 1: Contribuinte, 2: Isento, 9: Não Contribuinte
  };
  createdAt: string;
}

export type ItemType = 'product' | 'service';

export interface CatalogItem {
  id: string;
  companyId: string; // Logical isolation
  type: ItemType;
  code: string;
  description: string;
  unit: string; // UN, KG, HR, etc.
  unitPrice: number;
  costPrice?: number;
  barcode?: string;
  // Product specific fiscal
  ncm?: string;
  cest?: string;
  cfop?: string;
  origin?: '0' | '1' | '2'; // 0: Nacional, 1: Estrangeira direta, 2: Estrangeira adquirida internamente
  // Service specific fiscal
  lc116Item?: string; // ex: 01.07 Suporte técnico
  issRate?: number; // % ISS
  taxCodeMunicipal?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export type FiscalDocType = 'NFe' | 'NFSe';
export type FiscalDocStatus = 'Draft' | 'Transmitting' | 'Authorized' | 'Rejected' | 'Canceled';

export interface FiscalDocument {
  id: string;
  companyId: string; // Logical isolation
  type: FiscalDocType;
  series: number;
  number: number;
  status: FiscalDocStatus;
  entityId: string;
  entityName: string;
  entityDocument: string;
  issueDate: string;
  totalAmount: number;
  protocol?: string;
  accessKey?: string;
  authorizationDate?: string;
  rejectionReason?: string;
  items: Array<{
    itemId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    cfop?: string;
    ncm?: string;
  }>;
  xmlUrl?: string;
  pdfDanfeUrl?: string;
}
