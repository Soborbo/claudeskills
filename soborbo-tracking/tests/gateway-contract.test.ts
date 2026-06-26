import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendToWorker, type ConversionPayload } from '../lib/gateway';
import { getDiagnostics } from '../lib/observability';
import { setCookie, setUrl, resetAll } from './helpers';

// NOTE: the gateway's Turnstile-token cache is module-level and persists within
// this file. Tests are ordered so the "no token" case runs FIRST (empty cache),
// then the caching test populates it. resetAll() does not clear that cache.

let renderCalls = 0;

function ckyCookie(ad: boolean, an: boolean): void {
  setCookie('cookieyes-consent',
    `consent:yes,necessary:yes,functional:yes,analytics:${an ? 'yes' : 'no'},advertisement:${ad ? 'yes' : 'no'},other:yes`);
}

function stubTurnstile(token = 'TT'): void {
  renderCalls = 0;
  const div = document.createElement('div');
  div.id = 'cf-turnstile-invisible';
  document.body.appendChild(div);
  (window as unknown as { turnstile: unknown }).turnstile = {
    render: (_c: unknown, opts: { callback?: (t: string) => void }) => { renderCalls++; opts.callback?.(token); return 'wid'; },
    reset: () => {}, execute: () => {}, getResponse: () => token,
  };
}

function basePayload(): ConversionPayload {
  return { event_name: 'phone_conversion', event_id: 'E1', event_time: 1_700_000_000,
    value: 380, currency: 'GBP', user_data: { email: 'a@b.com', phone_number: '07123456789' } };
}

beforeEach(() => {
  resetAll();
  document.body.innerHTML = '';
  delete (window as unknown as { turnstile?: unknown }).turnstile; // each test opts into a stub
});
afterEach(() => vi.unstubAllGlobals());

describe('gateway contract', () => {
  // 1) Runs first while the token cache is empty.
  it('no Turnstile token → higher-risk event skips: no network, returns false, TRK-1001', async () => {
    // window.turnstile is absent → getTurnstileToken yields undefined.
    // contact_form_submit is NOT in the degraded low-risk set, so it is still
    // hard-skipped. (Low-risk click events now dispatch token-less instead —
    // see gateway-degraded.test.ts for that path.)
    const fetchMock = vi.fn((..._a: unknown[]) => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const ok = await sendToWorker({ ...basePayload(), event_name: 'contact_form_submit' });
    expect(ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getDiagnostics().some((d) => d.code === 'TRK-1001')).toBe(true);
  });

  // 2) Populates the cache; proves the token is reused (load speed).
  it('reuses the cached Turnstile token across dispatches (no repeated challenge)', async () => {
    stubTurnstile('TT');
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => true });
    await sendToWorker(basePayload());
    await sendToWorker({ ...basePayload(), event_id: 'E2' });
    expect(renderCalls).toBe(1); // rendered/solved once, cached for the second dispatch
  });

  it('POST body carries the exact server contract (every platform field, right shapes)', async () => {
    ckyCookie(true, true);
    setUrl('/?gclid=G9&utm_source=google&utm_medium=cpc');
    setCookie('_fbp', 'fb.1.123.456');
    setCookie('_fbc', 'fb.1.123.fbclidABC');
    setCookie('_ga', 'GA1.1.111.222');
    setCookie('_ga_ABCDEF', 'GS1.1.1700000000.7.1.1700000050');
    stubTurnstile('TT');
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => false });
    const fetchMock = vi.fn((..._a: unknown[]) => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);

    const ok = await sendToWorker(basePayload());
    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0] as [string, { method: string; headers: Record<string, string>; keepalive?: boolean; body: string }];
    expect(url).toBe('/api/event/conversion');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.keepalive).toBe(true);

    const body = JSON.parse(init.body);
    // identity + dedup
    expect(body.event_name).toBe('phone_conversion');
    expect(body.event_id).toBe('E1');
    expect(Number.isInteger(body.event_time)).toBe(true);
    // value / currency
    expect(body.value).toBe(380);
    expect(body.currency).toBe('GBP');
    // raw user_data for server-side hashing (Meta CAPI contract)
    expect(body.user_data).toEqual({ email: 'a@b.com', phone_number: '07123456789' });
    // bot token
    expect(typeof body.turnstile_token).toBe('string');
    expect(body.turnstile_token.length).toBeGreaterThan(0);
    // Meta cookies + GA ids parsed from cookies
    expect(body.fbp).toBe('fb.1.123.456');
    expect(body.fbc).toBe('fb.1.123.fbclidABC');
    expect(body.client_id).toBe('111.222');          // from _ga
    expect(body.session_id).toBe('1700000000');       // from _ga_<stream>
    // Consent Mode v2 shape (GRANTED/DENIED)
    expect(body.consent.ad_user_data).toBe('GRANTED');
    expect(body.consent.analytics_storage).toBe('GRANTED');
    // attribution (flat string map)
    expect(body.attribution.gclid).toBe('G9');
    expect(body.attribution.utm_source).toBe('google');
    // origin/url
    expect(typeof body.event_source_url).toBe('string');
  });

  it('transport: sendBeacon success returns true without calling fetch', async () => {
    stubTurnstile('TT');
    const beacon = vi.fn(() => true);
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: beacon });
    const fetchMock = vi.fn((..._a: unknown[]) => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);

    expect(await sendToWorker(basePayload())).toBe(true);
    expect(beacon).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('transport: sendBeacon failure falls back to fetch keepalive (TRK-1003)', async () => {
    stubTurnstile('TT');
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => false });
    const fetchMock = vi.fn((..._a: unknown[]) => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);

    expect(await sendToWorker(basePayload())).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(getDiagnostics().some((d) => d.code === 'TRK-1003')).toBe(true);
  });

  it('worker unreachable: fetch rejects → returns false (no throw) and TRK-1002 is reported', async () => {
    stubTurnstile('TT');
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => false });
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network down'))));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const ok = await sendToWorker(basePayload());
    expect(ok).toBe(false); // surfaced, not thrown — the page/lead is not stuck
    const fail = getDiagnostics().find((d) => d.code === 'TRK-1002');
    expect(fail).toBeTruthy();
    expect(fail!.severity).toBe('error');
    expect(fail!.context?.event_name).toBe('phone_conversion');
  });
});
