import "dotenv/config";
import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    channel: process.env.E2E_BROWSER === "chrome" ? "chrome" : undefined,
  },
});
