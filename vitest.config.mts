import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests for plain TypeScript modules (no React rendering), so the default Node environment is enough.
// The alias mirrors tsconfig.json "paths" ("@/*" → "./src/*").
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
