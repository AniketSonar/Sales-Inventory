const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.bxdtkurbcpjfnyzjfyfn:FarazTam%407741@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

pool.on('connect', () => {
  console.log('Connected to live Supabase PostgreSQL database!');
});

pool.on('error', (err) => {
  console.error('Unexpected Supabase connection error:', err);
});

// Helper functions compatible with controllers
const allAsync = async (sql, params = []) => {
  // Convert ? to $1, $2, ... for postgres
  let idx = 1;
  const pgSql = sql.replace(/\?/g, () => `$${idx++}`);
  const result = await pool.query(pgSql, params);
  return result.rows;
};

const getAsync = async (sql, params = []) => {
  const rows = await allAsync(sql, params);
  return rows[0] || null;
};

const runAsync = async (sql, params = []) => {
  let idx = 1;
  const pgSql = sql.replace(/\?/g, () => `$${idx++}`);
  const result = await pool.query(pgSql, params);
  return { rowCount: result.rowCount };
};

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  allAsync,
  getAsync,
  runAsync
};
