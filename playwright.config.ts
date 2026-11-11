import { defineConfig } from '@playwright/test';

// По умолчанию гоним против прода (реальный контент/бэкенд — jsdom контраст не считает).
// Переопределить: E2E_BASE_URL=... (напр. http://localhost:4173 для vite preview).
const baseURL = process.env.E2E_BASE_URL || 'https://chess.motorcycles';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 12_000 },
  retries: 0,
  fullyParallel: true,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL,
    headless: true,
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 900 },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
