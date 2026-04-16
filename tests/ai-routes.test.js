const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createApp } = require("../src/app");

function createMockCommandService(overrides = {}) {
  return {
    control: async () => ({ command: { device: "light", room: "living", action: "on" }, state: {} }),
    aiParse: async () => ({
      inputText: "bat den phong khach",
      parsed: { device: "light", room: "living", action: "on" },
      command: { device: "light", room: "living", action: "on" },
      validation: { ok: true },
      confidence: 0.9,
      parser: "llm",
      requiresConfirmation: false
    }),
    aiControl: async () => ({
      inputText: "bat den phong khach",
      parsed: { device: "light", room: "living", action: "on" },
      command: { device: "light", room: "living", action: "on" },
      confidence: 0.9,
      parser: "llm",
      requiresConfirmation: false,
      state: {
        devices: {
          light: {
            living: "on"
          }
        }
      }
    }),
    aiAssistant: async () => ({
      intent: "chat",
      assistantText: "Toi la Tom, tro ly smart-home cua ban.",
      executionStatus: "chat_only",
      commands: [],
      parser: "llm",
      state: {
        devices: {
          light: {
            living: "off"
          }
        }
      }
    }),
    getStatus: async () => ({ mode: "manual", devices: {}, sensor: {}, last_sync_at: new Date().toISOString() }),
    ...overrides
  };
}

test("POST /api/v1/ai/parse-only returns parsed result", async () => {
  const app = createApp({ commandService: createMockCommandService() });

  const response = await request(app)
    .post("/api/v1/ai/parse-only")
    .send({
      request_id: "ai_parse_1",
      source: "web-chat",
      user_text: "bat den phong khach",
      input_type: "text"
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.code, "OK_AI_COMMAND_PARSED");
  assert.equal(response.body.data.input_type, "text");
  assert.equal(response.body.data.parsed_command.device, "light");
  assert.equal(response.body.data.validation_result.ok, true);
});

test("POST /api/v1/ai/parse-only keeps validation result when invalid", async () => {
  const app = createApp({
    commandService: createMockCommandService({
      aiParse: async () => ({
        inputText: "bat den",
        parsed: { device: "light", room: "unknown", action: "on" },
        command: null,
        validation: {
          ok: false,
          code: "ERR_INVALID_PAYLOAD",
          message: "Room is not supported"
        },
        confidence: 0.6,
        parser: "local",
        requiresConfirmation: true
      })
    })
  });

  const response = await request(app)
    .post("/api/v1/ai/parse-only")
    .send({
      request_id: "ai_parse_2",
      source: "web-chat",
      user_text: "bat den",
      input_type: "text"
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.validation_result.ok, false);
  assert.equal(response.body.data.validation_result.code, "ERR_INVALID_PAYLOAD");
  assert.equal(response.body.data.requires_confirmation, true);
});

test("POST /api/v1/ai/parse-and-execute returns unified execute response", async () => {
  const app = createApp({ commandService: createMockCommandService() });

  const response = await request(app)
    .post("/api/v1/ai/parse-and-execute")
    .send({
      request_id: "ai_exec_1",
      source: "web-chat",
      user_text: "bat den phong khach",
      input_type: "voice"
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.code, "OK_AI_COMMAND_EXECUTED");
  assert.equal(response.body.data.input_type, "voice");
  assert.equal(response.body.data.execution_status, "success");
  assert.equal(response.body.data.execution, "success");
  assert.equal(response.body.data.parsed_commands.length, 1);
  assert.equal(response.body.data.parsed_command.action, "on");
});

test("POST /api/v1/voice-command keeps backward compatibility", async () => {
  const app = createApp({ commandService: createMockCommandService() });

  const response = await request(app)
    .post("/api/v1/voice-command")
    .send({
      request_id: "voice_1",
      source: "voice-web",
      transcript: "bat den phong khach"
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.code, "OK_VOICE_COMMAND_EXECUTED");
  assert.equal(response.body.data.input_type, "voice");
  assert.equal(response.body.data.text, "bat den phong khach");
  assert.equal(response.body.data.parsed_commands[0].device, "light");
});

test("POST /api/v1/ai/assistant returns conversational reply without commands", async () => {
  const app = createApp({ commandService: createMockCommandService() });

  const response = await request(app)
    .post("/api/v1/ai/assistant")
    .send({
      request_id: "asst_1",
      source: "voice-web",
      user_text: "hello who are you",
      input_type: "voice",
      context: {
        language: "en-US",
        assistant_name: "Tom"
      }
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.code, "OK_AI_ASSISTANT_RESPONDED");
  assert.equal(response.body.data.intent, "chat");
  assert.equal(response.body.data.execution_status, "chat_only");
  assert.equal(response.body.data.parsed_commands.length, 0);
  assert.equal(typeof response.body.data.assistant_text, "string");
});

test("POST /api/v1/ai/assistant returns friendly failure for device errors", async () => {
  const app = createApp({
    commandService: createMockCommandService({
      aiAssistant: async () => ({
        intent: "device_control",
        assistantText: "Toi da hieu lenh, nhung hien tai khong ket noi duoc ESP32.",
        executionStatus: "failed",
        commands: [
          { device: "fan", room: "", action: "on" },
          { device: "light", room: "living", action: "on" }
        ],
        parser: "llm",
        errorCode: "ERR_DEVICE_UNREACHABLE",
        state: {
          devices: {
            fan: "off",
            light: {
              living: "off"
            }
          }
        }
      })
    })
  });

  const response = await request(app)
    .post("/api/v1/ai/assistant")
    .send({
      request_id: "asst_2",
      source: "voice-web",
      user_text: "bat quat va mo den phong khach",
      input_type: "voice"
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.intent, "device_control");
  assert.equal(response.body.data.execution_status, "failed");
  assert.equal(response.body.data.error_code, "ERR_DEVICE_UNREACHABLE");
  assert.equal(response.body.data.parsed_commands.length, 2);
});
