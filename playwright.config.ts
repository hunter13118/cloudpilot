import { defineConfig, devices } from "@playwright/test";

/**
 * CloudPilot e2e — the ENTIRE backend is mocked at the network layer
 * (tests/mocks.ts), so this suite runs anywhere with zero GCP access.
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: ["e2e/**/*.spec.ts"],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    viewport: { width: 1600, height: 900 },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "showcase",
      testMatch: ["showcase.screens.ts"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2,
      },
    },
  ],
  webServer: {
    command: "npm --prefix frontend run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
