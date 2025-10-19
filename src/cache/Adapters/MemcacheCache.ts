import Memcached from "memcached";
import { Cache } from "../Interface/Cache";
import logger from "../../utils/logger";
import { getLatestMLMetrics } from "../../utils/Monitor";
import predictTTL from "../../ml/prediction";

interface CacheChartData {
  time: string;
  hitRatio: number;           // Recent hit ratio (since last check)
  missRatio: number;          // Recent miss ratio (since last check)
  hitRatioLifetime: number;   // Overall hit ratio (lifetime)
  missRatioLifetime: number;  // Overall miss ratio (lifetime)
  cacheSize: number;          // in MB
  dataChangeRate: number;     // per minute
}

export class MemcacheCache implements Cache {
  private client: Memcached;
  private connected = false;
  private keySet: Set<string> = new Set(); // track keys locally

  // Track incremental stats (for rate calculations)
  private previousStats = {
    getHits: 0,
    getMisses: 0,
    evictions: 0,
    lastCheckTime: Date.now(),
  };

  constructor(server: string) {
    this.client = new Memcached(server);
  }

  private async ensureConnected() {
    if (!this.connected) {
      this.connected = true; // Memcached auto-connects
      logger.info(`MemcacheCache connected`);
    }
  }

  private serialize(value: any): string {
    return JSON.stringify(value);
  }

