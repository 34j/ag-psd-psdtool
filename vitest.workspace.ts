import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  {
    // node test config
    test: {
      name: 'node',
    },
  },
  {
    // browser test config
    test: {
      name: 'browser',
      browser: {
        enabled: true,
        headless: true,
        bypassCSP: true,
        provider: 'playwright',
        instances: [
          { browser: 'firefox', launch: {
            args: [
              '--disable-web-security',
            ],
          } },
          { browser: 'chromium', launch: {
            args: [
              '--disable-web-security',
            ],
          } },
        ],
      },
    },
  },
])
