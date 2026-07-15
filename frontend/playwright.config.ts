/**
 * @file playwright.config.ts
 * @description Playwright configuration for Lovv frontend end-to-end tests.
 * @author JJonyeok2
 * @lastModified 2026-07-15
 */

import { defineConfig, devices } from '@playwright/test'

const baseURL = 'http://127.0.0.1:4173'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'line',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
    env: {
      VITE_LOVV_AUTH_MODE: 'api',
      VITE_LOVV_API_BASE_URL: '',
      VITE_LOVV_AGENT_API_URL: '',
      VITE_API_BASE_URL: '',
      VITE_GOOGLE_MAPS_API_KEY: '',
      VITE_GOOGLE_MAPS_MAP_ID: '',
      VITE_OPENROUTESERVICE_API_KEY: '',
      VITE_KAKAO_MAP_JAVASCRIPT_KEY: 'e2e-test-key',
      VITE_KAKAO_JAVASCRIPT_KEY: '',
      VITE_IMAGE_CDN_BASE_URL: '',
    },
  },
})

// EOF: playwright.config.ts
