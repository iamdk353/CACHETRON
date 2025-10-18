
import { CacheChartData,EnhancedCacheMetrics } from "../Adapters/RedisCache";
export interface Cache {
  get(key: string): Promise<any | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  hasKey(key: string): Promise<boolean>;
  clear(): Promise<void>;
  disconnect(): Promise<void>;
  keys(): Promise<string[]>;
  getCacheMetrics(): Promise<CacheChartData>;
}
