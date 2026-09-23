import { defineConfig } from '@playwright/test';

const API_PORT = 4101;
const WEB_PORT = 3100;

export default defineConfig({
  testDir: 'tests/e2e',
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    // Use the system-installed Chrome (Playwright CDN is unreachable in this environment)
    channel: 'chrome',
  },
  webServer: [
    {
      command: 'npx tsx server/index.ts',
      url: `http://localhost:${API_PORT}/api/health`,
      env: { DB_PATH: '.tmp/e2e.db', API_PORT: String(API_PORT) },
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { API_PORT: String(API_PORT) },
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});
