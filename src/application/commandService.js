const { validateCommand } = require("../domain/deviceCatalog");
const { parseTextCommandLocally } = require("../domain/localCommandParser");
const { HttpError } = require("../shared/httpError");

class CommandService {
  constructor({ deviceClient, aiClient, aiClients, stateStore, defaultAiProvider }) {
    this.deviceClient = deviceClient;
    this.aiClients = aiClients || {};
    if (aiClient) {
      if (!this.aiClients.openrouter) {
        this.aiClients.openrouter = aiClient;
      }
      if (!this.aiClients.gemini) {
        this.aiClients.gemini = aiClient;
      }
    }
    this.defaultAiProvider = this.normalizeProvider(defaultAiProvider);
    this.stateStore = stateStore;
  }

  async control(payload) {
    const validation = validateCommand(payload);
    if (!validation.ok) {
      throw new HttpError(400, validation.code, validation.message);
    }

    const command = validation.value;
    await this.deviceClient.controlDevice(command);
    const state = this.stateStore.applyCommand(command);

    return {
      command,
      state
    };
  }

  async aiParse(payload) {
    const context = payload.context || {};
    const text = String(payload.text || "").trim();
    const parseResult = await this.parseCommandWithFallback({ text, context });

    if (!parseResult.parsed) {
      throw new HttpError(422, "ERR_AI_PARSE_FAILED", "Cannot parse command from text");
    }

    const validation = validateCommand(parseResult.parsed);

    return {
      inputText: text,
      parsed: parseResult.parsed,
      command: validation.ok ? validation.value : null,
      validation,
      confidence: parseResult.confidence,
      parser: parseResult.parser,
      requiresConfirmation: !validation.ok || parseResult.confidence < 0.7
    };
  }

  async aiControl(payload) {
    const parseResult = await this.aiParse(payload);

    if (!parseResult.validation.ok) {
      throw new HttpError(422, parseResult.validation.code, parseResult.validation.message, [
        {
          source: parseResult.parser,
          parsed: parseResult.parsed
        }
      ]);
    }

    const command = parseResult.command;
    await this.deviceClient.controlDevice(command);
    const state = this.stateStore.applyCommand(command);

    return {
      inputText: parseResult.inputText,
      parsed: parseResult.parsed,
      confidence: parseResult.confidence,
      parser: parseResult.parser,
      requiresConfirmation: parseResult.requiresConfirmation,
      command,
      state
    };
  }

  async aiAssistant(payload) {
    const context = payload.context || {};
    const text = String(payload.text || "").trim();
    const assistantName = String(context.assistant_name || "Tom").trim() || "Tom";
    const language = this.normalizeLanguage(context.language);

    const plan = await this.planAssistant({
      text,
      context,
      assistantName,
      language
    });

    if (plan.intent === "chat") {
      return {
        intent: "chat",
        assistantText: plan.assistantText || this.buildFallbackChatReply({ assistantName, language }),
        executionStatus: "chat_only",
        commands: [],
        parser: plan.parser,
        state: this.stateStore.getState()
      };
    }

    if (!plan.commands.length) {
      return {
        intent: "chat",
        assistantText: plan.assistantText || this.buildFallbackChatReply({ assistantName, language }),
        executionStatus: "chat_only",
        commands: [],
        parser: plan.parser,
        state: this.stateStore.getState()
      };
    }

    const validatedCommands = [];
    for (const rawCommand of plan.commands) {
      const validation = validateCommand(rawCommand);
      if (!validation.ok) {
        return {
          intent: "device_control",
          assistantText: language === "en-US"
            ? "I understood your request but I need clearer device details before executing."
            : "Tôi đã hiểu yêu cầu nhưng cần thêm thông tin thiết bị rõ ràng trước khi thực thi.",
          executionStatus: "needs_clarification",
          commands: [],
          parser: plan.parser,
          errorCode: validation.code,
          state: this.stateStore.getState()
        };
      }
      validatedCommands.push(validation.value);
    }

    try {
      for (const command of validatedCommands) {
        await this.deviceClient.controlDevice(command);
        this.stateStore.applyCommand(command);
      }

      return {
        intent: "device_control",
        assistantText: this.buildSuccessReply({ commands: validatedCommands, language }),
        executionStatus: "success",
        commands: validatedCommands,
        parser: plan.parser,
        state: this.stateStore.getState()
      };
    } catch (error) {
      if (error instanceof HttpError && (error.code === "ERR_DEVICE_UNREACHABLE" || error.code === "ERR_DEVICE_TIMEOUT")) {
        return {
          intent: "device_control",
          assistantText: this.buildDeviceUnavailableReply({ language }),
          executionStatus: "failed",
          commands: validatedCommands,
          parser: plan.parser,
          errorCode: error.code,
          state: this.stateStore.getState()
        };
      }
      throw error;
    }
  }

  async planAssistant({ text, context, assistantName, language }) {
    try {
      const { client } = this.resolveAiClient(context);
      const planned = await client.planAssistant({
        text,
        context: {
          ...context,
          language
        },
        assistantName
      });
      const commands = this.normalizePlannedCommands(planned.commands, context);
      if (planned.intent === "device_control" && commands.length) {
        return {
          intent: "device_control",
          commands,
          assistantText: planned.assistant_text || "",
          parser: "llm"
        };
      }
      return {
        intent: "chat",
        commands: [],
        assistantText: planned.assistant_text || "",
        parser: "llm"
      };
    } catch (_error) {
      const localCommands = this.parseLocalCommands(text, context);
      if (localCommands.length) {
        return {
          intent: "device_control",
          commands: localCommands,
          assistantText: "",
          parser: "local"
        };
      }
      return {
        intent: "chat",
        commands: [],
        assistantText: "",
        parser: "local"
      };
    }
  }

