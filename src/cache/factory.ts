import fs from "fs";
import path from "path";
import { RedisCache } from "./Adapters/RedisCache";
import { MemcacheCache } from "./Adapters/MemcacheCache";
import { Cache } from "./Interface/Cache";

let cacheInstance: Cache | null = null;
let currentConfig: { type: string; url: string } | null = null;
const CONFIG_PATH = path.join(process.cwd(), "cachetron.json");
let reloadTimeout: NodeJS.Timeout | null = null;

// --- Load config ---
export function loadCacheConfig(): { type: string; url: string,autoTTL?:boolean } {
  if (!fs.existsSync(CONFIG_PATH)) throw new Error(`Config file not found`);
  const data = fs.readFileSync(CONFIG_PATH, "utf8");
  console.log(`[CacheFactory] Loaded config: ${data}`);
  return JSON.parse(data);
}

// --- Create cache instance ---
function createCacheInstance(config: { type: string; url: string }): Cache {
  const { type, url } = config;
  if (!type || !url) throw new Error("Cache config missing 'type' or 'url'");
  switch (type.toLowerCase()) {
    case "redis":
      return new RedisCache(url);
    case "memcache":
      return new MemcacheCache(url);
    default:
      throw new Error(`Unknown cache type: ${type}`);
  }
}

// --- Migrate data from old cache to new cache ---
async function migrateCache(oldCache: Cache, newCache: Cache) {
  try {
    const keys = await oldCache.keys(); // must be implemented in both caches
    for (const key of keys) {
      const value = await oldCache.get(key);
      if (value !== null) await newCache.set(key, value);
    }
    console.log("[CacheFactory] Migration completed");
  } catch (err) {
    console.error("[CacheFactory] Migration error:", err);
  }
}

// --- Cleanup old cache ---
async function cleanupCache() {
  if (!cacheInstance) return;
  if (
    "disconnect" in cacheInstance &&
    typeof cacheInstance.disconnect === "function"
  ) {
    try {
      await cacheInstance.disconnect();
      console.log("[CacheFactory] Old cache disconnected");
    } catch (err) {
      console.error("[CacheFactory] Error disconnecting old cache:", err);
    }
  }
  cacheInstance = null;
}

// --- Watcher setup with debounce ---
function watchConfigFile() {
  fs.watch(CONFIG_PATH, { persistent: true }, (eventType) => {
    if (eventType === "change") {
      if (reloadTimeout) clearTimeout(reloadTimeout);
      reloadTimeout = setTimeout(async () => {
        try {
          const newConfig = loadCacheConfig();
          if (
            !currentConfig ||
            newConfig.type !== currentConfig.type ||
            newConfig.url !== currentConfig.url
          ) {
            console.log("[CacheFactory] Config changed, migrating cache...");
            const oldCache = cacheInstance;
            const newCache = createCacheInstance(newConfig);
            if (oldCache) await migrateCache(oldCache, newCache);
            await cleanupCache();
            cacheInstance = newCache;
            currentConfig = newConfig;
            console.log(`[CacheFactory] Now using ${newConfig.type} cache`);
          }
        } catch (err) {
          console.error("[CacheFactory] Error reloading config:", err);
        }
      }, 200);
    }
  });
}

// --- Exported factory ---
export function cachetron(): Cache {
  if (cacheInstance) return cacheInstance;
  const config = loadCacheConfig();
  currentConfig = config;
  cacheInstance = createCacheInstance(config);
  watchConfigFile();
  return cacheInstance;
}
