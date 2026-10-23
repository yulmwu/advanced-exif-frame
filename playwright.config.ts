import { defineConfig } from '@playwright/test'
const externalURL = process.env.PLAYWRIGHT_BASE_URL
export default defineConfig({
    testDir: 'tests/browser',
    timeout: 60000,
    use: {
        actionTimeout: 10000,
        baseURL: externalURL ?? 'http://127.0.0.1:5178',
        viewport: { width: 1440, height: 1000 },
        channel: process.env.CI ? undefined : 'chrome',
    },
    webServer: externalURL
        ? undefined
        : {
              command: 'npm run dev -- --port 5178',
              url: 'http://127.0.0.1:5178',
              reuseExistingServer: true,
          },
    reporter: 'list',
})
