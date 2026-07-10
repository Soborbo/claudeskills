/**
 * LAYER: e2e — network-truth harness.
 *
 * The ground truth of tracking is not "the dataLayer got a push" — it is
 * "a correctly-formed request LEFT the browser". Two historical bug classes
 * were invisible at the dataLayer level and only visible here:
 *
 *   - synchronous navigation after a push cancelled the Ads/GA4/Meta pixel
 *     requests mid-flight (the push itself "succeeded");
 *   - the gateway dispatch waited for a Turnstile widget that a page never
 *     loaded, and dropped the event after 10s (the dataLayer looked fine).
 *
 * This module intercepts the outbound tracking traffic, records every
 * request as evidence, and — by default — ABORTS third-party requests so
 * test runs never pollute production GA4 / Ads / Meta data. Recording
 * happens before the abort: an aborted-but-recorded request still proves
 * the browser DID try to send it, which is exactly the claim under test.
 *
 * Set forward: true (or VERIFY_FORWARD=1) to let traffic through — e.g. for
 * a one-off post-deploy check where you WANT a real test event to arrive.
 */

import type { Page } from '@playwright/test';

export interface RecordedRequest {
  url: string;
  method: string;
  /** Parsed JSON body for the gateway; query params for pixels. */
  payload: Record<string, unknown>;
  at: number;
}

export interface NetworkTruth {
  /** POSTs to the event-gateway (/api/event/conversion). */
  gateway: RecordedRequest[];
  /** GA4 hits (google-analytics.com/g/collect and regional variants). */
  ga4: RecordedRequest[];
  /** Google Ads conversion pixels (googleadservices / 1p-conversion). */
  ads: RecordedRequest[];
  /** Meta pixel hits (facebook.com/tr). */
  meta: RecordedRequest[];
  /** Environment capabilities detected at runtime — assertions must consult
   *  these instead of failing on an offline sandbox. */
  capabilities: { gtmLoaded: boolean; turnstileLoaded: boolean };
  /** Wait until a gateway request matching `pred` was recorded. */
  waitForGateway(pred: (r: RecordedRequest) => boolean, timeoutMs?: number): Promise<RecordedRequest>;
  /** GA4 hits whose event name (`en` param) matches. */
  ga4Events(name: string): RecordedRequest[];
}

function parseQuery(url: string): Record<string, unknown> {
  try {
    const u = new URL(url);
    const out: Record<string, unknown> = {};
    u.searchParams.forEach((v, k) => { out[k] = v; });
    return out;
  } catch {
    return {};
  }
}

export async function attachNetworkTruth(
  page: Page,
  opts: { forward?: boolean } = {},
): Promise<NetworkTruth> {
  const forward = opts.forward ?? process.env.VERIFY_FORWARD === '1';
  const rec: NetworkTruth = {
    gateway: [],
    ga4: [],
    ads: [],
    meta: [],
    capabilities: { gtmLoaded: false, turnstileLoaded: false },
    async waitForGateway(pred, timeoutMs = 15_000) {
      const deadline = Date.now() + timeoutMs;
      for (;;) {
        const hit = this.gateway.find(pred);
        if (hit) return hit;
        if (Date.now() > deadline) {
          throw new Error(
            `waitForGateway: no matching gateway request within ${timeoutMs}ms. ` +
            `Recorded: ${JSON.stringify(this.gateway.map((r) => r.payload?.event_name ?? r.url))}`,
          );
        }
        await new Promise((r) => setTimeout(r, 100));
      }
    },
    ga4Events(name) {
      return this.ga4.filter((r) => r.payload.en === name || String(r.payload._body ?? '').includes(`en=${name}`));
    },
  };

  // Capability probes — observe, never block.
  page.on('response', (res) => {
    const url = res.url();
    if (url.includes('googletagmanager.com/gtm.js') && res.ok()) rec.capabilities.gtmLoaded = true;
    if (url.includes('challenges.cloudflare.com/turnstile') && res.ok()) rec.capabilities.turnstileLoaded = true;
  });

  // Gateway dispatches: record payload; abort unless forwarding so no test
  // Lead ever reaches Meta CAPI. sendBeacon POSTs are intercepted too.
  await page.route('**/api/event/conversion', async (route) => {
    let payload: Record<string, unknown> = {};
    try { payload = JSON.parse(route.request().postData() ?? '{}'); } catch { /* keep {} */ }
    rec.gateway.push({ url: route.request().url(), method: route.request().method(), payload, at: Date.now() });
    if (forward) return route.continue();
    // 204 mirrors the real gateway's silent-accept contract.
    return route.fulfill({ status: 204, body: '' });
  });

  const pixelRoutes: Array<[string, RecordedRequest[]]> = [
    ['**/*google-analytics.com/g/collect*', rec.ga4],
    ['**/*analytics.google.com/g/collect*', rec.ga4],
    ['**/*googleadservices.com/pagead/conversion*', rec.ads],
    ['**/*google.com/pagead/1p-conversion*', rec.ads],
    ['**/*facebook.com/tr*', rec.meta],
  ];
  for (const [pattern, bucket] of pixelRoutes) {
    await page.route(pattern, async (route) => {
      const url = route.request().url();
      const payload = parseQuery(url);
      const body = route.request().postData();
      if (body) payload._body = body;
      bucket.push({ url, method: route.request().method(), payload, at: Date.now() });
      if (forward) return route.continue();
      return route.fulfill({ status: 204, body: '' });
    });
  }

  return rec;
}

/** dataLayer events of a given name currently on the page. */
export async function dataLayerEvents(page: Page, name: string): Promise<Array<Record<string, unknown>>> {
  return page.evaluate((n) => {
    const dl = (window as unknown as { dataLayer?: Array<Record<string, unknown>> }).dataLayer ?? [];
    return dl.filter((e) => e && e.event === n).map((e) => {
      const { eventCallback: _cb, ...rest } = e as Record<string, unknown> & { eventCallback?: unknown };
      return JSON.parse(JSON.stringify(rest));
    });
  }, name);
}
