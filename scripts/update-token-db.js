import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const token = process.env.FOCUS_NFE_TOKEN;

async function syncFocusTokenToDb() {
  const rawUrl = (process.env.DATABASE_URL || '').split('?')[0];
  const client = new Client({
    connectionString: rawUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to Supabase PostgreSQL');

  // Update all companies with Focus NFe as default provider and the production token
  await client.query(`
    UPDATE companies
    SET fiscal_settings = jsonb_set(
      jsonb_set(fiscal_settings, '{provider}', '"focus_nfe"'),
      '{focusNfeToken}',
      $1
    )
  `, [JSON.stringify(token)]);

  console.log('✅ Focus NFe production token injected into Supabase companies!');
  await client.end();
}

syncFocusTokenToDb().catch(console.error);
