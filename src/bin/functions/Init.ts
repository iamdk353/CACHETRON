import path from "path";
import fs from "fs";
import { Figlet } from "ascii-art";

async function PrintAsci(text: string) {
  try {
    const out = await Figlet.text(text);
    console.log(out);
  } catch {
    console.log(text);
  }
}

export default async function runInit() {
  await PrintAsci("Cachetron");

  const config = {
    type: "redis",
    url: "redis://127.0.0.1:6379/",
    autoTTL: true,
  };
  const filePath = path.join(process.cwd(), "cachetron.json");

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
    console.log("✅ Created cachetron.json at:", filePath);
  } else {
    console.log("ℹ️ cachetron.json already exists at:", filePath);
  }
}
