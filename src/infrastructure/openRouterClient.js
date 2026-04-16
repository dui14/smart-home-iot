const { HttpError } = require("../shared/httpError");

class OpenRouterClient {
  constructor({ apiKey, model, chatModel, timeoutMs, siteUrl, siteName, fetchImpl }) {
    this.apiKey = apiKey;
    this.model = model;
    this.chatModel = chatModel || model;
    this.timeoutMs = timeoutMs;
    this.siteUrl = siteUrl;
    this.siteName = siteName;
    this.fetchImpl = fetchImpl || fetch;
  }

  async parseCommand({ text, context }) {
    const systemPrompt = [
      "You are an IoT command parser.",
      "Return JSON only, without markdown.",
      "Schema:",
      '{"device":"light|lock|ac|fan","room":"living|bedroom|main_door|\"\"","action":"on|off|open|close|lock|unlock"}',
      "If user asks unsupported action, choose the closest safe action."
    ].join("\n");

    const userPrompt = JSON.stringify({ text, context });
    try {
      const payload = await this.requestCompletion({
        model: this.resolveModel(context, this.model),
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });
      const content = this.normalizeContent(payload?.choices?.[0]?.message?.content);
      const parsed = this.extractJson(content);

      if (!parsed) {
        throw new HttpError(422, "ERR_AI_PARSE_FAILED", "AI response is not valid JSON command");
      }

      return parsed;
    } catch (error) {
      throw error;
    }
  }

  async planAssistant({ text, context, assistantName }) {
    const language = context?.language === "en-US" ? "en-US" : "vi-VN";
    const systemPrompt = [
      "You are a smart-home assistant planner.",
      "Return JSON only, without markdown.",
      "Always decide intent before acting.",
      "Schema:",
      '{"intent":"chat|device_control","assistant_text":"string","commands":[{"device":"light|lock|ac|fan","room":"living|bedroom|main_door|\"\"","action":"on|off|open|close|lock|unlock"}]}',
      "Rules:",
      "- If the user is greeting, small talk, or asks general questions, set intent=chat and commands=[].",
      "- If the user requests smart-home actions, set intent=device_control and include all commands in order.",
      "- For lock, room should be main_door.",
      "- For fan, room can be empty string.",
      "- assistant_text must be natural and concise.",
      `- User language is ${language}.`,
      "- If language is vi-VN, assistant_text must use proper Vietnamese diacritics.",
      "- Never strip Vietnamese diacritics."
    ].join("\n");

    const userPrompt = JSON.stringify({
      assistant_name: assistantName || "Tom",
      text,
      context
    });

    const payload = await this.requestCompletion({
      model: this.resolveModel(context, this.chatModel),
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    const content = this.normalizeContent(payload?.choices?.[0]?.message?.content);
    const parsed = this.extractJson(content);

    if (!parsed || typeof parsed !== "object") {
      throw new HttpError(422, "ERR_AI_PARSE_FAILED", "AI assistant planning response is invalid");
    }

    const commands = this.normalizeCommands(parsed);
    const intent = String(parsed.intent || "").trim().toLowerCase() === "device_control" && commands.length
      ? "device_control"
      : "chat";
    const assistantText = typeof parsed.assistant_text === "string" ? parsed.assistant_text.trim() : "";

    return {
      intent,
      assistant_text: assistantText,
      commands
    };
  }

  normalizeCommands(parsed) {
    let list = [];

    if (Array.isArray(parsed.commands)) {
      list = parsed.commands;
    } else if (parsed.command && typeof parsed.command === "object") {
      list = [parsed.command];
    }

    return list
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        device: String(item.device || "").trim().toLowerCase(),
        room: String(item.room || "").trim().toLowerCase(),
        action: String(item.action || "").trim().toLowerCase()
      }))
      .filter((item) => item.device && item.action);
  }

  resolveModel(context, fallbackModel) {
    const override = String(context?.ai_model || "").trim();
    return override || fallbackModel;
  }

  async requestCompletion({ model, temperature, messages }) {
    if (!this.apiKey) {
      throw new HttpError(500, "ERR_AI_MISSING_API_KEY", "OPENROUTER_API_KEY is not configured");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": this.siteUrl,
          "X-Title": this.siteName
        },
        body: JSON.stringify({
          model,
          temperature,
          messages
        })
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const errBody = await response.text();
        throw new HttpError(502, "ERR_AI_UPSTREAM", `OpenRouter error: ${errBody}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof HttpError) {
        throw error;
      }
      if (error.name === "AbortError") {
        throw new HttpError(504, "ERR_AI_TIMEOUT", "OpenRouter request timeout");
      }
      throw new HttpError(502, "ERR_AI_UPSTREAM", error.message);
    }
  }

  extractJson(content) {
    if (!content) {
      return null;
    }
    if (typeof content === "object") {
      return content;
    }
    const raw = String(content).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try {
      return JSON.parse(raw);
    } catch (_err) {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        return null;
      }
      try {
        return JSON.parse(match[0]);
      } catch (_secondErr) {
        return null;
      }
    }
  }

  normalizeContent(content) {
    if (Array.isArray(content)) {
      return content
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }
          if (item?.type === "text") {
            return item.text || "";
          }
          return "";
        })
        .join("\n");
    }
    return content;
  }
}

module.exports = { OpenRouterClient };