import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// trackingConfig is computed at module load from import.meta.env → each case
// stubs the env, resets the module registry, and re-imports fresh.
beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllEnvs());

describe('trackingConfig — per-site market config from PUBLIC_ env', () => {
  it('vitest env (HU site) is picked up: HU / HUF / hu', async () => {
    const { trackingConfig } = await import('../lib/config');
    expect(trackingConfig.country).toBe('HU');
    expect(trackingConfig.currency).toBe('HUF');
    expect(trackingConfig.locale).toBe('hu');
  });

  it('unset env → GB / GBP / en defaults (the UK-first default market)', async () => {
    vi.stubEnv('PUBLIC_TRACKING_COUNTRY', '');
    vi.stubEnv('PUBLIC_TRACKING_CURRENCY', '');
    vi.stubEnv('PUBLIC_TRACKING_LOCALE', '');
    const { trackingConfig } = await import('../lib/config');
    expect(trackingConfig.country).toBe('GB');
    expect(trackingConfig.currency).toBe('GBP');
    expect(trackingConfig.locale).toBe('en');
  });

  it('explicit override wins (e.g. an EUR site)', async () => {
    vi.stubEnv('PUBLIC_TRACKING_COUNTRY', 'GB');
    vi.stubEnv('PUBLIC_TRACKING_CURRENCY', 'EUR');
    vi.stubEnv('PUBLIC_TRACKING_LOCALE', 'en');
    const { trackingConfig } = await import('../lib/config');
    expect(trackingConfig.country).toBe('GB');
    expect(trackingConfig.currency).toBe('EUR');
    expect(trackingConfig.locale).toBe('en');
  });
});