  private deserialize<T>(value: string | null): T | null {
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async get(key: string): Promise<any | null> {
    await this.ensureConnected();
    logger.debug(`[MemcacheCache] get called for key: ${key}`);
    return new Promise((resolve) => {
      this.client.get(key, (err, data) => {
        if (err) {
          logger.error(`[MemcacheCache] Error getting key '${key}': ${err}`);
          resolve(null);
        } else {
          logger.info(`[MemcacheCache] Got key '${key}': ${data}`);
          resolve(this.deserialize(data));
        }
      });
    });
  }

  async set(key: string, value: any, ttl = 0): Promise<void> {
    await this.ensureConnected();
    const mlMetric= getLatestMLMetrics();
        if( mlMetric.length!==4){
          ttl=ttl;
          logger.info(`[MemCache]{ML} Set key '${key}' with ttl Default ${ttl}`);
        }
        else{
          const predictedTTl=await predictTTL(mlMetric)
          if(predictedTTl && predictedTTl>0){
            ttl=Math.floor(predictedTTl);
            logger.info(`[MemCache]{ML} Set key '${key}' with ttl Predicted ${ttl}`);
          }
        }
    const serialized = this.serialize(value);
    logger.debug(`[MemcacheCache] set called for key: ${key}, ttl: ${ttl}`);
    return new Promise((resolve, reject) => {
      this.client.set(key, serialized, ttl, (err) => {
        if (err) {
          logger.error(`[MemcacheCache] Error setting key '${key}': ${err}`);
          reject(err);
        } else {
          this.keySet.add(key);
          logger.info(`[MemcacheCache] Set key '${key}' with ttl ${ttl}`);
          resolve();
        }
      });
    });
  }

  async delete(key: string): Promise<void> {
    await this.ensureConnected();
    return new Promise((resolve, reject) => {
      this.client.del(key, (err) => {
        if (err) {
          logger.error(`[MemcacheCache] Error deleting key '${key}': ${err}`);
          reject(err);
        } else {
          this.keySet.delete(key);
          logger.info(`[MemcacheCache] Deleted key '${key}'`);
          resolve();
        }
      });
    });
  }

  async hasKey(key: string): Promise<boolean> {
    await this.ensureConnected();
    return new Promise((resolve) => {
      this.client.get(key, (err, data) => {
        if (err) {
          logger.error(`[MemcacheCache] Error checking key '${key}': ${err}`);
          resolve(false);
        } else {
          const exists = data !== undefined && data !== null;
          logger.info(`[MemcacheCache] hasKey '${key}': ${exists}`);
          resolve(exists);
        }
      });
    });
  }

  async keys(): Promise<string[]> {
    return Array.from(this.keySet);
  }

  async clear(): Promise<void> {
    await this.ensureConnected();
    return new Promise((resolve, reject) => {
      this.client.flush((err) => {
        if (err) {
          logger.error(`[MemcacheCache] Error clearing cache: ${err}`);
          reject(err);
        } else {
          this.keySet.clear();
          logger.info(`[MemcacheCache] Cache cleared`);
          resolve();
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    this.client.end();
    this.connected = false;
    this.keySet.clear();
    logger.info(`[MemcacheCache] Disconnected`);
  }

  /**
   * Collect Memcached metrics about current content and recent performance
   */
  async getCacheMetrics(): Promise<any> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      // Add timeout protection to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error("Stats request timed out after 5 seconds"));
      }, 5000);

      this.client.stats((err, serverStats) => {
        clearTimeout(timeout);

        if (err || !serverStats) {
          logger.error(`[MemcacheCache] Error fetching stats: ${err}`);
          return reject(err || new Error("No stats returned"));
        }

        try {
          const stats = this.parseMemcacheStats(serverStats);
          const metrics = this.calculateMetrics(stats);
          
          logger.info(`[MemcacheCache] Metrics collected successfully`);
          resolve(metrics);
        } catch (error) {
          logger.error(`[MemcacheCache] Error processing stats: ${error}`);
          reject(error);
        }
      });
    });
  }

  /**
   * Parse memcache stats from various possible formats
   */
  private parseMemcacheStats(serverStats: any): Record<string, any> {
    let stats: Record<string, any> | undefined;

    // Handle array format
    if (Array.isArray(serverStats)) {
      const first = serverStats[0];
      
      // Case 1: { server, stats: {...} }
      if (first?.stats && typeof first.stats === "object") {
        stats = first.stats;
      }
      // Case 2: stats directly on object
      else if (first && typeof first === "object") {
        const { server, ...rest } = first;
        stats = rest;
      }
    } 
    // Handle object format: { "localhost:11211": {...} }
    else if (serverStats && typeof serverStats === "object") {
      const keys = Object.keys(serverStats);
      if (keys.length > 0) {
        const firstKey = keys[0];
        stats = serverStats[firstKey];
      }
    }

    if (!stats || typeof stats !== "object") {
      throw new Error(`Invalid stats format: ${JSON.stringify(serverStats)}`);
    }

    return stats;
  }

  /**
   * Calculate metrics from raw stats
   */
  private calculateMetrics(stats: Record<string, any>): CacheChartData {
    // Extract current cumulative metrics
    const getHits = this.safeNumber(stats["get_hits"]);
    const getMisses = this.safeNumber(stats["get_misses"]);
    const bytes = this.safeNumber(stats["bytes"]);
    const evictions = this.safeNumber(stats["evictions"]);

    // Calculate INCREMENTAL hit/miss ratios (since last check)
    const hitsDelta = Math.max(0, getHits - this.previousStats.getHits);
    const missesDelta = Math.max(0, getMisses - this.previousStats.getMisses);
    const totalDelta = hitsDelta + missesDelta;
    
    // Use incremental values for recent performance
    const hitRatio = totalDelta > 0 ? hitsDelta / totalDelta : 0;
    const missRatio = totalDelta > 0 ? missesDelta / totalDelta : 0;

    // Calculate LIFETIME hit/miss ratios (overall performance)
    const totalLifetime = getHits + getMisses;
    const hitRatioLifetime = totalLifetime > 0 ? getHits / totalLifetime : 0;
    const missRatioLifetime = totalLifetime > 0 ? getMisses / totalLifetime : 0;

    // Calculate cache size in MB
    const cacheSizeMB = bytes / (1024 * 1024);

    // Calculate eviction rate (per minute)
    const now = Date.now();
    const minutesPassed = (now - this.previousStats.lastCheckTime) / 60000;
    const evictionsDelta = Math.max(0, evictions - this.previousStats.evictions);
    const dataChangeRate = minutesPassed > 0 ? evictionsDelta / minutesPassed : 0;

    // Update previous stats for next interval
    this.previousStats = {
      getHits,
      getMisses,
      evictions,
      lastCheckTime: now,
    };

    return {
      time: new Date().toISOString(),
      hitRatio: this.safePrecision(hitRatio, 3),
      missRatio: this.safePrecision(missRatio, 3),
      hitRatioLifetime: this.safePrecision(hitRatioLifetime, 3),
      missRatioLifetime: this.safePrecision(missRatioLifetime, 3),
      cacheSize: this.safePrecision(cacheSizeMB, 2),
      dataChangeRate: this.safePrecision(dataChangeRate, 2),
    };
  }

  /**
   * Safely convert value to number, defaulting to 0
   */
  private safeNumber(value: any): number {
    const num = Number(value);
    return !isNaN(num) && isFinite(num) && num >= 0 ? num : 0;
  }

  /**
   * Safely round number to precision, handling NaN/Infinity
   */
  private safePrecision(value: number, decimals: number): number {
    if (!isFinite(value)) return 0;
    return Number(value.toFixed(decimals));
  }
}