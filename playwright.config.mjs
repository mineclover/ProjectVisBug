import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const configDir = dirname(fileURLToPath(import.meta.url))
const requestedPort = Number(process.env.PLAYWRIGHT_PORT || process.env.TEST_PORT || 3000)
// Workers reload this config after the server starts, so reuse the runner's selected port.
const port = Number(
  process.env.VISBUG_TEST_PORT ||
    execFileSync(process.execPath, [join(configDir, 'scripts/find-free-port.mjs'), String(requestedPort)], {
      encoding: 'utf8',
    }).trim(),
)
process.env.VISBUG_TEST_PORT = String(port)
// BrowserSync's test server binds IPv4 on macOS; avoid localhost resolving to
// an unrelated IPv6 listener before falling back to 127.0.0.1.
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './app',
  testMatch: /.*\.test\.js$/,
  testIgnore: /components\/.*\.test\.js$/,
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run test:server',
    url: baseURL,
    env: {
      TEST_PORT: String(port),
    },
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
})
