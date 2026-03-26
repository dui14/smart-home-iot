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

const voiceSchema = z.object({
  request_id: z.string().min(1),
  source: z.string().min(1).default("voice-web"),
  transcript: z.string().min(1),
  context: z.record(z.any()).optional(),
  timestamp: z.string().optional()
});

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
          data: {
            parsed_commands: [
              {
                device: result.command.device,
                room: result.command.room,
                action: result.command.action
              }
            ],
            execution: "success"
          }
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
          data: {
            text: payload.transcript,
            parsed_commands: [
              {
                device: result.command.device,
                room: result.command.room,
                action: result.command.action
              }
            ],
            execution: "success"
          }
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