import { defineConfig, devices } from '@playwright/test';

const MOCK_PORT = 4010;
const APP_PORT = 3100;

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: `http://localhost:${APP_PORT}`, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npx tsx e2e/mock-tmdb-server.ts',
      url: `http://localhost:${MOCK_PORT}/3/genre/movie/list`,
      env: { MOCK_TMDB_PORT: String(MOCK_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run build && npm run start -- -p ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}`,
      env: { TMDB_READ_TOKEN: 'e2e-token', TMDB_API_BASE_URL: `http://localhost:${MOCK_PORT}/3` },
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
