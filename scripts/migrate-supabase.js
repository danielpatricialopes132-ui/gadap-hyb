import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrateAndSeed() {
  await client.connect();
  console.log('Connected to Supabase PostgreSQL at aws-0-us-east-2!');

  // Create tables
  const createTablesSql = `
    CREATE TABLE IF NOT EXISTS companies (
      id VARCHAR(36) PRIMARY KEY,
      name TEXT NOT NULL,
      trade_name TEXT NOT NULL,
      cnpj VARCHAR(18) NOT NULL UNIQUE,
      ie VARCHAR(20) NOT NULL,
      im VARCHAR(20),
      tax_regime VARCHAR(30) NOT NULL,
      access_code VARCHAR(30) NOT NULL UNIQUE,
      status VARCHAR(20) DEFAULT 'active' NOT NULL,
      address JSONB NOT NULL,
      fiscal_settings JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entities (
      id VARCHAR(36) PRIMARY KEY,
      company_id VARCHAR(36) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      type VARCHAR(2) NOT NULL,
      role VARCHAR(20) NOT NULL,
      name TEXT NOT NULL,
      trade_name TEXT,
      document VARCHAR(18) NOT NULL,
      state_registration VARCHAR(20),
      municipal_registration VARCHAR(20),
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(30),
      address JSONB NOT NULL,
      fiscal_profile JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS catalog_items (
      id VARCHAR(36) PRIMARY KEY,
      company_id VARCHAR(36) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      type VARCHAR(10) NOT NULL,
      code VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      unit VARCHAR(10) NOT NULL,
      unit_price NUMERIC(12, 2) NOT NULL,
      cost_price NUMERIC(12, 2),
      barcode VARCHAR(50),
      ncm VARCHAR(10),
      cest VARCHAR(10),
      cfop VARCHAR(4),
      origin VARCHAR(1),
      lc116_item VARCHAR(10),
      iss_rate NUMERIC(5, 2),
      tax_code_municipal VARCHAR(20),
      status VARCHAR(20) DEFAULT 'active' NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fiscal_documents (
      id VARCHAR(50) PRIMARY KEY,
      company_id VARCHAR(36) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      type VARCHAR(10) NOT NULL,
      series INTEGER NOT NULL,
      number INTEGER NOT NULL,
      status VARCHAR(20) NOT NULL,
      entity_id VARCHAR(36) NOT NULL,
      entity_name TEXT NOT NULL,
      entity_document VARCHAR(18) NOT NULL,
      issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      total_amount NUMERIC(12, 2) NOT NULL,
      protocol VARCHAR(60),
      access_key VARCHAR(44),
      authorization_date TIMESTAMP WITH TIME ZONE,
      rejection_reason TEXT,
      items JSONB NOT NULL,
      xml_url TEXT,
      pdf_danfe_url TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_entities_company ON entities(company_id);
    CREATE INDEX IF NOT EXISTS idx_catalog_company ON catalog_items(company_id);
    CREATE INDEX IF NOT EXISTS idx_fiscal_company ON fiscal_documents(company_id);
  `;

  await client.query(createTablesSql);
  console.log('Tables created or verified in Supabase!');

  // Check if companies exist
  const res = await client.query('SELECT COUNT(*) FROM companies');
  const count = parseInt(res.rows[0].count);
  console.log(`Current companies in Supabase: ${count}`);

  if (count === 0) {
    console.log('Seeding initial multi-tenant companies, entities and catalog...');

    // Seed companies
    await client.query(`
      INSERT INTO companies (id, name, trade_name, cnpj, ie, im, tax_regime, access_code, address, fiscal_settings)
      VALUES 
      ('comp-matriz-01', 'GADAP LOGÍSTICA & DISTRIBUIÇÃO LTDA', 'GADAP Log Matriz', '45.182.903/0001-44', '109.827.364.110', '9845210', 'Lucro Presumido', 'GADAP-SP-9031',
        '{"street": "Av. das Nações Unidas", "number": "14401", "district": "Chácara Santo Antônio", "city": "São Paulo", "state": "SP", "zipCode": "04794-000"}',
        '{"environment": "homologacao", "certificateA1Installed": true, "nfeSeries": 1, "nfeCurrentNumber": 1042, "nfseSeries": 1, "nfseCurrentNumber": 520}'),
      
      ('comp-filial-02', 'GADAP TECNOLOGIA & SOFTWARES S.A.', 'GADAP Tech Cloud', '18.920.311/0001-89', 'Isento', '7823901', 'Simples Nacional', 'GADAP-TECH-2026',
        '{"street": "Rua Bela Cintra", "number": "980", "district": "Consolação", "city": "São Paulo", "state": "SP", "zipCode": "01415-000"}',
        '{"environment": "homologacao", "certificateA1Installed": true, "nfeSeries": 1, "nfeCurrentNumber": 184, "nfseSeries": 2, "nfseCurrentNumber": 890}'),

      ('comp-filial-03', 'AGRO GADAP GRAOS E FERTILIZANTES EIRELI', 'GADAP Agro Sul', '33.512.780/0001-05', '908.761.234.500', '201948', 'Lucro Real', 'GADAP-AGRO-7800',
        '{"street": "Rodovia BR-163", "number": "KM 118", "district": "Distrito Industrial", "city": "Rondonópolis", "state": "MT", "zipCode": "78700-000"}',
        '{"environment": "homologacao", "certificateA1Installed": false, "nfeSeries": 3, "nfeCurrentNumber": 2150, "nfseSeries": 1, "nfseCurrentNumber": 45}');
    `);

    // Seed entities
    await client.query(`
      INSERT INTO entities (id, company_id, type, role, name, trade_name, document, state_registration, email, phone, address, fiscal_profile)
      VALUES
      ('ent-01', 'comp-matriz-01', 'PJ', 'cliente', 'SUPERMERCADOS ALVORADA DE ALIMENTOS LTDA', 'Rede Alvorada', '12.345.678/0001-90', '112.233.445.566', 'fiscal@alvorada.com.br', '(11) 3450-8900',
        '{"street": "Avenida Paulista", "number": "1200", "district": "Bela Vista", "city": "São Paulo", "state": "SP", "zipCode": "01310-100"}',
        '{"indicadorIE": "1"}'),
      
      ('ent-02', 'comp-matriz-01', 'PJ', 'fornecedor', 'EMBALAGENS BRASIL INDUSTRIA E COMERCIO S.A.', 'Brasil Embalagens', '98.765.432/0001-10', '987.654.321.000', 'faturamento@brasilembalagens.ind.br', '(19) 3880-1122',
        '{"street": "Rua dos Eucaliptos", "number": "450", "district": "Distrito Industrial", "city": "Campinas", "state": "SP", "zipCode": "13083-852"}',
        '{"indicadorIE": "1"}'),

      ('ent-03', 'comp-filial-02', 'PJ', 'cliente', 'BANCO DIGITAL HORIZONTE S.A.', 'Horizonte Bank', '05.688.190/0001-32', 'Isento', 'contas@horizonte.bank', '(11) 4004-9988',
        '{"street": "Av. Brigadeiro Faria Lima", "number": "3477", "district": "Itaim Bibi", "city": "São Paulo", "state": "SP", "zipCode": "04538-132"}',
        '{"indicadorIE": "2"}');
    `);

    // Seed catalog
    await client.query(`
      INSERT INTO catalog_items (id, company_id, type, code, description, unit, unit_price, cost_price, barcode, ncm, cest, cfop, origin)
      VALUES
      ('cat-01', 'comp-matriz-01', 'product', 'PRD-PAL-001', 'Palete de Madeira Padrão PBR 1,00 x 1,20m Tratado', 'UN', 85.00, 52.00, '7891234567890', '4415.20.00', '10.001.00', '5102', '0'),
      ('cat-02', 'comp-matriz-01', 'product', 'PRD-STR-002', 'Filme Stretch Virgem 500x0,25mm Bobina 3,8kg', 'ROLO', 58.90, 34.00, '7891234567891', '3920.10.99', '10.012.00', '5405', '0');
    `);

    await client.query(`
      INSERT INTO catalog_items (id, company_id, type, code, description, unit, unit_price, lc116_item, iss_rate, tax_code_municipal)
      VALUES
      ('cat-03', 'comp-filial-02', 'service', 'SRV-API-001', 'Licença Mensal de API e Hub de Integração Fiscal Cloud', 'MES', 490.00, '01.07', 2.0, '02891'),
      ('cat-04', 'comp-filial-02', 'service', 'SRV-CSL-002', 'Consultoria de Arquitetura e Engenharia de Software Fiscal (Hora)', 'HR', 280.00, '01.06', 2.0, '02890');
    `);

    // Seed initial documents
    await client.query(`
      INSERT INTO fiscal_documents (id, company_id, type, series, number, status, entity_id, entity_name, entity_document, total_amount, protocol, access_key, items, xml_url, pdf_danfe_url)
      VALUES
      ('doc-01', 'comp-matriz-01', 'NFe', 1, 1041, 'Authorized', 'ent-01', 'SUPERMERCADOS ALVORADA DE ALIMENTOS LTDA', '12.345.678/0001-90', 1700.00, '135260089201940', '35261045182903000144550010000010411892019402',
        '[{"description": "Palete PBR", "quantity": 20, "unitPrice": 85.0, "total": 1700.0}]',
        'https://mock.fiscal.gadap.com.br/xml/35261045182903000144550010000010411892019402.xml',
        'https://mock.fiscal.gadap.com.br/danfe/35261045182903000144550010000010411892019402.pdf'),
      ('doc-02', 'comp-filial-02', 'NFSe', 2, 889, 'Authorized', 'ent-03', 'BANCO DIGITAL HORIZONTE S.A.', '05.688.190/0001-32', 980.00, 'NFSE-SP-2026-98124', NULL,
        '[{"description": "Licença Mensal API", "quantity": 2, "unitPrice": 490.0, "total": 980.0}]',
        NULL,
        'https://mock.fiscal.gadap.com.br/nfse/NFSE-2-889.pdf');
    `);

    console.log('✅ Seed completed successfully in Supabase!');
  }

  await client.end();
}

migrateAndSeed().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
