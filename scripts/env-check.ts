import { validateEnv } from "../src/lib/env";

try {
  validateEnv();
  console.log("All required environment variables are set.");
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
