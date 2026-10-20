import { NextResponse } from 'next/server';
import pool from '@/db/client';

export async function GET() {
  try {
    const [companiesRes, entitiesRes, catalogRes, docsRes] = await Promise.all([
      pool.query('SELECT * FROM companies ORDER BY name ASC'),
      pool.query('SELECT * FROM entities ORDER BY created_at DESC'),
      pool.query('SELECT * FROM catalog_items ORDER BY created_at DESC'),
      pool.query('SELECT * FROM fiscal_documents ORDER BY issue_date DESC'),
    ]);

    const formattedCompanies = companiesRes.rows.map((r) => ({
      id: r.id,
      name: r.name,
      tradeName: r.trade_name,
      cnpj: r.cnpj,
      ie: r.ie,
      im: r.im,
      taxRegime: r.tax_regime,
      accessCode: r.access_code,
      status: r.status,
      address: r.address,
      fiscalSettings: r.fiscal_settings,
    }));

    const formattedEntities = entitiesRes.rows.map((r) => ({
      id: r.id,
      companyId: r.company_id,
      type: r.type,
      role: r.role,
      name: r.name,
      tradeName: r.trade_name,
      document: r.document,
      stateRegistration: r.state_registration,
      municipalRegistration: r.municipal_registration,
      email: r.email,
      phone: r.phone,
      address: r.address,
      fiscalProfile: r.fiscal_profile,
      createdAt: r.created_at,
    }));

    const formattedCatalog = catalogRes.rows.map((r) => ({
      id: r.id,
      companyId: r.company_id,
      type: r.type,
      code: r.code,
      description: r.description,
      unit: r.unit,
      unitPrice: parseFloat(r.unit_price),
      costPrice: r.cost_price ? parseFloat(r.cost_price) : undefined,
      barcode: r.barcode,
      ncm: r.ncm,
      cest: r.cest,
      cfop: r.cfop,
      origin: r.origin,
      lc116Item: r.lc116_item,
      issRate: r.iss_rate ? parseFloat(r.iss_rate) : undefined,
      taxCodeMunicipal: r.tax_code_municipal,
      status: r.status,
      createdAt: r.created_at,
    }));

    const formattedDocs = docsRes.rows.map((r) => ({
      id: r.id,
      companyId: r.company_id,
      type: r.type,
      series: r.series,
      number: r.number,
      status: r.status,
      entityId: r.entity_id,
      entityName: r.entity_name,
      entityDocument: r.entity_document,
      issueDate: r.issue_date,
      totalAmount: parseFloat(r.total_amount),
      protocol: r.protocol,
      accessKey: r.access_key,
      authorizationDate: r.authorization_date,
      rejectionReason: r.rejection_reason,
      items: r.items,
      xmlUrl: r.xml_url,
      pdfDanfeUrl: r.pdf_danfe_url,
    }));

    return NextResponse.json({
      success: true,
      companies: formattedCompanies,
      entities: formattedEntities,
      catalog: formattedCatalog,
      documents: formattedDocs,
    });
  } catch (error: any) {
    console.error('API /api/bootstrap error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
