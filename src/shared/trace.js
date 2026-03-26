const { randomUUID } = require("crypto");

function createTraceId(prefix = "trace") {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

module.exports = { createTraceId };