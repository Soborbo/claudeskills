/**
 * Static checks on the kit's env contract and the route scaffolds.
 *
 * These intentionally inspect SOURCE FILES, not a running Cloudflare
 * environment. The kit is shipped as a template: the assertion here is
 * that the contract is correct (right keys named, right routes mounted,
 * placeholders flagged in scan-forbidden-patterns) — not that a specific
 * deployment is wired up. The deployment-time check lives in your
 * Cloudflare Worker / Pages env, not in this repo.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');

function read(rel: string): string {
  return readFileSync(path.join(repoRoot, rel), 'utf8');
}

describe('.env.example contract', () => {
  const env = read('.env.example');

  it.each([
    'GTM_ID',
    'GA4_MEASUREMENT_ID',
    'GA4_API_SECRET',
    'META_PIXEL_ID',
    'META_CAPI_ACCESS_TOKEN',
  ])('declares %s', (key) => {
    expect(env).toMatch(new RegExp(`^${key}=`, 'm'));
  });

  it('declares META_CAPI_TEST_EVENT_CODE as empty (validation-only flag)', () => {
    expect(env).toMatch(/^META_CAPI_TEST_EVENT_CODE=$/m);
  });

  it('names PUBLIC_-prefixed variants for bundler exposure', () => {
    expect(env).toMatch(/^PUBLIC_GTM_ID=/m);
    expect(env).toMatch(/^NEXT_PUBLIC_GTM_ID=/m);
  });
});

describe('route mounts', () => {
  it('Astro Meta CAPI route exists at the expected path', () => {
    expect(() => read('src/api/astro/meta-capi.ts')).not.toThrow();
  });

  it('Astro abandonment route exists', () => {
    expect(() => read('src/api/astro/abandonment.ts')).not.toThrow();
  });

  it('Next.js Meta CAPI route exists', () => {
    expect(() => read('src/api/nextjs/meta-capi.route.ts')).not.toThrow();
  });

  it('Next.js abandonment route exists', () => {
    expect(() => read('src/api/nextjs/abandonment.route.ts')).not.toThrow();
  });
});

describe('endpoint paths match the client config', () => {
  it('META_CAPI_ENDPOINT matches /api/meta/capi', async () => {
    const cfg = await import('../../src/lib/tracking/config');
    expect(cfg.META_CAPI_ENDPOINT).toBe('/api/meta/capi');
  });

  it('ABANDONMENT_BEACON_URL matches /api/track/abandonment', async () => {
    const cfg = await import('../../src/lib/tracking/config');
    expect(cfg.ABANDONMENT_BEACON_URL).toBe('/api/track/abandonment');
  });
});

describe('runtime safety contract', () => {
  it('Astro Meta CAPI route disables prerender (must be server-rendered)', () => {
    expect(read('src/api/astro/meta-capi.ts')).toMatch(/export\s+const\s+prerender\s*=\s*false/);
  });

  it('Astro abandonment route disables prerender', () => {
    expect(read('src/api/astro/abandonment.ts')).toMatch(/export\s+const\s+prerender\s*=\s*false/);
  });

  it('Next.js Meta CAPI route declares a runtime (edge or nodejs)', () => {
    expect(read('src/api/nextjs/meta-capi.route.ts')).toMatch(
      /export\s+const\s+runtime\s*=\s*['"](?:edge|nodejs)['"]/,
    );
  });
});

describe('production deploy gate (skipped by default)', () => {
  // Set CHECK_PROD_ORIGINS=1 in CI for the production branch to force
  // these. Locally / on PRs they're skipped because the kit ships with
  // example.com placeholders that get replaced at deploy time.
  const enabled = process.env.CHECK_PROD_ORIGINS === '1';

  (enabled ? it : it.skip)('production routes do not contain example.com', () => {
    for (const file of [
      'src/api/astro/meta-capi.ts',
      'src/api/astro/abandonment.ts',
      'src/api/nextjs/meta-capi.route.ts',
      'src/api/nextjs/abandonment.route.ts',
    ]) {
      expect(read(file)).not.toMatch(/example\.com/);
    }
  });

  (enabled ? it : it.skip)('production env has Meta test code unset', () => {
    expect(process.env.META_CAPI_TEST_EVENT_CODE || '').toBe('');
  });
});
