import { defineConfig } from '@playwright/test';
import nextEnv from '@next/env';
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
export default defineConfig({
  testDir: './e2e',
  timeout: 120000,
  expect: { timeout: 30000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: process.env.APP_URL || 'http://localhost:3000', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000/ru',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
