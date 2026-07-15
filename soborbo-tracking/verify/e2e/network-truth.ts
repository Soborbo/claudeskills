/**
 * LAYER: e2e — network-truth harness.
 *
 * The ground truth of tracking is not "the dataLayer got a push" — it is
 * "a correctly-formed request LEFT the browser and was DELIVERED". Two
 * historical bug classes were invisible at the dataLayer level and only
 * visible here:
 *
 *   - synchronous navigation after a push cancelled the Ads/GA4/Meta pixel
 *     requests mid-flight (the push itself "succeeded");
 *   - the gateway dispatch waited for a Turnstile widget that a page never
 *     loaded, and dropped the event after 10s (the dataLayer looked fine).
 *
 * This module intercepts the outbound tracking traffic, records every
 * request as evidence, and — by default — answers third-party requests
 * LOCALLY with a 204 so test runs never pollute production GA4 / Ads /
 * Meta data. Two layers of evidence per request:
 *
 *   at         — issue time. Proves the browser TRIED to send it.
 *   finishedAt — requestfinished time. Proves the request was DELIVERED
 *                (a request cancelled by navigation teardown gets `failed`
 *                instead, never `finishedAt`). Race-class assertions must
 *                check finishedAt/!failed — issue-time alone cannot
 *                distinguish "issued-then-cancelled" from "delivered".
 *
 * Route patterns are RegExp, not globs: Playwright's glob `*` does not
 * match `/`, and real pixel URLs carry path segments after the prefix
 * (e.g. googleadservices.com/pagead/conversion/123456789/). Globs here
 * silently let REAL conversion pixels through to production — the exact
 * failure this harness exists to prevent. A blocking catch-all over the
 * known tracking hosts backstops pattern rot: anything it catches was
 * missed by a specific matcher — it is blocked anyway, recorded in
 * `misses`, and warned about loudly.
 *
 * Known residual: a GA4 tag configured with server_container_url (custom
 * first-party collect domain) is invisible to both the matchers and the
 * catch-all. If the site moves to sGTM, extend `pixelRoutes` AND the
 * capability probes — otherwise the gtmLoaded probe goes permanently
 * false and every pixel assertion skips.
 *
 * Set forward: true (or VERIFY_FORWARD=1) to let traffic through — e.g. for
 * a one-off post-deploy check where you WANT a real test event to arrive.
 */

import type { Page, Request } from '@playwright/test';

export interface RecordedRequest {
  url: string;
  method: string;
  /** Parsed JSON body for the gateway; query params for pixels. */
  payload: Record<string, unknown>;
  /** Issue time — the browser handed the request to the network stack. */
  at: number;
  /** Set when requestfinished fired — the response was actually delivered. */
  finishedAt?: number;
  /** Set when requestfailed fired (errorText) — cancelled/aborted, e.g. by
   *  navigation teardown. A failed request is NOT evidence of delivery. */
  failed?: string;
}

export interface NetworkTruth {
  /** POSTs to the event-gateway (/api/event/conversion). */
  gateway: RecordedRequest[];
  /** GA4 hits (google-analytics.com/g/collect and regional variants). */
  ga4: RecordedRequest[];
  /** Google Ads conversion pixels (googleadservices conversion /
   *  1p-conversion / doubleclick viewthroughconversion). */
  ads: RecordedRequest[];
  /** Meta pixel hits (facebook.com/tr and /tr/). */
  meta: RecordedRequest[];
  /** Requests to known tracking hosts that NO specific matcher claimed —
   *  blocked (never forwarded) and recorded here. Non-empty misses mean
   *  the route patterns have rotted; treat as a harness bug. */
  misses: RecordedRequest[];
  /** Environment capabilities detected at runtime — assertions must consult
   *  these instead of failing on an offline sandbox. */
  capabilities: { gtmLoaded: boolean; turnstileLoaded: boolean; metaPixelLoaded: boolean };
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
    misses: [],
    capabilities: { gtmLoaded: false, turnstileLoaded: false, metaPixelLoaded: false },
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

  // Delivery tracking: requestfinished = the response reached the page;
  // requestfailed = cancelled/aborted (navigation teardown, net error).
  const inflight = new Map<Request, RecordedRequest>();
  page.on('requestfinished', (req) => {
    const r = inflight.get(req);
    if (r) { r.finishedAt = Date.now(); inflight.delete(req); }
  });
  page.on('requestfailed', (req) => {
    const r = inflight.get(req);
    if (r) { r.failed = req.failure()?.errorText ?? 'failed'; inflight.delete(req); }
  });

