const { HttpError } = require("../shared/httpError");

class GeminiClient {
  constructor({ apiKey, model, timeoutMs, fetchImpl }) {
    this.apiKey = apiKey;
    this.model = model || "gemini-3-flash";
    this.timeoutMs = timeoutMs || 10000;
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
    const payload = await this.requestGenerateContent({
      model: this.resolveModel(context, this.model),
      temperature: 0,
      systemPrompt,
      userPrompt
    });

    const content = this.normalizeText(payload);
    const parsed = this.extractJson(content);

    if (!parsed) {
      throw new HttpError(422, "ERR_AI_PARSE_FAILED", "AI response is not valid JSON command");
    }

    return parsed;
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

    const payload = await this.requestGenerateContent({
      model: this.resolveModel(context, this.model),
      temperature: 0.2,
      systemPrompt,
      userPrompt
    });

    const content = this.normalizeText(payload);
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

  resolveModelCandidates(model) {
    const normalized = String(model || "").trim();
    const candidates = [normalized];

    if (normalized === "gemini-3-flash") {
      candidates.push("gemini-3-flash-preview");
    }
    if (normalized === "models/gemini-3-flash") {
      candidates.push("models/gemini-3-flash-preview");
    }

    return Array.from(new Set(candidates.filter(Boolean)));
  }

  async requestGenerateContent({ model, temperature, systemPrompt, userPrompt }) {
    if (!this.apiKey) {
      throw new HttpError(500, "ERR_AI_MISSING_API_KEY", "GEMINI_API_KEY is not configured");
    }

    const candidates = this.resolveModelCandidates(model);
    let lastUpstreamError = "";

    for (let i = 0; i < candidates.length; i += 1) {
      const currentModel = candidates[i];
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await this.fetchImpl(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(currentModel)}:generateContent?key=${this.apiKey}`,
          {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              systemInstruction: {
                role: "system",
                parts: [{ text: systemPrompt }]
              },
              generationConfig: {
                temperature
              },
              contents: [
                {
                  role: "user",
                  parts: [{ text: userPrompt }]
                }
              ]
            })
          }
        );
        clearTimeout(timeout);

        if (!response.ok) {
          const errBody = await response.text();
          lastUpstreamError = errBody;
          if (response.status === 404 && i < candidates.length - 1) {
            continue;
          }
          throw new HttpError(502, "ERR_AI_UPSTREAM", `Gemini error: ${errBody}`);
        }

        return await response.json();
      } catch (error) {
        clearTimeout(timeout);
        if (error instanceof HttpError) {
          throw error;
        }
        if (error.name === "AbortError") {
          throw new HttpError(504, "ERR_AI_TIMEOUT", "Gemini request timeout");
        }
        throw new HttpError(502, "ERR_AI_UPSTREAM", error.message);
      }
    }

    throw new HttpError(502, "ERR_AI_UPSTREAM", `Gemini error: ${lastUpstreamError || "Unknown upstream error"}`);
  }

  extractJson(content) {
    if (!content) {
      return null;
    }
    if (typeof content === "object") {
      return content;
    }

    const raw = String(content)
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");

    try {
      return JSON.parse(raw);
    } catch (_error) {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        return null;
      }
      try {
        return JSON.parse(match[0]);
      } catch (_error2) {
        return null;
      }
    }
  }

  normalizeText(payload) {
    const parts = payload?.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) {
      return "";
    }

    return parts
      .map((item) => {
        if (typeof item?.text === "string") {
          return item.text;
        }
        return "";
      })
      .join("\n")
      .trim();
  }
}

module.exports = { GeminiClient };
