import fs from "fs";
import path from "path";
import { z } from "zod";


export const CacheSchema = z.object({
  type: z.string().min(1, "Type must be a non-empty string"),
  url: z
    .string()
    .url("URL must be a valid URL")
    .or(
      z.string().regex(
        /^([\w.-]+):(\d+)$/,
        "URL must be a valid host:port format or a valid URL"
      )
    ),
});

export type Cache = z.infer<typeof CacheSchema>;

const filePath = path.join(process.cwd(), "cachetron.json");

export const updateCacheConfig = (config: Cache) => {
  const validationResult = CacheSchema.safeParse(config);

  if (!validationResult.success) {
    throw new Error("Please provide a correct cache configuration");
  }
  const existingData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const updatedData = { ...existingData, ...validationResult.data };
  fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
};
