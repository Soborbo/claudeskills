import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['tests/**/*.test.ts'],
  },
  define: {
    // gateway.ts: Astro publikus env a Turnstile sitekey-hez (tesztben fix érték)
    'import.meta.env.PUBLIC_TURNSTILE_SITE_KEY': JSON.stringify('0xTESTSITEKEY'),
  },
});
