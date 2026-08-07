import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    setupFiles: ["./tests/integration/setup.ts"],
    include: ["**/*.integration.test.ts"],
    testTimeout: 20_000,
  },
});
