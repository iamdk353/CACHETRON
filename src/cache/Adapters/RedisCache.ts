import { createClient, RedisClientType } from "redis";
import { Cache } from "../Interface/Cache";
import logger from "../../utils/logger";

export interface CacheChartData {
  time: string;
  hitRatio: number;
  missRatio: number;
  hitRatioLifetime: number;
  missRatioLifetime: number;
  cacheSize: number;
  dataChangeRate: number;
  keyCount: number;
  avgKeySize: number;
}

export interface EnhancedCacheMetrics {
  timestamp: string;
  cacheKey?: string;
  dataType?: string;
  
  currentMetrics: {
    hitRatio: number;
    missRatio: number;
    cacheSize: number;
    itemCount: number;
    avgItemSize: number;
  };
  
  lifetimeMetrics: {
    hitRatioLifetime: number;
    missRatioLifetime: number;
    totalRequests: number;
    totalHits: number;
    totalMisses: number;
  };
  
  accessPatterns: {
    requestFrequency: number;
    lastAccessTime: string;
    accessCount24h: number;
    accessCount7d: number;
    avgTimeBetweenAccess: number;
    peakHourAccess: number;
    offPeakHourAccess: number;
  };
  
  dataCharacteristics: {
    dataAge: number;
    dataChangeRate: number;
    lastModified: string;
    updateFrequency: number;
    volatilityScore: number;
  };
  
  performanceMetrics: {
    avgCacheFetchTime: number;
    avgSourceFetchTime: number;
    evictionCount: number;
    refreshCount: number;
  };
  
  temporalFeatures: {
    hourOfDay: number;
    dayOfWeek: number;
    isWeekend: boolean;
    isBusinessHours: boolean;
    seasonalIndex: number;
  };
  
  costMetrics: {
    cacheCostPerHour: number;
    missLatencyCost: number;
    storageCost: number;
  };
  
  targetVariable?: {
    optimalTTL: number;
    previousTTL: number;
    ttlEffectiveness: number;
  };
}

interface EnhancedPreviousStats {
  keyspaceHits: number;
  keyspaceMisses: number;
  evictedKeys: number;
  lastCheckTime: number;
  
  // Additional tracking for access patterns
  accessHistory: Array<{ timestamp: number; hits: number; misses: number }>;
  hourlyAccessCounts: Map<number, number>;
  dailyAccessCounts: Map<string, number>;
  
  // Performance tracking
  fetchTimeSamples: number[];
  evictionHistory: Array<{ timestamp: number; count: number }>;
}

export class RedisCache implements Cache {
  private client: RedisClientType;
  private connected = false;

  // Enhanced tracking for ML features
  private previousStats: EnhancedPreviousStats = {
    keyspaceHits: 0,
    keyspaceMisses: 0,
    evictedKeys: 0,
    lastCheckTime: Date.now(),
    accessHistory: [],
    hourlyAccessCounts: new Map(),
    dailyAccessCounts: new Map(),
    fetchTimeSamples: [],
    evictionHistory: []
  };

  constructor(url: string) {
    this.client = createClient({ url });
  }

