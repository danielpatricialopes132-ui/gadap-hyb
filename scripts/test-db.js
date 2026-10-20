import pg from 'pg';
const { Client } = pg;

const passwords = [
  '0LBaeByB0OT5WEE2',
  encodeURIComponent('0LBaeByB0OT5WEE2')
];

const connectionStrings = [
  `postgresql://postgres:${passwords[0]}@db.bpmmxoqodwyukzgvoghc.supabase.co:5432/postgres`,
  `postgresql://postgres:${passwords[1]}@db.bpmmxoqodwyukzgvoghc.supabase.co:5432/postgres`,
  `postgresql://postgres.bpmmxoqodwyukzgvoghc:${passwords[0]}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.bpmmxoqodwyukzgvoghc:${passwords[0]}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
];

async function testConnections() {
  for (const conn of connectionStrings) {
    console.log('Testing connection to:', conn.replace(/:[^:]*@/, ':****@'));
    const client = new Client({
      connectionString: conn,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    try {
      await client.connect();
      console.log('SUCCESS! Connected to Supabase PostgreSQL!');
      const res = await client.query('SELECT current_database(), now();');
      console.log('Query result:', res.rows[0]);
      await client.end();
      return conn;
    } catch (err) {
      console.log('Connection failed:', err.message);
      try { await client.end(); } catch (e) {}
    }
  }
}

testConnections();
