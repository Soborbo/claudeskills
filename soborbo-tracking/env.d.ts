/**
 * Ambient types for the Astro/Vite `import.meta.env` used by lib/*.ts.
 * The real values are injected by Astro at build time (PUBLIC_* vars) and by
 * vitest.config.ts `define` in tests. This declaration lets `tsc --noEmit`
 * type-check the library without pulling in the full Astro/Vite type packages.
 */
interface ImportMetaEnv {
  readonly PUBLIC_TURNSTILE_SITE_KEY: string;
  readonly PUBLIC_TRACKING_COUNTRY?: string;
  readonly PUBLIC_TRACKING_CURRENCY?: string;
  readonly PUBLIC_TRACKING_LOCALE?: string;
  /** Vite dev flag — used by consent.ts isDevMode(). */
  readonly DEV?: boolean;
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
