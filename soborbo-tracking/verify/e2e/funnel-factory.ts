/**
 * LAYER: e2e — funnel spec factory.
 *
 * Generic, site-parameterized Playwright scenarios that prove the REAL
 * implementation end-to-end, in a real browser, at the network level. Each
 * scenario encodes a bug that shipped to production:
 *
 *   completion-once   — the primary conversion fires exactly once at
 *                       completion (the retired "upgrade window" fired ~never;
 *                       Ads saw 1 conversion in 14 weeks).
 *   refresh-no-dupe   — F5 on the results page does NOT re-fire (per-mount
 *                       UUIDs defeated the fired-guard until the event_id was
 *                       persisted and quote-fingerprinted).
 *   changed-quote     — going back, changing an input and returning fires a
 *                       NEW conversion with a NEW event_id (the stale-guard
 *                       suppression bug).
 *   callback-race     — the callback conversion's pixel + gateway requests
 *                       leave the browser BEFORE navigation commits (the
 *                       synchronous-redirect race).
 *   phone-value       — a tel: click after completion carries the quote's
 *                       monetary value on both channels.
 *   turnstile-onpage  — the results page really loads the Turnstile pair
 *                       (runtime twin of the dist-layer check).
 *
 * The factory is capability-aware: in a sandbox where googletagmanager.com
 * or challenges.cloudflare.com are unreachable, pixel-level assertions are
 * SKIPPED LOUDLY (annotated on the test) instead of passing silently. Run
 * with VERIFY_STRICT=1 against a real URL to make those skips failures —
 * that is the mode that "excludes" the historical bug classes.
 *
 * A site plugs in via a small typed adapter (see SiteAdapter) that lives in
 * the SITE repo, because only the site knows how to seed a completed funnel
 * state. Side-effect policy: the adapter MUST stub the site's own save/lead
 * APIs (stubSiteApis) so runs create no emails, CRM leads or DB rows; the
 * harness answers all third-party pixels locally with a 204 by default
 * (see network-truth.ts) so nothing reaches production GA4/Ads/Meta.
 */

import { appendFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import { attachNetworkTruth, dataLayerEvents, type NetworkTruth } from './network-truth';

export interface SiteAdapter {
  /** e.g. process.env.VERIFY_BASE_URL — preview URL or local server. */
  baseUrl: string;
  /** Path of the page where the primary conversion fires. */
  resultPath: string;
  /** dataLayer event names. */
  events: { primary: string; callback: string; phone: string };
  /** Canonical event_name values on the gateway wire. */
  gatewayNames: { primary: string; callback: string; phone: string };
  /** Path (or regex) the callback flow navigates to. */
  thankYouPath: string | RegExp;
  /** CSS selector of a tel: link present on the results page. */
  telSelector: string;
  /** CSS selector of the callback CTA on the results page. */
  callbackSelector: string;
  /**
   * Seed a COMPLETED funnel into the browser (sessionStorage/localStorage/
   * cookies) BEFORE the results page loads. `variant.mutate` must produce a
   * DIFFERENT quote (different total or inputs) than the base variant.
   * `variant.gclid` must end up in the site's attribution store.
   */
  seedCompletedState(page: Page, variant: { gclid: string; mutate?: boolean }): Promise<void>;
  /**
   * Stub the site's own APIs (save-quote, callbacks, ...) so no real lead /
   * email / CRM side-effect happens. Returns captured payloads for
   * assertions.
   */
  stubSiteApis(page: Page): Promise<{ saves: () => Array<Record<string, unknown>>; callbacks: () => Array<Record<string, unknown>> }>;
}

const strict = process.env.VERIFY_STRICT === '1';

/** Assert-if-capable: in strict mode a missing capability fails; otherwise
 *  the assertion is skipped with a LOUD annotation (a skip is not a pass).
 *  Skips are ALSO appended to VERIFY_SKIP_FILE (set by run-verify.mjs), so
 *  the orchestrator can downgrade a green Playwright exit to SKIP — without
 *  this, an offline environment would record "e2e PASS" while every
 *  network-level claim went unverified. */
function ifCapable(cap: boolean, what: string, run: () => void | Promise<void>) {
  if (cap) return run();
  const msg = `SKIPPED (capability missing): ${what} — rerun with network access to GTM/Turnstile or VERIFY_STRICT=1 to fail instead`;
  if (strict) throw new Error(msg.replace('SKIPPED', 'STRICT FAIL'));
  test.info().annotations.push({ type: 'verify-skip', description: msg });
  const skipFile = process.env.VERIFY_SKIP_FILE;
  if (skipFile) {
    try { appendFileSync(skipFile, `${msg}\n`); } catch { /* best-effort */ }
  }
  // eslint-disable-next-line no-console
  console.warn(`  ⚠ ${msg}`);
}

const netsInFlight: NetworkTruth[] = [];

async function openResults(page: Page, adapter: SiteAdapter, variant: { gclid: string; mutate?: boolean }) {
  const stubs = await adapter.stubSiteApis(page);
  const net = await attachNetworkTruth(page);
  netsInFlight.push(net);
  // Land once on the origin so storage APIs are available, seed, then load results.
  await page.goto(adapter.baseUrl + '/', { waitUntil: 'domcontentloaded' });
  await adapter.seedCompletedState(page, variant);
  await page.goto(adapter.baseUrl + adapter.resultPath, { waitUntil: 'networkidle' });
  return { net, stubs };
}

export function defineFunnelSpecs(adapter: SiteAdapter): void {
  test.describe('conversion funnel — network truth', () => {
    // Pattern-rot tripwire: a request that reached a known tracking host but
    // matched no specific route was BLOCKED (no pollution), but it means the
    // harness's matchers no longer describe reality — fail loudly.
    test.afterEach(() => {
      for (const net of netsInFlight.splice(0)) {
        expect(
          net.misses.map((m) => m.url),
          'tracking request escaped every specific matcher — update the route patterns in network-truth.ts',
        ).toHaveLength(0);
      }
    });

    test('completion fires the primary conversion exactly once, with attribution', async ({ page }) => {
      const { net, stubs } = await openResults(page, adapter, { gclid: 'VERIFY_GCLID_1' });

      // 1. dataLayer truth: exactly one primary conversion, with a value.
      await expect.poll(() => dataLayerEvents(page, adapter.events.primary)).toHaveLength(1);
      const [ev] = await dataLayerEvents(page, adapter.events.primary);
      expect(ev.event_id, 'conversion must carry an event_id').toBeTruthy();
      expect(Number(ev.value), 'conversion must carry a real value').toBeGreaterThan(0);

      // 2. The site save API was called once and shares the event_id (dedup key).
      await expect.poll(() => stubs.saves()).toHaveLength(1);
      expect(stubs.saves()[0].event_id).toBe(ev.event_id);

      // 1b. SETTLE window, then re-assert "exactly once": expect.poll resolves
      // the instant the count reaches 1, so a duplicate fire arriving a
      // moment later (unguarded second effect run / re-mount — the per-mount
      // UUID bug class) would otherwise pass "exactly once" on timing alone.
      await page.waitForTimeout(2500);
      const settled = await dataLayerEvents(page, adapter.events.primary);
      expect(settled, `a SECOND primary conversion fired after the first was observed (event_ids: ${settled.map((e) => e.event_id).join(', ')})`).toHaveLength(1);
      expect(stubs.saves(), 'a second save-quote call fired after the first was observed').toHaveLength(1);

      // 3. Wire truth: the gateway dispatch left the browser with the SAME
      //    event_id and the seeded gclid. Requires the Turnstile capability.
      await ifCapable(net.capabilities.turnstileLoaded, 'gateway dispatch (Turnstile token)', async () => {
        const hit = await net.waitForGateway((r) => r.payload.event_name === adapter.gatewayNames.primary);
        expect(hit.payload.event_id).toBe(ev.event_id);
        const attribution = hit.payload.attribution as Record<string, unknown> | undefined;
        expect(attribution?.gclid, 'gclid must survive into the gateway payload').toBe('VERIFY_GCLID_1');
        expect(hit.payload.turnstile_token, 'dispatch must carry a Turnstile token').toBeTruthy();
      });

      // 4. Pixel truth: GA4 + Ads requests for the conversion actually left.
      await ifCapable(net.capabilities.gtmLoaded, 'GTM pixel requests', async () => {
        await expect.poll(() => net.ga4Events(adapter.events.primary).length, { timeout: 10_000 }).toBeGreaterThan(0);
        await expect.poll(() => net.ads.length, { timeout: 10_000 }).toBeGreaterThan(0);
      });

      // 4b. Meta browser pixel — separate capability: it needs fbevents.js
      // (connect.facebook.net), which can be unreachable even when GTM loads.
      // Without this assertion the meta bucket was never consulted at all.
      await ifCapable(net.capabilities.metaPixelLoaded, 'Meta browser pixel request', async () => {
        await expect.poll(() => net.meta.length, { timeout: 10_000 }).toBeGreaterThan(0);
      });
    });

    test('refresh does NOT re-fire the conversion (fired-guard survives reload)', async ({ page }) => {
      const { net } = await openResults(page, adapter, { gclid: 'VERIFY_GCLID_2' });
      await expect.poll(() => dataLayerEvents(page, adapter.events.primary)).toHaveLength(1);
      const firstId = (await dataLayerEvents(page, adapter.events.primary))[0].event_id;
      const gatewayBefore = net.gateway.filter((r) => r.payload.event_name === adapter.gatewayNames.primary).length;

      await page.reload({ waitUntil: 'networkidle' });
      // Give any wrong re-fire a chance to happen, then assert it didn't.
      await page.waitForTimeout(2500);
      const after = await dataLayerEvents(page, adapter.events.primary);
      expect(after, `refresh re-fired the conversion (event_ids: ${after.map((e) => e.event_id).join(', ')} vs ${firstId})`).toHaveLength(0);
      const gatewayAfter = net.gateway.filter((r) => r.payload.event_name === adapter.gatewayNames.primary).length;
      expect(gatewayAfter, 'refresh produced a second gateway Lead').toBe(gatewayBefore);
    });

    test('a CHANGED quote fires a NEW conversion with a NEW event_id', async ({ page }) => {
      // First completion.
      await openResults(page, adapter, { gclid: 'VERIFY_GCLID_3' });
      await expect.poll(() => dataLayerEvents(page, adapter.events.primary)).toHaveLength(1);
      const firstId = (await dataLayerEvents(page, adapter.events.primary))[0].event_id;

      // Same tab, quote-affecting input changed (adapter mutates the seed).
      await adapter.seedCompletedState(page, { gclid: 'VERIFY_GCLID_3', mutate: true });
      await page.goto(adapter.baseUrl + adapter.resultPath, { waitUntil: 'networkidle' });
      await expect.poll(() => dataLayerEvents(page, adapter.events.primary), {
        timeout: 10_000,
      }).toHaveLength(1);
      const secondId = (await dataLayerEvents(page, adapter.events.primary))[0].event_id;
      expect(secondId, 'a different quote must mint a different event_id (stale fired-guard would suppress it)').not.toBe(firstId);
    });

    test('callback conversion: pixels + gateway leave the browser BEFORE navigation', async ({ page }) => {
      const { net } = await openResults(page, adapter, { gclid: 'VERIFY_GCLID_4' });
      await expect.poll(() => dataLayerEvents(page, adapter.events.primary)).toHaveLength(1);

      // Timestamp the actual NAVIGATION COMMIT (main frame lands on the
      // thank-you URL) — not "after waitForURL resolved", which would also
      // bless requests issued from the thank-you page itself.
      let navCommitAt = Number.POSITIVE_INFINITY;
      const matchesThankYou = (url: string) =>
        typeof adapter.thankYouPath === 'string' ? url.includes(adapter.thankYouPath) : adapter.thankYouPath.test(url);
      page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame() && matchesThankYou(frame.url()) && !Number.isFinite(navCommitAt)) {
          navCommitAt = Date.now();
        }
      });

      await page.locator(adapter.callbackSelector).first().click();
      await page.waitForURL(adapter.thankYouPath, { timeout: 15_000 });
      expect(Number.isFinite(navCommitAt), 'navigation commit was never observed').toBe(true);

      // The callback conversion's evidence must (a) be ISSUED before the
      // navigation commit and (b) actually be DELIVERED — issue-time alone
      // cannot distinguish "issued-then-cancelled by the teardown" from
      // "delivered", and cancelled-in-flight IS the historical regression.
      // Delivery = finishedAt set (requestfinished) / no `failed`.
      //
      // Honest limitation: the route stubs answer in ~0 ms, so a regression
      // that only loses SLOW real-network requests is compressed out of
      // existence here. What this reliably catches: the dispatch never being
      // issued before teardown, and any issued request the browser then
      // cancelled (requestfailed → failed set, finishedAt never set).
      await ifCapable(net.capabilities.turnstileLoaded, 'callback gateway dispatch', async () => {
        const hit = net.gateway.find((r) => r.payload.event_name === adapter.gatewayNames.callback);
        expect(hit, 'callback gateway dispatch never left the browser — killed by navigation?').toBeTruthy();
        expect(hit!.at, 'gateway dispatch was only issued AFTER the navigation committed').toBeLessThanOrEqual(navCommitAt);
        // A beacon survives navigation by design; a cancelled one means the
        // dispatch was NOT a beacon/keepalive — exactly the regression.
        expect(hit!.failed, `gateway dispatch was cancelled in flight (${hit!.failed ?? ''})`).toBeUndefined();
      });
      await ifCapable(net.capabilities.gtmLoaded, 'callback pixel requests before nav', async () => {
        await expect.poll(
          () => net.ga4Events(adapter.events.callback).some((r) => r.at <= navCommitAt && r.finishedAt !== undefined),
          {
            timeout: 5_000,
            message: 'no GA4 callback hit was BOTH issued before the navigation commit AND delivered — cancelled by the race?',
          },
        ).toBe(true);
      });
    });

    test('tel: click after completion carries the quote value on both channels', async ({ page }) => {
      const { net } = await openResults(page, adapter, { gclid: 'VERIFY_GCLID_5' });
      await expect.poll(() => dataLayerEvents(page, adapter.events.primary)).toHaveLength(1);

      // tel: links don't navigate the page in Chromium — safe to click.
      await page.locator(adapter.telSelector).first().click();
      await expect.poll(() => dataLayerEvents(page, adapter.events.phone)).toHaveLength(1);
      const [ev] = await dataLayerEvents(page, adapter.events.phone);
      expect(Number(ev.value), 'post-quote phone click lost the monetary signal').toBeGreaterThan(0);
      expect(ev.event_id, 'phone conversion must have its own fresh event_id').toBeTruthy();

      await ifCapable(net.capabilities.turnstileLoaded, 'phone gateway dispatch value', async () => {
        const hit = await net.waitForGateway((r) => r.payload.event_name === adapter.gatewayNames.phone);
        expect(Number(hit.payload.value)).toBeGreaterThan(0);
      });
    });

    test('the results page loads the invisible Turnstile pair (runtime check)', async ({ page }) => {
      await openResults(page, adapter, { gclid: 'VERIFY_GCLID_6' });
      await expect(page.locator('#cf-turnstile-invisible')).toHaveCount(1);
      const hasScript = await page.evaluate(() =>
        [...document.querySelectorAll('script[src]')].some((s) =>
          (s as HTMLScriptElement).src.includes('challenges.cloudflare.com/turnstile'),
        ),
      );
      expect(hasScript, 'Turnstile script tag missing from the results page').toBe(true);
    });
  });
}
