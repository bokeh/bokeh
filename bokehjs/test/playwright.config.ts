import { defineConfig } from '@playwright/test';
export default defineConfig({
  webServer: {
    command: 'cd ../../docs/bokeh && make serve',
    url: 'http://127.0.0.1:5009',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:5009/',
  },
});