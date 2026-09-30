import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
    // Date helpers depend on the local zone; pin it so results match everywhere.
    env: { TZ: "UTC" },
  },
});
