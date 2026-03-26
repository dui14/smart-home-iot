const express = require("express");
const cors = require("cors");
const path = require("path");
const { createRouter } = require("./api/router");

function createApp({ commandService }) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.static(path.join(process.cwd(), "public")));
  app.use("/api/v1", createRouter({ commandService }));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }
    res.sendFile(path.join(process.cwd(), "public", "index.html"));
  });

  return app;
}

module.exports = { createApp };