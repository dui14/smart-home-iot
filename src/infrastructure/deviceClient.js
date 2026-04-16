const { HttpError } = require("../shared/httpError");

class DeviceClient {
  constructor({ baseUrl, timeoutMs, retries, fetchImpl }) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.timeoutMs = timeoutMs;
    this.retries = retries;
    this.fetchImpl = fetchImpl || fetch;
  }

  async controlDevice(command) {
    const { path, params } = this.mapCommand(command);
    const query = new URLSearchParams(params);
    return this.requestJson(`${path}?${query.toString()}`);
  }

  async fetchSensor() {
    return this.requestJson("/sensor");
  }

  mapCommand(command) {
    if (command.device === "light") {
      return {
        path: "/light",
        params: { room: command.room, state: command.action }
      };
    }

    if (command.device === "lock") {
      return {
        path: "/lock",
        params: { state: command.action }
      };
    }

    if (command.device === "ac") {
      return {
        path: "/ac",
        params: { state: command.action }
      };
    }

    if (command.device === "fan") {
      return {
        path: "/fan",
        params: { state: command.action }
      };
    }

    throw new HttpError(400, "ERR_DEVICE_NOT_FOUND", "Device is not supported");
  }

  async requestJson(pathWithQuery) {
    let lastError;
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetchImpl(`${this.baseUrl}${pathWithQuery}`, {
          method: "GET",
          signal: controller.signal,
          headers: {
            Accept: "application/json"
          }
        });
        clearTimeout(timeout);

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status}: ${text}`);
        }

        return await response.json();
      } catch (error) {
        clearTimeout(timeout);
        lastError = error;
        if (attempt < this.retries) {
          const backoffMs = attempt === 0 ? 200 : 500;
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    throw new HttpError(502, "ERR_DEVICE_UNREACHABLE", `Cannot reach ESP32: ${lastError.message}`);
  }
}

module.exports = { DeviceClient };