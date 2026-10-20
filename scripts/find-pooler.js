import pg from 'pg';
const { Client } = pg;

const regions = [
  'sa-east-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-central-1',
  'ap-southeast-1'
];

const pass = '0LBaeByB0OT5WEE2';
const ref = 'bpmmxoqodwyukzgvoghc';

async function findPooler() {
  for (const reg of regions) {
    const host = `aws-0-${reg}.pooler.supabase.com`;
    const conn = `postgresql://postgres.${ref}:${pass}@${host}:5432/postgres`;
    console.log(`Checking ${reg}...`);
    const client = new Client({
      connectionString: conn,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3500,
    });
    try {
      await client.connect();
      console.log(`\n🎉 FOUND REGION: ${reg} (port 5432)!`);
      const res = await client.query('SELECT current_database(), version();');
      console.log('PostgreSQL version:', res.rows[0]);
      await client.end();
      return { region: reg, port: 5432 };
    } catch (err) {
      if (err.message.includes('password authentication failed')) {
        console.log(`\n🎉 FOUND REGION: ${reg}! But password mismatch:`, err.message);
        return { region: reg, passError: true };
      }
      try { await client.end(); } catch (e) {}
    }

    // Try port 6543 (transaction pooler)
    const connPooler = `postgresql://postgres.${ref}:${pass}@${host}:6543/postgres`;
    const clientPooler = new Client({
      connectionString: connPooler,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3500,
    });
    try {
      await clientPooler.connect();
      console.log(`\n🎉 FOUND REGION: ${reg} (port 6543 pooler)!`);
      const res = await clientPooler.query('SELECT current_database();');
      console.log('Connected:', res.rows[0]);
      await clientPooler.end();
      return { region: reg, port: 6543 };
    } catch (err) {
      if (err.message.includes('password authentication failed')) {
        console.log(`\n🎉 FOUND REGION: ${reg}! But password mismatch:`, err.message);
        return { region: reg, passError: true };
      }
      try { await clientPooler.end(); } catch (e) {}
    }
  }
  console.log('No matching pooler region found in standard list.');
}

findPooler();
