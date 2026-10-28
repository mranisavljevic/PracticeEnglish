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
    { command: 'npm run dev:audio', url: 'http://localhost:5174/health', reuseExistingServer: !process.env.CI },
  ],
  projects: [
    {
      name: 'chromium',
      testIgnore: /scan\.spec/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
    { name: 'webkit', testIgnore: /scan\.spec/, use: { ...devices['Desktop Safari'], viewport: { width: 390, height: 844 } } },
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
