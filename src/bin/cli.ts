#!/usr/bin/env node
import runDashboard from "./functions/Dashboard";
import runInit from "./functions/Init";
import showHelp from "./functions/ShowHelp";

const args = process.argv.slice(2);

async function run() {
  if (args.includes("dashboard")) return runDashboard();
  if (args.includes("init")) return runInit();
  if (args.includes("help") || args.length === 0) return showHelp();

  console.log("❌ Unknown command:", args.join(" "));
  showHelp();
}

run();
