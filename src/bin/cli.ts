#!/usr/bin/env node

import fs from "fs";
import path from "path";
import express, { Request, Response, NextFunction } from "express";
import morgon from "morgan";
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
  const app = express();
  const port = parseInt(process.env.PORT || "3000");
  const distPath = path.join(
    process.cwd(),
    "node_modules/cachetron/dist/dashboard"
  );

  app.use(express.static(distPath));

  app.get("/", (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(port, () =>
    console.log(`Dashboard running at http://localhost:${port}`)
  );
} else if (args.includes("init")) {
  PrintAsci("Cachetron");
  const TemplateConfig = {
    backend: "redis",
    url: "redis://localhost:6379",
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

async function PrintAsci(params: string) {
  const text = await figlet.text(params);
  console.log(text);
}
