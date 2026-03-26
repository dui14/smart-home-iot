const { Pool } = require("pg");
const { env } = require("../config/env");

function createPoolConfig() {
  if (env.databaseUrl) {
    return {
      connectionString: env.databaseUrl,
      max: env.dbMaxPool,
      idleTimeoutMillis: env.dbIdleTimeoutMs,
      ssl: env.dbSsl ? { rejectUnauthorized: false } : false
    };
  }

  return {
    host: env.dbHost,
    port: env.dbPort,
    database: env.dbName,
    user: env.dbUser,
    password: env.dbPassword,
    max: env.dbMaxPool,
    idleTimeoutMillis: env.dbIdleTimeoutMs,
    ssl: env.dbSsl ? { rejectUnauthorized: false } : false
  };
}

let pool = null;

function getPgPool() {
  if (!pool) {
    pool = new Pool(createPoolConfig());
  }
  return pool;
}

async function verifyDbConnection() {
  const instance = getPgPool();
  const result = await instance.query("SELECT NOW() AS now");
  return result.rows[0];
}

module.exports = { getPgPool, verifyDbConnection };