  private async ensureConnected() {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
      logger.info(`RedisCache connected`);
    }
  }

  async get(key: string) {
    await this.ensureConnected();
    logger.debug(`[RedisCache] get called for key: ${key}`);
    try {
      const val = await this.client.get(key);
      logger.info(`[RedisCache] Got key '${key}': ${val}`);
      return val ? JSON.parse(val) : null;
    } catch (err) {
      logger.error(`[RedisCache] Error getting key '${key}': ${err}`);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number) {
    await this.ensureConnected();
    logger.debug(`[RedisCache] set called for key: ${key}, ttl: ${ttl}`);
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.set(key, serialized, { EX: ttl });
      } else {
        await this.client.set(key, serialized);
      }
      logger.info(`[RedisCache] Set key '${key}' with ttl ${ttl}`);
    } catch (err) {
      logger.error(`[RedisCache] Error setting key '${key}': ${err}`);
    }
  }

  async delete(key: string) {
    await this.ensureConnected();
    logger.debug(`[RedisCache] delete called for key: ${key}`);
    try {
      await this.client.del(key);
      logger.info(`[RedisCache] Deleted key '${key}'`);
    } catch (err) {
      logger.error(`[RedisCache] Error deleting key '${key}': ${err}`);
    }
  }

  async hasKey(key: string) {
    await this.ensureConnected();
    logger.debug(`[RedisCache] hasKey called for key: ${key}`);
    try {
      const exists = await this.client.exists(key);
      logger.info(`[RedisCache] hasKey '${key}': ${exists === 1}`);
      return exists === 1;
    } catch (err) {
      logger.error(`[RedisCache] Error checking key '${key}': ${err}`);
      return false;
    }
  }

  async clear() {
    await this.ensureConnected();
    logger.debug(`[RedisCache] clear called`);
    try {
      await this.client.flushDb();
      logger.info(`[RedisCache] Cache cleared`);
    } catch (err) {
      logger.error(`[RedisCache] Error clearing cache: ${err}`);
    }
  }

  async disconnect() {
    if (this.connected) {
      await this.client.quit();
      this.connected = false;
      console.log("[RedisCache] Disconnected");
    }
  }

  async keys(): Promise<string[]> {
    await this.ensureConnected();
    try {
      const allKeys = await this.client.keys("*");
      return allKeys;
    } catch (err) {
      logger.error(`[RedisCache] Error getting all keys: ${err}`);
      return [];
    }
  }

  /**
   * Collect basic Redis cache metrics (backward compatible)
   */
  async getCacheMetrics(): Promise<CacheChartData> {
    await this.ensureConnected();
    
    try {
      const info = await this.client.info();
      const infoData = this.parseRedisInfo(info);

      const dbSize = await this.client.dbSize();
      const usedMemory = this.safeNumber(infoData["used_memory"]);
      const avgKeySize = dbSize > 0 ? usedMemory / dbSize : 0;

      const keyspaceHits = this.safeNumber(infoData["keyspace_hits"]);
      const keyspaceMisses = this.safeNumber(infoData["keyspace_misses"]);
      const evictedKeys = this.safeNumber(infoData["evicted_keys"]);

      const hitsDelta = Math.max(0, keyspaceHits - this.previousStats.keyspaceHits);
      const missesDelta = Math.max(0, keyspaceMisses - this.previousStats.keyspaceMisses);
      const totalDelta = hitsDelta + missesDelta;
      
      const hitRatio = totalDelta > 0 ? hitsDelta / totalDelta : 0;
      const missRatio = totalDelta > 0 ? missesDelta / totalDelta : 0;

      const totalLifetime = keyspaceHits + keyspaceMisses;
      const hitRatioLifetime = totalLifetime > 0 ? keyspaceHits / totalLifetime : 0;
      const missRatioLifetime = totalLifetime > 0 ? keyspaceMisses / totalLifetime : 0;

      const now = Date.now();
      const minutesPassed = (now - this.previousStats.lastCheckTime) / 60000;
      const evictionsDelta = Math.max(0, evictedKeys - this.previousStats.evictedKeys);
      const dataChangeRate = minutesPassed > 0 ? evictionsDelta / minutesPassed : 0;

      // Update tracking for enhanced metrics
      this.updateAccessHistory(now, hitsDelta, missesDelta, evictionsDelta);

      this.previousStats.keyspaceHits = keyspaceHits;
      this.previousStats.keyspaceMisses = keyspaceMisses;
      this.previousStats.evictedKeys = evictedKeys;
      this.previousStats.lastCheckTime = now;

      const metrics: CacheChartData = {
        time: new Date().toISOString(),
        hitRatio: this.safePrecision(hitRatio, 3),
        missRatio: this.safePrecision(missRatio, 3),
        hitRatioLifetime: this.safePrecision(hitRatioLifetime, 3),
        missRatioLifetime: this.safePrecision(missRatioLifetime, 3),
        cacheSize: this.safePrecision(usedMemory / (1024 * 1024), 2),
        dataChangeRate: this.safePrecision(dataChangeRate, 2),
        keyCount: dbSize,
        avgKeySize: this.safePrecision(avgKeySize, 0),
      };

      logger.info(`[RedisCache] Metrics collected - Keys: ${dbSize}, Size: ${metrics.cacheSize}MB`);
      return metrics;

    } catch (err) {
      logger.error(`[RedisCache] Error collecting metrics: ${err}`);
      throw err;
    }
  }

  /**
   * Collect comprehensive cache metrics for ML model training
   */
  async getEnhancedMetrics(): Promise<EnhancedCacheMetrics> {
    await this.ensureConnected();
    
    try {
      const now = Date.now();
      const nowDate = new Date(now);
      
      const info = await this.client.info();
      const infoData = this.parseRedisInfo(info);

      const dbSize = await this.client.dbSize();
      const usedMemory = this.safeNumber(infoData["used_memory"]);
      const avgKeySize = dbSize > 0 ? usedMemory / dbSize : 0;

      const keyspaceHits = this.safeNumber(infoData["keyspace_hits"]);
      const keyspaceMisses = this.safeNumber(infoData["keyspace_misses"]);
      const evictedKeys = this.safeNumber(infoData["evicted_keys"]);

      // === CURRENT METRICS (Incremental) ===
      const hitsDelta = Math.max(0, keyspaceHits - this.previousStats.keyspaceHits);
      const missesDelta = Math.max(0, keyspaceMisses - this.previousStats.keyspaceMisses);
      const totalDelta = hitsDelta + missesDelta;
      
      const hitRatio = totalDelta > 0 ? hitsDelta / totalDelta : 0;
      const missRatio = totalDelta > 0 ? missesDelta / totalDelta : 0;

      // === LIFETIME METRICS ===
      const totalLifetime = keyspaceHits + keyspaceMisses;
      const hitRatioLifetime = totalLifetime > 0 ? keyspaceHits / totalLifetime : 0;
      const missRatioLifetime = totalLifetime > 0 ? keyspaceMisses / totalLifetime : 0;

      // === ACCESS PATTERNS ===
      const minutesPassed = (now - this.previousStats.lastCheckTime) / 60000;
      const requestFrequency = minutesPassed > 0 ? totalDelta / minutesPassed : 0;
      
      // Calculate 24h and 7d access counts
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      
      const accessCount24h = this.previousStats.accessHistory
        .filter(h => h.timestamp >= oneDayAgo)
        .reduce((sum, h) => sum + h.hits + h.misses, 0);
      
      const accessCount7d = this.previousStats.accessHistory
        .filter(h => h.timestamp >= sevenDaysAgo)
        .reduce((sum, h) => sum + h.hits + h.misses, 0);

      const avgTimeBetweenAccess = requestFrequency > 0 ? 60 / requestFrequency : 0;

      // Update hourly access tracking
      const currentHour = nowDate.getHours();
      this.previousStats.hourlyAccessCounts.set(
        currentHour,
        (this.previousStats.hourlyAccessCounts.get(currentHour) || 0) + totalDelta
      );

      const hourlyValues = Array.from(this.previousStats.hourlyAccessCounts.values());
      const peakHourAccess = hourlyValues.length > 0 ? Math.max(...hourlyValues) : 0;
      const offPeakHourAccess = hourlyValues.length > 0 ? Math.min(...hourlyValues) : 0;

      // === DATA CHARACTERISTICS ===
      const evictionsDelta = Math.max(0, evictedKeys - this.previousStats.evictedKeys);
      const dataChangeRate = minutesPassed > 0 ? evictionsDelta / minutesPassed : 0;

      // Calculate volatility score
      const recentEvictions = this.previousStats.evictionHistory
        .slice(-60)
        .map(e => e.count);
      const volatilityScore = this.calculateVolatility(recentEvictions);

      // Estimate data age
      const avgEvictionRate = this.previousStats.evictionHistory.length > 0
        ? this.previousStats.evictionHistory.reduce((sum, e) => sum + e.count, 0) / this.previousStats.evictionHistory.length
        : 0;
      const estimatedDataAge = avgEvictionRate > 0 ? (dbSize / avgEvictionRate) * 60 : 86400;

      // === PERFORMANCE METRICS ===
      const opsPerSec = this.safeNumber(infoData["instantaneous_ops_per_sec"]);
      const avgCacheFetchTime = opsPerSec > 0 ? 1000 / opsPerSec : 2.0;
      const avgSourceFetchTime = avgCacheFetchTime * 75;

      // === TEMPORAL FEATURES ===
      const hourOfDay = nowDate.getHours();
      const dayOfWeek = nowDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isBusinessHours = hourOfDay >= 9 && hourOfDay < 17 && !isWeekend;
      const seasonalIndex = isBusinessHours ? 1.3 : (isWeekend ? 0.8 : 1.0);

      // === COST METRICS ===
      const cacheSizeMB = usedMemory / (1024 * 1024);
      const cacheCostPerHour = cacheSizeMB * 0.0001;
      const missLatencyCost = avgSourceFetchTime / 100;
      const storageCost = avgKeySize / (1024 * 1024) * 0.0001;

      // Update tracking
      this.updateAccessHistory(now, hitsDelta, missesDelta, evictionsDelta);
      this.previousStats.keyspaceHits = keyspaceHits;
      this.previousStats.keyspaceMisses = keyspaceMisses;
      this.previousStats.evictedKeys = evictedKeys;
      this.previousStats.lastCheckTime = now;

      const metrics: EnhancedCacheMetrics = {
        timestamp: nowDate.toISOString(),
        dataType: "cache_aggregate",
        
        currentMetrics: {
          hitRatio: this.safePrecision(hitRatio, 3),
          missRatio: this.safePrecision(missRatio, 3),
          cacheSize: this.safePrecision(cacheSizeMB, 2),
          itemCount: dbSize,
          avgItemSize: this.safePrecision(avgKeySize / 1024, 2)
        },
        
        lifetimeMetrics: {
          hitRatioLifetime: this.safePrecision(hitRatioLifetime, 3),
          missRatioLifetime: this.safePrecision(missRatioLifetime, 3),
          totalRequests: totalLifetime,
          totalHits: keyspaceHits,
          totalMisses: keyspaceMisses
        },
        
        accessPatterns: {
          requestFrequency: this.safePrecision(requestFrequency, 2),
          lastAccessTime: nowDate.toISOString(),
          accessCount24h: accessCount24h,
          accessCount7d: accessCount7d,
          avgTimeBetweenAccess: this.safePrecision(avgTimeBetweenAccess, 2),
          peakHourAccess: peakHourAccess,
          offPeakHourAccess: offPeakHourAccess
        },
        
        dataCharacteristics: {
          dataAge: Math.floor(estimatedDataAge),
          dataChangeRate: this.safePrecision(dataChangeRate, 2),
          lastModified: new Date(now - estimatedDataAge * 1000).toISOString(),
          updateFrequency: Math.floor(estimatedDataAge),
          volatilityScore: this.safePrecision(volatilityScore, 2)
        },
        
        performanceMetrics: {
          avgCacheFetchTime: this.safePrecision(avgCacheFetchTime, 2),
          avgSourceFetchTime: this.safePrecision(avgSourceFetchTime, 2),
          evictionCount: evictedKeys,
          refreshCount: Math.floor(evictedKeys * 0.7)
        },
        
        temporalFeatures: {
          hourOfDay: hourOfDay,
          dayOfWeek: dayOfWeek,
          isWeekend: isWeekend,
          isBusinessHours: isBusinessHours,
          seasonalIndex: this.safePrecision(seasonalIndex, 2)
        },
        
        costMetrics: {
          cacheCostPerHour: this.safePrecision(cacheCostPerHour, 4),
          missLatencyCost: this.safePrecision(missLatencyCost, 2),
          storageCost: this.safePrecision(storageCost, 6)
        }
      };

      logger.info(
        `[RedisCache] Enhanced metrics - Keys: ${dbSize}, Size: ${cacheSizeMB.toFixed(2)}MB, ` +
        `Hit: ${(hitRatio * 100).toFixed(1)}%, Freq: ${requestFrequency.toFixed(1)}/min`
      );
      
      return metrics;

    } catch (err) {
      logger.error(`[RedisCache] Error collecting enhanced metrics: ${err}`);
      throw err;
    }
  }

  /**
   * Update access history tracking
   */
  private updateAccessHistory(
    timestamp: number,
    hits: number,
    misses: number,
    evictions: number
  ): void {
    // Update access history (keep last 7 days at 1min intervals = 10080 entries)
    this.previousStats.accessHistory.push({ timestamp, hits, misses });
    if (this.previousStats.accessHistory.length > 10080) {
      this.previousStats.accessHistory.shift();
    }

    // Update eviction history (keep last 24 hours at 1min = 1440 entries)
    this.previousStats.evictionHistory.push({ timestamp, count: evictions });
    if (this.previousStats.evictionHistory.length > 1440) {
      this.previousStats.evictionHistory.shift();
    }
  }

  /**
   * Calculate volatility score based on variance
   */
  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return mean > 0 ? Math.min(stdDev / mean, 1) : 0;
  }

  /**
   * Parse Redis INFO response into key-value pairs
   */
  private parseRedisInfo(info: string): Record<string, string> {
    const data: Record<string, string> = {};

    info.split("\n").forEach(line => {
      line = line.trim();
      if (!line || line.startsWith("#")) {
        return;
      }

      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        data[key] = value;
      }
    });

    return data;
  }

  /**
   * Safely convert value to number
   */
  private safeNumber(value: any): number {
    const num = Number(value);
    return !isNaN(num) && isFinite(num) && num >= 0 ? num : 0;
  }

  /**
   * Safely round number to precision
   */
  private safePrecision(value: number, decimals: number): number {
    if (!isFinite(value)) return 0;
    return Number(value.toFixed(decimals));
  }
}

