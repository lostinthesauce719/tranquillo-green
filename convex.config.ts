import { defineConfig } from "convex";

export default defineConfig({
  codegen: {
    esbuildOptions: {
      external: ["@/convex/server"],
    },
  },
});