  // Capability probes — observe, never block. (These are script LOADS, so
  // they must not appear in any blocking route below.)
  page.on('response', (res) => {
    const url = res.url();
    if (url.includes('googletagmanager.com/gtm.js') && res.ok()) rec.capabilities.gtmLoaded = true;
    if (url.includes('challenges.cloudflare.com/turnstile') && res.ok()) rec.capabilities.turnstileLoaded = true;
    if (url.includes('connect.facebook.net') && res.ok()) rec.capabilities.metaPixelLoaded = true;
  });

  const recordAndFulfill = (bucket: RecordedRequest[]) =>
    async (route: Parameters<Parameters<Page['route']>[1]>[0]) => {
      const url = route.request().url();
      const payload = parseQuery(url);
      const body = route.request().postData();
      if (body) payload._body = body;
      const entry: RecordedRequest = { url, method: route.request().method(), payload, at: Date.now() };
      inflight.set(route.request(), entry);
      bucket.push(entry);
      if (forward) return route.continue();
      return route.fulfill({ status: 204, body: '' });
    };

  // Miss-detector catch-all over the known tracking HIT hosts (never the
  // script loaders — gtm.js / fbevents.js / turnstile must keep loading).
  // Registered FIRST so it is checked LAST (Playwright matches routes in
  // reverse registration order): anything landing here escaped every
  // specific matcher below. Block it regardless — the no-pollution
  // guarantee must not depend on the specific patterns being right.
  const MISS_RE = /google-analytics\.com|analytics\.google\.com\/g\/collect|googleadservices\.com|googleads\.g\.doubleclick\.net|google\.com\/(?:pagead|ccm)\/|facebook\.com\/tr/;
  await page.route(MISS_RE, async (route) => {
    // Script LOADS (conversion_async.js etc.) are not tracking hits — 204-ing
    // them would break the very tags whose pixels we assert on.
    if (route.request().resourceType() === 'script') return route.continue();
    const url = route.request().url();
    const entry: RecordedRequest = { url, method: route.request().method(), payload: parseQuery(url), at: Date.now() };
    inflight.set(route.request(), entry);
    rec.misses.push(entry);
    // eslint-disable-next-line no-console
    console.warn(`  ⚠ network-truth MISS: ${url} hit a known tracking host but matched no specific pattern — blocked; fix the route patterns`);
    return route.fulfill({ status: 204, body: '' });
  });

  // Gateway dispatches: record payload; answer locally unless forwarding so
  // no test Lead ever reaches Meta CAPI. sendBeacon POSTs are intercepted
  // too. RegExp, not exact glob: a future query param or trailing slash must
  // not silently un-intercept the dispatch.
  await page.route(/\/api\/event\/conversion(?:\/|\?|$)/, async (route) => {
    let payload: Record<string, unknown> = {};
    try { payload = JSON.parse(route.request().postData() ?? '{}'); } catch { /* keep {} */ }
    const entry: RecordedRequest = { url: route.request().url(), method: route.request().method(), payload, at: Date.now() };
    inflight.set(route.request(), entry);
    rec.gateway.push(entry);
    if (forward) return route.continue();
    // 204 mirrors the real gateway's silent-accept contract.
    return route.fulfill({ status: 204, body: '' });
  });

  // Pixel matchers — RegExp against REAL URL shapes. Notes per line:
  //   GA4:  /g/collect on the main + regional (region1.) domains.
  //   Ads:  the conversion id is a PATH SEGMENT (…/conversion/123456789/?…);
  //         a glob with `*` (which never matches `/`) misses every real hit.
  //         `conversion\/` (with the slash) deliberately EXCLUDES the
  //         conversion_async.js script load on the same path prefix.
  //   Meta: modern fbevents sends facebook.com/tr/?… (slash before the
  //         query) — match both /tr? and /tr/?.
  const pixelRoutes: Array<[RegExp, RecordedRequest[]]> = [
    [/(?:google-analytics\.com|analytics\.google\.com)\/g\/collect/, rec.ga4],
    [/googleadservices\.com\/pagead\/conversion\//, rec.ads],
    [/google\.com\/pagead\/1p-conversion/, rec.ads],
    [/google\.com\/ccm\/collect/, rec.ads],
    [/googleads\.g\.doubleclick\.net\/pagead\/viewthroughconversion/, rec.ads],
    [/facebook\.com\/tr[/?]/, rec.meta],
  ];
  for (const [pattern, bucket] of pixelRoutes) {
    await page.route(pattern, recordAndFulfill(bucket));
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
