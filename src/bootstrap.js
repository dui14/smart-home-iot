const { env } = require("./config/env");
const { DeviceClient } = require("./infrastructure/deviceClient");
const { OpenRouterClient } = require("./infrastructure/openRouterClient");
const { StateStore } = require("./infrastructure/stateStore");
const { CommandService } = require("./application/commandService");

function createCommandService() {
  const deviceClient = new DeviceClient({
    baseUrl: env.esp32BaseUrl,
    timeoutMs: env.esp32TimeoutMs,
    retries: env.esp32Retries
  });

  const aiClient = new OpenRouterClient({
    apiKey: env.openRouterApiKey,
    model: env.openRouterModel,
    timeoutMs: env.openRouterTimeoutMs,
    siteUrl: env.openRouterSiteUrl,
    siteName: env.openRouterSiteName
  });

  const stateStore = new StateStore();

  return new CommandService({
    deviceClient,
    aiClient,
    stateStore
  });
}

module.exports = { createCommandService };