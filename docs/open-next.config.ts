import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig({
  // Add an incrementalCache here (e.g. r2IncrementalCache) once an R2
  // bucket is bound in wrangler.jsonc as NEXT_INC_CACHE_R2_BUCKET.
});
