const express = require("express");
const { z } = require("zod");
const { createTraceId } = require("../shared/trace");
const { ok, fail } = require("../shared/response");
const { HttpError } = require("../shared/httpError");

const controlSchema = z.object({
  request_id: z.string().min(1),
  source: z.string().min(1),
  mode: z.enum(["manual", "auto"]).default("manual"),
  device: z.string().min(1),
  room: z.string().optional(),
  action: z.string().min(1),
  params: z.record(z.any()).optional(),
  timestamp: z.string().optional()
});

const aiSchema = z.object({
  request_id: z.string().min(1),
  source: z.string().min(1),
  text: z.string().min(1),
  context: z.record(z.any()).optional(),
  timestamp: z.string().optional()
});

const aiParseSchema = z.object({
  request_id: z.string().min(1),
  source: z.string().min(1),
  user_text: z.string().min(1),
  input_type: z.enum(["text", "voice"]).default("text"),
  context: z.record(z.any()).optional(),
  timestamp: z.string().optional()
});

const aiExecuteSchema = z.object({
  request_id: z.string().min(1),
  source: z.string().min(1),
  user_text: z.string().min(1),
  input_type: z.enum(["text", "voice"]).default("text"),
  context: z.record(z.any()).optional(),
  timestamp: z.string().optional()
});

const aiAssistantSchema = z.object({
  request_id: z.string().min(1),
  source: z.string().min(1),
  user_text: z.string().min(1),
  input_type: z.enum(["text", "voice"]).default("text"),
  context: z.record(z.any()).optional(),
  timestamp: z.string().optional()
});

const voiceSchema = z.object({
  request_id: z.string().min(1),
  source: z.string().min(1).default("voice-web"),
  transcript: z.string().min(1),
  context: z.record(z.any()).optional(),
  timestamp: z.string().optional()
});

function toCommandData(command) {
  return {
    device: command.device,
    room: command.room,
    action: command.action
  };
}

function toValidationResult(validation) {
  if (validation.ok) {
    return { ok: true };
  }
  return {
    ok: false,
    code: validation.code,
    message: validation.message
  };
}

function toExecuteData({ result, inputType, userText, includeLegacyText }) {
  const commandData = toCommandData(result.command);
  const data = {
    input_type: inputType,
    user_text: userText,
    parsed_command: commandData,
    parsed_commands: [commandData],
    validation_result: { ok: true },
    confidence: result.confidence,
    parser: result.parser,
    requires_confirmation: result.requiresConfirmation,
    execution_status: "success",
    execution: "success",
    resulting_state: result.state
  };

  if (includeLegacyText) {
    data.text = userText;
  }

  return data;
}

function toAssistantData({ result, inputType, userText }) {
  const parsedCommands = (Array.isArray(result.commands) ? result.commands : []).map((command) => toCommandData(command));
  return {
    input_type: inputType,
    user_text: userText,
    intent: result.intent,
    assistant_text: result.assistantText,
    parsed_command: parsedCommands[0] || null,
    parsed_commands: parsedCommands,
    execution_status: result.executionStatus,
    error_code: result.errorCode || null,
    parser: result.parser,
    resulting_state: result.state
  };
}

