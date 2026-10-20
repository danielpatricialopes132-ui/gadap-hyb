import { pgTable, text, timestamp, varchar, integer, decimal, boolean, jsonb } from 'drizzle-orm/pg-core';

/**
 * 1. Multi-Tenant Companies (Empresas e Filiais)
 */
export const companies = pgTable('companies', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: text('name').notNull(),
  tradeName: text('trade_name').notNull(),
  cnpj: varchar('cnpj', { length: 18 }).notNull().unique(),
  ie: varchar('ie', { length: 20 }).notNull(),
  im: varchar('im', { length: 20 }),
  taxRegime: varchar('tax_regime', { length: 30 }).notNull(), // 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | 'MEI'
  accessCode: varchar('access_code', { length: 30 }).notNull().unique(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  address: jsonb('address').notNull(), // { street, number, complement, district, city, state, zipCode }
  fiscalSettings: jsonb('fiscal_settings').notNull(), // { environment, certificateA1Installed, nfeSeries, nfeCurrentNumber, etc }
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 2. Unified Base Entities (Clientes & Fornecedores)
 * Strictly partitioned by company_id
 */
export const entities = pgTable('entities', {
  id: varchar('id', { length: 36 }).primaryKey(),
  companyId: varchar('company_id', { length: 36 })
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 2 }).notNull(), // 'PJ' | 'PF'
  role: varchar('role', { length: 20 }).notNull(), // 'cliente' | 'fornecedor' | 'ambos'
  name: text('name').notNull(),
  tradeName: text('trade_name'),
  document: varchar('document', { length: 18 }).notNull(), // CPF ou CNPJ
  stateRegistration: varchar('state_registration', { length: 20 }),
  municipalRegistration: varchar('municipal_registration', { length: 20 }),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 30 }),
  address: jsonb('address').notNull(),
  fiscalProfile: jsonb('fiscal_profile'), // { indicadorIE, suframa }
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 3. Unified Catalog (Produtos & Serviços)
 * Partitioned by company_id
 */
export const catalogItems = pgTable('catalog_items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  companyId: varchar('company_id', { length: 36 })
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 10 }).notNull(), // 'product' | 'service'
  code: varchar('code', { length: 50 }).notNull(),
  description: text('description').notNull(),
  unit: varchar('unit', { length: 10 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  costPrice: decimal('cost_price', { precision: 12, scale: 2 }),
  barcode: varchar('barcode', { length: 50 }),
  // Product Fiscal
  ncm: varchar('ncm', { length: 10 }),
  cest: varchar('cest', { length: 10 }),
  cfop: varchar('cfop', { length: 4 }),
  origin: varchar('origin', { length: 1 }),
  // Service Fiscal
  lc116Item: varchar('lc116_item', { length: 10 }),
  issRate: decimal('iss_rate', { precision: 5, scale: 2 }),
  taxCodeMunicipal: varchar('tax_code_municipal', { length: 20 }),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * 4. Fiscal Documents (NF-e & NFS-e)
 * Partitioned by company_id
 */
export const fiscalDocuments = pgTable('fiscal_documents', {
  id: varchar('id', { length: 50 }).primaryKey(),
  companyId: varchar('company_id', { length: 36 })
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 10 }).notNull(), // 'NFe' | 'NFSe'
  series: integer('series').notNull(),
  number: integer('number').notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'Draft' | 'Transmitting' | 'Authorized' | 'Rejected' | 'Canceled'
  entityId: varchar('entity_id', { length: 36 }).notNull(),
  entityName: text('entity_name').notNull(),
  entityDocument: varchar('entity_document', { length: 18 }).notNull(),
  issueDate: timestamp('issue_date').defaultNow().notNull(),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  protocol: varchar('protocol', { length: 60 }),
  accessKey: varchar('access_key', { length: 44 }),
  authorizationDate: timestamp('authorization_date'),
  rejectionReason: text('rejection_reason'),
  items: jsonb('items').notNull(),
  xmlUrl: text('xml_url'),
  pdfDanfeUrl: text('pdf_danfe_url'),
});
