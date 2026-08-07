import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["**/*.integration.test.{ts,tsx}", "node_modules/**"],
    coverage: {
      reporter: ["text", "html"],
      include: ["lib/scoring/**", "lib/validation/**"],
    },
  },
});
