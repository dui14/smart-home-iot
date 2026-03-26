const { HttpError } = require("../shared/httpError");

class OpenRouterClient {
  constructor({ apiKey, model, timeoutMs, siteUrl, siteName, fetchImpl }) {
    this.apiKey = apiKey;
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.siteUrl = siteUrl;
    this.siteName = siteName;
    this.fetchImpl = fetchImpl || fetch;
  }

  async parseCommand({ text, context }) {
    if (!this.apiKey) {
      throw new HttpError(500, "ERR_AI_MISSING_API_KEY", "OPENROUTER_API_KEY is not configured");
    }

    const systemPrompt = [
      "You are an IoT command parser.",
      "Return JSON only, without markdown.",
      "Schema:",
      '{"device":"light|lock|ac","room":"living|bedroom|main_door","action":"on|off|open|close|lock|unlock"}',
      "If user asks unsupported action, choose the closest safe action."
    ].join("\n");

    const userPrompt = JSON.stringify({ text, context });
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
          model: this.model,
          temperature: 0,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        })
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const errBody = await response.text();
        throw new HttpError(502, "ERR_AI_UPSTREAM", `OpenRouter error: ${errBody}`);
      }

      const payload = await response.json();
      const content = this.normalizeContent(payload?.choices?.[0]?.message?.content);
      const parsed = this.extractJson(content);

      if (!parsed) {
        throw new HttpError(422, "ERR_AI_PARSE_FAILED", "AI response is not valid JSON command");
      }

      return parsed;
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