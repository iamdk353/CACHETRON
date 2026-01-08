import fs from "fs";
import path from "path";
import express from "express";
import morgan from "morgan";
import http from "http";
import { WebSocketServer } from "ws";

import { Figlet } from "ascii-art";

export default async function runDashboard() {
  try {
    const out = await Figlet.text("CACHETRON");
    console.log(out);
  } catch {
    console.log("CACHETRON");
  }

  const app = express();
  const port = 6789;

  const distPath = path.join(
    process.cwd(),
    "node_modules/cachetron/dist/dashboard"
  );
  const metricFile = path.join(distPath, "metric.json");

  if (!fs.existsSync(metricFile)) {
    console.log("metric.json not found. Start your server first.");
    return;
  }

  app.use(morgan("dev"));
  app.use(express.static(distPath));

  app.get("/", (_, res) => res.sendFile(path.join(distPath, "index.html")));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  console.log("WebSocket server ready for live metrics");

  wss.on("connection", (ws) => {
    try {
      const raw = fs.readFileSync(metricFile, "utf8");
      const list = JSON.parse(raw);
      const sliced = Array.isArray(list) ? list.slice(-50) : list;
      ws.send(JSON.stringify(sliced));
    } catch {
      console.log("Error reading metric.json");
    }
  });

  let timer: NodeJS.Timeout | null = null;

  const watcher = fs.watch(metricFile, () => {
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      try {
        const raw = fs.readFileSync(metricFile, "utf8");
        JSON.parse(raw);
        wss.clients.forEach((c) => c.readyState === 1 && c.send(raw));
      } catch {
        console.log("Waiting for metric.json to finish writing...");
      }
    }, 50);
  });

  // Catch async watch errors
  watcher.on("error", () => {
    console.log("metric.json not found. Start your Cachetron server first.");
  });

  server.listen(port, () =>
    console.log(`Dashboard running at http://localhost:${port}`)
  );
}
