import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "published-course.spec.js",
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:4174",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "python3 -m http.server 4174 --bind 127.0.0.1 --directory docs",
    url: "http://127.0.0.1:4174/app/",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
