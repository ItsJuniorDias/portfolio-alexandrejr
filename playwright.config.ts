import { defineConfig, devices } from "@playwright/test";

// PLAYWRIGHT_BASE_URL points the suite at a deployed site; otherwise it tests a local production build.
const deployedUrl = process.env.PLAYWRIGHT_BASE_URL;
const localUrl = "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: deployedUrl ?? localUrl,
    // Branded Chrome decodes the H.264 film; Playwright's bundled Chromium has no proprietary codecs.
    channel: "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "laptop", use: { viewport: { width: 1024, height: 768 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel: "chrome" } },
  ],
  webServer: deployedUrl
    ? undefined
    : {
        command: "npm run build && npm run preview -- --port 4173 --strictPort",
        url: localUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
