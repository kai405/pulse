import { defineConfig, devices } from "@playwright/test";

const e2ePort = Number(process.env.PULSE_E2E_PORT ?? 3100);
const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: e2eBaseUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${e2ePort}`,
    url: e2eBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"], channel: "chrome", launchOptions: { args: ["--use-fake-device-for-media-stream"] } } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"], channel: "chrome", launchOptions: { args: ["--use-fake-device-for-media-stream"] } } },
  ],
});