function createRouter({ commandService }) {
  const router = express.Router();

  router.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      time: new Date().toISOString()
    });
  });

  router.post("/control", async (req, res, next) => {
    const traceId = createTraceId("trace_ctrl");
    try {
      const payload = controlSchema.parse(req.body);
      const result = await commandService.control(payload);
      res.status(200).json(
        ok({
          code: "OK_COMMAND_APPLIED",
          message: "Command executed",
          traceId,
          data: {
            device: result.command.device,
            room: result.command.room,
            state: result.command.action,
            mode: payload.mode
          }
        })
      );
    } catch (error) {
      next({ error, traceId });
    }
  });

  router.post("/ai-command", async (req, res, next) => {
    const traceId = createTraceId("trace_ai");
    try {
      const payload = aiSchema.parse(req.body);
      const result = await commandService.aiControl(payload);
      res.status(200).json(
        ok({
          code: "OK_AI_COMMAND_EXECUTED",
          message: "AI command parsed and executed",
          traceId,
          data: toExecuteData({
            result,
            inputType: "text",
            userText: payload.text,
            includeLegacyText: false
          })
        })
      );
    } catch (error) {
      next({ error, traceId });
    }
  });

  router.post("/ai/parse-only", async (req, res, next) => {
    const traceId = createTraceId("trace_ai_parse");
    try {
      const payload = aiParseSchema.parse(req.body);
      const result = await commandService.aiParse({
        request_id: payload.request_id,
        source: payload.source,
        text: payload.user_text,
        context: payload.context,
        timestamp: payload.timestamp
      });

      res.status(200).json(
        ok({
          code: "OK_AI_COMMAND_PARSED",
          message: "AI command parsed",
          traceId,
          data: {
            input_type: payload.input_type,
            user_text: payload.user_text,
            parsed_command: result.parsed,
            validation_result: toValidationResult(result.validation),
            confidence: result.confidence,
            parser: result.parser,
            requires_confirmation: result.requiresConfirmation
          }
        })
      );
    } catch (error) {
      next({ error, traceId });
    }
  });

  router.post("/ai/parse-and-execute", async (req, res, next) => {
    const traceId = createTraceId("trace_ai_exec");
    try {
      const payload = aiExecuteSchema.parse(req.body);
      const result = await commandService.aiControl({
        request_id: payload.request_id,
        source: payload.source,
        text: payload.user_text,
        context: payload.context,
        timestamp: payload.timestamp
      });

      res.status(200).json(
        ok({
          code: "OK_AI_COMMAND_EXECUTED",
          message: "AI command parsed and executed",
          traceId,
          data: toExecuteData({
            result,
            inputType: payload.input_type,
            userText: payload.user_text,
            includeLegacyText: false
          })
        })
      );
    } catch (error) {
      next({ error, traceId });
    }
  });

  router.post("/ai/assistant", async (req, res, next) => {
    const traceId = createTraceId("trace_ai_asst");
    try {
      const payload = aiAssistantSchema.parse(req.body);
      const result = await commandService.aiAssistant({
        request_id: payload.request_id,
        source: payload.source,
        text: payload.user_text,
        inputType: payload.input_type,
        context: payload.context,
        timestamp: payload.timestamp
      });

      res.status(200).json(
        ok({
          code: "OK_AI_ASSISTANT_RESPONDED",
          message: "AI assistant response generated",
          traceId,
          data: toAssistantData({
            result,
            inputType: payload.input_type,
            userText: payload.user_text
          })
        })
      );
    } catch (error) {
      next({ error, traceId });
    }
  });

  router.post("/voice-command", async (req, res, next) => {
    const traceId = createTraceId("trace_voice");
    try {
      const payload = voiceSchema.parse(req.body);
      const result = await commandService.aiControl({
        request_id: payload.request_id,
        source: payload.source,
        text: payload.transcript,
        context: payload.context,
        timestamp: payload.timestamp
      });

      res.status(200).json(
        ok({
          code: "OK_VOICE_COMMAND_EXECUTED",
          message: "Voice command parsed and executed",
          traceId,
          data: toExecuteData({
            result,
            inputType: "voice",
            userText: payload.transcript,
            includeLegacyText: true
          })
        })
      );
    } catch (error) {
      next({ error, traceId });
    }
  });

  router.get("/status", async (req, res, next) => {
    const traceId = createTraceId("trace_status");
    try {
      const includeSensor = req.query.includeSensor !== "false";
      const status = await commandService.getStatus({ includeSensor });
      res.status(200).json(
        ok({
          code: "OK_STATUS_FETCHED",
          message: "Status fetched",
          traceId,
          data: status
        })
      );
    } catch (error) {
      next({ error, traceId });
    }
  });

  router.use((problem, _req, res, _next) => {
    const traceId = problem.traceId || createTraceId("trace_err");
    const incoming = problem.error || problem;

    if (incoming instanceof z.ZodError) {
      res.status(400).json(
        fail({
          code: "ERR_INVALID_PAYLOAD",
          message: "Invalid request body",
          traceId,
          errors: incoming.issues.map((item) => ({
            path: item.path.join("."),
            message: item.message
          }))
        })
      );
      return;
    }

    if (incoming instanceof HttpError) {
      res.status(incoming.status).json(
        fail({
          code: incoming.code,
          message: incoming.message,
          traceId,
          errors: incoming.details || []
        })
      );
      return;
    }

    res.status(500).json(
      fail({
        code: "ERR_INTERNAL",
        message: incoming.message || "Unexpected server error",
        traceId
      })
    );
  });

  return router;
}

module.exports = { createRouter };