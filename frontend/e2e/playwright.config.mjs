import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: {
    // Build (if needed) and start the frontend preview (serves built `dist`)
    // Note: set VITE_API_URL in the environment for the build if you need the app
    // to point at a local gateway (e.g. VITE_API_URL=http://localhost:3000).
    command: 'cd .. && npm run build && npm run preview -- --port 4173',
    port: 4173,
    timeout: 120_000,
    reuseExistingServer: process.env.CI ? false : true
  }
});
