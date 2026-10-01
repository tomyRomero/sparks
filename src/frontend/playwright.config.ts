import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against a running Sparks: the web app at E2E_BASE_URL
 * (http://localhost:3100 by default), its API, and a database the tests are
 * free to fill. CI runs them on a throwaway database against a production
 * build (.github/workflows/ci.yml).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chrome",
      // The installed Chrome, which GitHub's runners have too, so there's no browser to download.
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
});
