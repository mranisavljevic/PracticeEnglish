import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:5173', viewport: { width: 390, height: 844 } },
  webServer: [
    {
      command: 'VITE_CATALOG_FILE=tests/fixtures/catalog.sample.json VITE_AUDIO_BASE_URL=http://localhost:5174 npm run dev -- --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
    {
      // Same app with analytics switched on; only analytics.spec runs against it (the collector is intercepted).
      command:
        'VITE_ANALYTICS_ENDPOINT=/api/e VITE_CATALOG_FILE=tests/fixtures/catalog.sample.json VITE_AUDIO_BASE_URL=http://localhost:5174 npm run dev -- --port 5175 --strictPort',
      url: 'http://localhost:5175',
      reuseExistingServer: !process.env.CI,
    },
    { command: 'npm run dev:audio', url: 'http://localhost:5174/health', reuseExistingServer: !process.env.CI },
  ],
  projects: [
    {
      name: 'chromium',
      testIgnore: /(scan|analytics)\.spec/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
    { name: 'webkit', testIgnore: /(scan|analytics)\.spec/, use: { ...devices['Desktop Safari'], viewport: { width: 390, height: 844 } } },
    {
      name: 'analytics',
      testMatch: /analytics\.spec/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5175', viewport: { width: 390, height: 844 } },
    },
    {
      // Scanning needs a camera: Chromium feeds a recorded badge clip in as the fake device.
      name: 'scan',
      testMatch: /scan\.spec/,
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 390, height: 844 },
        permissions: ['camera'],
        launchOptions: {
          args: [
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream',
            '--use-file-for-fake-video-capture=tests/fixtures/badges/badge.y4m',
          ],
        },
      },
    },
  ],
})
