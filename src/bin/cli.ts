#!/usr/bin/env node

import fs from "fs";
import path from "path";
import express, { Request, Response, NextFunction } from "express";
import morgon from "morgan";
import http from "http";
import { WebSocketServer } from "ws";
import figlet from "figlet";
// React build inside installed package

const args = process.argv.slice(2);

function showHelp() {
  console.log(`
Usage: cachetron [options]

Options:
    init         Create cachetron.json in project root
  dashboard    Start cachetron Dashboard
  help         Show this help message
`);
}

if (args.includes("dashboard")) {
  PrintAsci("Cachetron");
  const app = express();
  const port = parseInt(process.env.PORT || "3000");
  const distPath = path.join(
    process.cwd(),
    "node_modules/cachetron/dist/dashboard"
  );

  // Serve dashboard UI
  app.use(express.static(distPath));
  app.get("/", (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  // Create shared HTTP server
  const server = http.createServer(app);

  // Attach WebSocket server
  const wss = new WebSocketServer({ server });

  console.log("WebSocket server attached for live metrics");

  // Send metrics on connect
  wss.on("connection", (ws) => {
    try {
      const data = fs.readFileSync(path.join(distPath, "metric.json"), "utf8");
      ws.send(data);
    } catch (e) {}
  });

  // Watch for metric.json changes
  fs.watch(path.join(distPath, "metric.json"), () => {
    const data = fs.readFileSync(path.join(distPath, "metric.json"), "utf8");

    wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send(data);
    });
  });

  // Start combined server
  server.listen(port, () =>
    console.log(`Dashboard running at http://localhost:${port}`)
  );
} else if (args.includes("init")) {
  PrintAsci("Cachetron");
  const TemplateConfig = {
    type: "redis",
    url: "redis://localhost:6379",
    autoTTL: true,
  };

  const filePath = path.join(process.cwd(), "cachetron.json");

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(TemplateConfig, null, 2));
    console.log("✅ Created cachetron config at:", filePath);
  } else {
    console.log("ℹ️ cachetron.json already exists at:", filePath);
  }
} else if (args.includes("help") || args.length === 0) {
  showHelp();
} else {
  console.log("❌ Unknown command:", args.join(" "));
  showHelp();
}

export async function PrintAsci(params: string) {
  const text = await figlet.text(params);
  console.log(text);
}
