import "dotenv/config";
import { cachetron } from "./cache/factory";
import { updateCacheConfig } from "./cache/config-updater";
import { startMetricsCollection } from "./utils/Monitor";
startMetricsCollection();
export { cachetron ,updateCacheConfig };

