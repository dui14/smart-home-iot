function ok({ code, message, traceId, data }) {
  return {
    success: true,
    code,
    message,
    trace_id: traceId,
    server_time: new Date().toISOString(),
    data
  };
}

function fail({ code, message, traceId, errors }) {
  return {
    success: false,
    code,
    message,
    trace_id: traceId,
    server_time: new Date().toISOString(),
    errors: errors || []
  };
}

module.exports = { ok, fail };