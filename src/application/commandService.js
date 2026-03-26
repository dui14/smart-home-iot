const { validateCommand } = require("../domain/deviceCatalog");
const { parseTextCommandLocally } = require("../domain/localCommandParser");
const { HttpError } = require("../shared/httpError");

class CommandService {
  constructor({ deviceClient, aiClient, stateStore }) {
    this.deviceClient = deviceClient;
    this.aiClient = aiClient;
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

  async aiControl(payload) {
    const context = payload.context || {};
    let parsed = null;

    try {
      parsed = await this.aiClient.parseCommand({
        text: payload.text,
        context
      });
    } catch (_err) {
      parsed = parseTextCommandLocally(payload.text, context);
    }

    if (!parsed) {
      throw new HttpError(422, "ERR_AI_PARSE_FAILED", "Cannot parse command from text");
    }

    const validation = validateCommand(parsed);
    if (!validation.ok) {
      throw new HttpError(422, validation.code, validation.message, [
        {
          source: "ai",
          parsed
        }
      ]);
    }

    const command = validation.value;
    await this.deviceClient.controlDevice(command);
    const state = this.stateStore.applyCommand(command);

    return {
      parsed,
      command,
      state
    };
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