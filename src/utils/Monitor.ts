interface CacheChartData {
  time: string; // e.g., "2025-10-12T06:00:00.000Z"
  hitRatio: number;
  missRatio: number;
  cacheSize: number; // in MB
  dataChangeRate: number; // per minute
}


import fs from "fs";
import path from "path";
import { cachetron } from "../cache/factory";

const METRICS_FILE = path.join(process.cwd(),
      "node_modules",
      "cachetron",
      "data",
      "metric.json"
    );

export const startMetricsCollection = () => {
  setInterval(async () => {
    try {
      const cache = cachetron();
      const stats: CacheChartData = await cache.getCacheMetrics();

      let allMetrics: CacheChartData[] = [];

      // Read existing metrics
      if (fs.existsSync(METRICS_FILE)) {
        try {
          const data = fs.readFileSync(METRICS_FILE, "utf-8");
          allMetrics = JSON.parse(data) as CacheChartData[];
          if (!Array.isArray(allMetrics)) {
            // If file is not an array, reset to empty array
            allMetrics = [];
          }
        } catch {
          // Corrupt JSON → reset
          allMetrics = [];
        }
      }

      // Append new stats
      allMetrics.push(stats);

      // Save back to file as JSON array
      fs.writeFileSync(METRICS_FILE, JSON.stringify(allMetrics, null, 2));

      console.log("📈 Cache Metrics updated to file:", METRICS_FILE);
    } catch (err) {
      console.error("[Metrics] Error collecting metrics:", err);
    }
  }, 20_000); 
};
