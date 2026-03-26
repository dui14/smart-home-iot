class StateStore {
  constructor() {
    this.state = {
      mode: "manual",
      devices: {
        light: { living: "off", bedroom: "off" },
        lock: "close",
        ac: { living: "off", bedroom: "off" }
      },
      sensor: {
        ldr: {},
        dht22: { temperature: null, humidity: null }
      },
      last_sync_at: null
    };
  }

  applyCommand(command) {
    const now = new Date().toISOString();
    if (command.device === "lock") {
      this.state.devices.lock = command.action;
    }
    if (command.device === "light") {
      this.state.devices.light[command.room] = command.action;
    }
    if (command.device === "ac") {
      this.state.devices.ac[command.room] = command.action;
    }
    this.state.last_sync_at = now;
    return this.getState();
  }

  updateSensor(sensor) {
    this.state.sensor = {
      ...this.state.sensor,
      ...sensor
    };
    this.state.last_sync_at = new Date().toISOString();
  }

  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }
}

module.exports = { StateStore };