const { env } = require("./config/env");
const { DeviceClient } = require("./infrastructure/deviceClient");
const { OpenRouterClient } = require("./infrastructure/openRouterClient");
const { GeminiClient } = require("./infrastructure/geminiClient");
const { StateStore } = require("./infrastructure/stateStore");
const { CommandService } = require("./application/commandService");

function createCommandService() {
  const deviceClient = new DeviceClient({
    baseUrl: env.esp32BaseUrl,
    timeoutMs: env.esp32TimeoutMs,
    retries: env.esp32Retries
  });

  const openRouterClient = new OpenRouterClient({
    apiKey: env.openRouterApiKey,
    model: env.openRouterModel,
    chatModel: env.openRouterChatModel,
    timeoutMs: env.openRouterTimeoutMs,
    siteUrl: env.openRouterSiteUrl,
    siteName: env.openRouterSiteName
  });

  const geminiClient = new GeminiClient({
    apiKey: env.geminiApiKey,
    model: env.geminiModel,
    timeoutMs: env.geminiTimeoutMs
  });

  const stateStore = new StateStore();

  return new CommandService({
    deviceClient,
    stateStore,
    aiClients: {
      openrouter: openRouterClient,
      gemini: geminiClient
    },
    defaultAiProvider: env.aiProvider
  });
}

module.exports = { createCommandService };