  async parseCommandWithFallback({ text, context }) {
    try {
      const { client } = this.resolveAiClient(context);
      const parsed = await client.parseCommand({
        text,
        context
      });
      return {
        parsed,
        confidence: 0.9,
        parser: "llm"
      };
    } catch (_err) {
      const parsed = parseTextCommandLocally(text, context);
      return {
        parsed,
        confidence: parsed ? 0.6 : 0,
        parser: "local"
      };
    }
  }

  normalizePlannedCommands(commands, context) {
    const preferredRoom = String(context?.preferred_room || "living").trim().toLowerCase() || "living";
    return (Array.isArray(commands) ? commands : [])
      .map((item) => ({
        device: String(item.device || "").trim().toLowerCase(),
        room: String(item.room || "").trim().toLowerCase(),
        action: String(item.action || "").trim().toLowerCase()
      }))
      .filter((item) => item.device && item.action)
      .map((item) => {
        if (!item.room && (item.device === "light" || item.device === "ac")) {
          return {
            ...item,
            room: preferredRoom
          };
        }
        return item;
      });
  }

  parseLocalCommands(text, context) {
    const preferredRoom = String(context?.preferred_room || "living").trim().toLowerCase() || "living";
    const normalizedText = String(text || "").replace(/[;,]/g, " va ");
    const segments = normalizedText
      .split(/\b(?:va|và|and|then|roi|rồi)\b/gi)
      .map((item) => item.trim())
      .filter(Boolean);

    const result = [];
    const seen = new Set();

    for (const segment of segments) {
      const parsed = parseTextCommandLocally(segment, {
        ...context,
        preferred_room: preferredRoom
      });
      if (!parsed) {
        continue;
      }
      const key = `${parsed.device}|${parsed.room}|${parsed.action}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      result.push(parsed);
    }

    if (!result.length) {
      const parsed = parseTextCommandLocally(normalizedText, {
        ...context,
        preferred_room: preferredRoom
      });
      if (parsed) {
        return [parsed];
      }
    }

    return result;
  }

  buildFallbackChatReply({ assistantName, language }) {
    if (language === "en-US") {
      return `I am ${assistantName}, your smart-home assistant. I can chat and help control lights, fan, AC, and door lock.`;
    }
    return `Tôi là ${assistantName}, trợ lý smart-home của bạn. Tôi có thể trò chuyện và hỗ trợ điều khiển đèn, quạt, máy lạnh và khóa cửa.`;
  }

  buildSuccessReply({ commands, language }) {
    const details = commands.map((command) => this.describeCommand(command, language)).join(", ");
    if (language === "en-US") {
      return `Done. I completed: ${details}.`;
    }
    return `Tôi đã hoàn thành: ${details}.`;
  }

  buildDeviceUnavailableReply({ language }) {
    if (language === "en-US") {
      return "I understood your command, but I cannot reach ESP32 right now. Please check the device connection and try again.";
    }
    return "Tôi đã hiểu lệnh, nhưng hiện tại không kết nối được ESP32. Bạn hãy kiểm tra kết nối thiết bị và thử lại.";
  }

  describeCommand(command, language) {
    const isEnglish = language === "en-US";
    const actionMap = isEnglish
      ? {
          on: "turn on",
          off: "turn off",
          open: "open",
          close: "close"
        }
      : {
          on: "bật",
          off: "tắt",
          open: "mở",
          close: "đóng"
        };
    const roomMap = isEnglish
      ? {
          living: "living room",
          bedroom: "bedroom",
          main_door: "main door"
        }
      : {
          living: "phòng khách",
          bedroom: "phòng ngủ",
          main_door: "cửa chính"
        };
    const deviceMap = isEnglish
      ? {
          light: "light",
          fan: "fan",
          ac: "air conditioner",
          lock: "door lock"
        }
      : {
          light: "đèn",
          fan: "quạt",
          ac: "máy lạnh",
          lock: "khóa cửa"
        };

    const actionText = actionMap[command.action] || command.action;
    const deviceText = deviceMap[command.device] || command.device;
    const roomText = command.room ? ` ${roomMap[command.room] || command.room}` : "";
    return `${actionText} ${deviceText}${roomText}`.trim();
  }

  normalizeLanguage(language) {
    return language === "en-US" ? "en-US" : "vi-VN";
  }

  normalizeProvider(provider) {
    const raw = String(provider || "").trim().toLowerCase();
    if (!raw) {
      return "openrouter";
    }
    if (raw.includes("gemini") || raw === "google") {
      return "gemini";
    }
    if (raw.includes("openrouter") || raw.includes("open_router")) {
      return "openrouter";
    }
    return "openrouter";
  }

  resolveAiClient(context) {
    const requestedProvider = this.normalizeProvider(context?.ai_provider);
    const candidateProviders = [requestedProvider, this.defaultAiProvider, "openrouter", "gemini"];

    for (const provider of candidateProviders) {
      const client = this.aiClients[provider];
      if (client) {
        return { client, provider };
      }
    }

    throw new HttpError(500, "ERR_INTERNAL", "No AI client is configured");
  }

  async getStatus({ includeSensor }) {
    if (includeSensor) {
      try {
        const sensorRes = await this.deviceClient.fetchSensor();
        if (sensorRes?.data) {
          this.stateStore.updateSensor(sensorRes.data);
        }
      } catch (_err) {
      }
    }
    return this.stateStore.getState();
  }
}

module.exports = { CommandService };