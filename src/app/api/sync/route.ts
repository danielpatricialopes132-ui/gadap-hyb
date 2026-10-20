import { NextResponse } from 'next/server';
import pool from '@/db/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, table, data, id } = body;

    if (action === 'create' && table === 'entities') {
      const res = await pool.query(
        `INSERT INTO entities (id, company_id, type, role, name, trade_name, document, state_registration, municipal_registration, email, phone, address, fiscal_profile)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          data.id,
          data.companyId,
          data.type,
          data.role,
          data.name,
          data.tradeName || null,
          data.document,
          data.stateRegistration || null,
          data.municipalRegistration || null,
          data.email,
          data.phone || null,
          JSON.stringify(data.address),
          JSON.stringify(data.fiscalProfile || {}),
        ]
      );
      return NextResponse.json({ success: true, record: res.rows[0] });
    }

    if (action === 'create' && table === 'catalog_items') {
      const res = await pool.query(
        `INSERT INTO catalog_items (id, company_id, type, code, description, unit, unit_price, cost_price, barcode, ncm, cest, cfop, origin, lc116_item, iss_rate, tax_code_municipal, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         RETURNING *`,
        [
          data.id,
          data.companyId,
          data.type,
          data.code,
          data.description,
          data.unit,
          data.unitPrice,
          data.costPrice || null,
          data.barcode || null,
          data.ncm || null,
          data.cest || null,
          data.cfop || null,
          data.origin || null,
          data.lc116Item || null,
          data.issRate || null,
          data.taxCodeMunicipal || null,
          data.status || 'active',
        ]
      );
      return NextResponse.json({ success: true, record: res.rows[0] });
    }

    if (action === 'create' && table === 'fiscal_documents') {
      const res = await pool.query(
        `INSERT INTO fiscal_documents (id, company_id, type, series, number, status, entity_id, entity_name, entity_document, total_amount, protocol, access_key, items, xml_url, pdf_danfe_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING *`,
        [
          data.id,
          data.companyId,
          data.type,
          data.series,
          data.number,
          data.status,
          data.entityId,
          data.entityName,
          data.entityDocument,
          data.totalAmount,
          data.protocol || null,
          data.accessKey || null,
          JSON.stringify(data.items),
          data.xmlUrl || null,
          data.pdfDanfeUrl || null,
        ]
      );

      // Also increment sequence on company
      if (data.type === 'NFe') {
        await pool.query(
          `UPDATE companies SET fiscal_settings = jsonb_set(fiscal_settings, '{nfeCurrentNumber}', $1) WHERE id = $2`,
          [data.number.toString(), data.companyId]
        );
      } else {
        await pool.query(
          `UPDATE companies SET fiscal_settings = jsonb_set(fiscal_settings, '{nfseCurrentNumber}', $1) WHERE id = $2`,
          [data.number.toString(), data.companyId]
        );
      }

      return NextResponse.json({ success: true, record: res.rows[0] });
    }

    if (action === 'cancel' && table === 'fiscal_documents') {
      await pool.query(
        `UPDATE fiscal_documents SET status = 'Canceled', rejection_reason = $1 WHERE id = $2`,
        [data.justification, id]
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Invalid action/table' }, { status: 400 });
  } catch (error: any) {
    console.error('API /api/sync error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
