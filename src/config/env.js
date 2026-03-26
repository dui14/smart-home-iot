const dotenv = require("dotenv");

dotenv.config();

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const env = {
  port: toNumber(process.env.PORT, 3000),
  esp32BaseUrl: process.env.ESP32_BASE_URL || "http://127.0.0.1:8080",
  esp32TimeoutMs: toNumber(process.env.ESP32_TIMEOUT_MS, 1500),
  esp32Retries: toNumber(process.env.ESP32_RETRIES, 2),
  dbHost: process.env.DB_HOST || "127.0.0.1",
  dbPort: toNumber(process.env.DB_PORT, 5432),
  dbName: process.env.DB_NAME || "smarthome",
  dbUser: process.env.DB_USER || "postgres",
  dbPassword: process.env.DB_PASSWORD || "",
  dbSsl: String(process.env.DB_SSL || "false").toLowerCase() === "true",
  dbMaxPool: toNumber(process.env.DB_MAX_POOL, 10),
  dbIdleTimeoutMs: toNumber(process.env.DB_IDLE_TIMEOUT_MS, 30000),
  databaseUrl: process.env.DATABASE_URL || "",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openRouterModel: process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat-v3-0324:free",
  openRouterTimeoutMs: toNumber(process.env.OPENROUTER_TIMEOUT_MS, 8000),
  openRouterSiteUrl: process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
  openRouterSiteName: process.env.OPENROUTER_SITE_NAME || "SmartHomeVoiceControl"
};

module.exports = { env };