const { env } = require("./config/env");
const { createApp } = require("./app");
const { createCommandService } = require("./bootstrap");
const { verifyDbConnection } = require("./infrastructure/postgresClient");

async function verifyEsp32Connection() {
  const target = `${env.esp32BaseUrl.replace(/\/$/, "")}/sensor`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.esp32TimeoutMs);

  try {
    const response = await fetch(target, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json"
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[ESP32] Connected URL but bad response ${response.status} at ${target}`);
      return;
    }

    const body = await response.json().catch(() => null);
    const temp = body?.data?.dht22?.temperature;
    if (typeof temp === "number" && Number.isFinite(temp)) {
      console.log(`[ESP32] Connected at ${target} | temperature=${temp}`);
      return;
    }

    console.log(`[ESP32] Connected at ${target}`);
  } catch (error) {
    clearTimeout(timeout);
    console.warn(`[ESP32] Not reachable at ${target} | ${error.message}`);
  }
}

async function startServer() {
  const commandService = createCommandService();
  const app = createApp({ commandService });

  app.listen(env.port, () => {
    console.log(`Smart-home API listening on http://localhost:${env.port}`);
  });

  try {
    const info = await verifyDbConnection();
    console.log(`[DB] PostgreSQL connected at ${info.now}`);
  } catch (error) {
    console.warn(`[DB] PostgreSQL connection failed: ${error.message}`);
  }

  await verifyEsp32Connection();
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});