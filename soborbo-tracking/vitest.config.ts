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
    // Market config — HU piac default a tesztekben (bizonyítja a nem-GBP működést)
    'import.meta.env.PUBLIC_TRACKING_COUNTRY': JSON.stringify('HU'),
    'import.meta.env.PUBLIC_TRACKING_CURRENCY': JSON.stringify('HUF'),
    'import.meta.env.PUBLIC_TRACKING_LOCALE': JSON.stringify('hu'),
  },
});
