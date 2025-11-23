interface CacheChartData {
  time: string; // e.g., "2025-10-12T06:00:00.000Z"
  hitRatio: number;
  missRatio: number;
  cacheSize: number; // in MB
  dataChangeRate: number; // per minute
  hitRatioLifetime: number;
  missRatioLifetime: number;
}

interface MLCacheMetrics {
  hitRatioLifetime: number;
  missRatioLifetime: number;
  cacheSize: number;
  dataChangeRate: number;
  ttl?: number;
}

import fs from "fs";
import path from "path";
import { cachetron } from "../cache/factory";

const METRICS_FILE = path.join(
  process.cwd(),
  "node_modules",
  "cachetron",
  "dist",
  "dashboard",
  "metric.json"
);

let ML_Metrics: MLCacheMetrics = {
  hitRatioLifetime: 0,
  missRatioLifetime: 0,
  cacheSize: 0,
  dataChangeRate: 0,
};

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
      ML_Metrics = {
        hitRatioLifetime: stats.hitRatioLifetime,
        missRatioLifetime: stats.missRatioLifetime,
        cacheSize: stats.cacheSize,
        dataChangeRate: stats.dataChangeRate,
      };

      // Save back to file as JSON array
      fs.writeFileSync(METRICS_FILE, JSON.stringify(allMetrics, null, 2));

      console.log("📈 Cache Metrics updated to file:", METRICS_FILE);
    } catch (err) {
      console.error("[Metrics] Error collecting metrics:", err);
    }
  }, 5_000);
};

export function getLatestMLMetrics(): MLCacheMetrics {
  const rawData = fs.readFileSync(METRICS_FILE, "utf-8");
  const metrics = JSON.parse(rawData);

  // Check if it's an array and access the last element
  if (Array.isArray(metrics) && metrics.length > 0) {
    const lastMetric = metrics[metrics.length - 1];
    console.log("✅ Last JSON entry:", lastMetric);
    return lastMetric as MLCacheMetrics;
  } else {
    console.error("❌ The file does not contain a valid array or is empty.");
    return {
      hitRatioLifetime: 0,
      missRatioLifetime: 0,
      cacheSize: 0,
      dataChangeRate: 0,
    };
  }
}
