import { defineConfig } from 'vitest/config';

// The server-leg tests (crm, events) depend only on WebCrypto + a stubbed
// `window` — no Astro runtime — so a plain node environment keeps them fast and
// installable without the full app toolchain.
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
