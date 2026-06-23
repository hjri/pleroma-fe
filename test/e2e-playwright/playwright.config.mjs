/* global process */
import { defineConfig, devices } from 'playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:8080'

export default defineConfig({
  testDir: './specs',
  // Paths are resolved relative to this config file directory.
  outputDir: 'test-results',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['line'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [
        ['list'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
      ],
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'on',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'yarn dev -- --host 0.0.0.0 --port 8080 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      VITE_PROXY_TARGET:
        process.env.VITE_PROXY_TARGET || 'http://localhost:4000',
      VITE_PROXY_ORIGIN:
        process.env.VITE_PROXY_ORIGIN ||
        process.env.VITE_PROXY_TARGET ||
        'http://localhost:4000',
    },
  },
  projects: [
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
  ],
})
