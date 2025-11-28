import "dotenv/config";
import { cache } from "./cache/factory";
import { updateCacheConfig } from "./cache/config-updater";
import { startMetricsCollection } from "./utils/Monitor";
startMetricsCollection();
export { cache, updateCacheConfig };
export default cache;
