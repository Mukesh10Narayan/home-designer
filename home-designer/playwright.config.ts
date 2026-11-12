import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width:1280, height:900 },
    launchOptions: { channel:'chrome' },
  },
  webServer: {
    command:'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    url:'http://127.0.0.1:5173',
    reuseExistingServer:!process.env.CI,
  },
})
