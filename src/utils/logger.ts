import fs from "fs";
import path from "path";

export type LogLevel = "info" | "warn" | "error" | "debug";

interface LoggerOptions {
  level?: LogLevel;
}

export class Logger {
  private logFilePath: string;
  private level: LogLevel;
  private levels: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  };

  constructor(options: LoggerOptions = {}) {
    this.logFilePath = path.join(
      process.cwd(),
      "node_modules",
      "cachetron",
      "data",
      "app.log"
    );
    console.log(`Logging to file: ${this.logFilePath}`);
    this.level = options.level || "info";
    // Ensure log dir exists
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    // Ensure log file exists
    if (!fs.existsSync(this.logFilePath)) {
      fs.writeFileSync(this.logFilePath, "");
    }
  }

  private format(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  private write(level: LogLevel, message: string) {
    if (this.levels[level] > this.levels[this.level]) return;
    const formatted = this.format(level, message);
    // Console output
    switch (level) {
      case "error":
        console.error(formatted);
        break;
      case "warn":
        console.warn(formatted);
        break;
      case "info":
        console.info(formatted);
        break;
      case "debug":
        console.debug(formatted);
        break;
      default:
        console.log(formatted);
    }
    // File output
    fs.appendFileSync(this.logFilePath, formatted + "\n");
  }

  info(message: string) {
    this.write("info", message);
  }

  warn(message: string) {
    this.write("warn", message);
  }

  error(message: string) {
    this.write("error", message);
  }

  debug(message: string) {
    this.write("debug", message);
  }
}

// Singleton instance for convenience
const logger = new Logger();
export default logger;
