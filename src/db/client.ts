import pg from 'pg';

const { Pool } = pg;

// Global singleton pool for Next.js to prevent connection exhaustion in serverless/dev
declare global {
  var _pgPool: pg.Pool | undefined;
}

const pool =
  global._pgPool ||
  new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres.bpmmxoqodwyukzgvoghc:0LBaeByB0OT5WEE2@aws-0-us-east-2.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') {
  global._pgPool = pool;
}

export default pool;
