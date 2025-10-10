import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run tests sequentially to avoid LiveStore state conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid parallel test conflicts with LiveStore
  reporter: 'html',
  timeout: 60000, // 60 second timeout per test
  use: {
    baseURL: 'http://localhost:60000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000, // 10 second timeout for actions
    navigationTimeout: 30000, // 30 second timeout for navigation
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    port: 60000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});