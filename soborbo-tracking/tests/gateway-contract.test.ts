import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendToWorker, type ConversionPayload } from '../lib/gateway';
import { SERVER_INGRESS_ONLY_EVENTS, BROWSER_GATEWAY_EVENTS } from '../lib/event-contract';
import { getDiagnostics, clearDiagnostics } from '../lib/observability';
import { setCookie, setUrl, resetAll } from './helpers';

function ckyCookie(ad: boolean, an: boolean): void {
  setCookie('cookieyes-consent',
    `consent:yes,necessary:yes,functional:yes,analytics:${an ? 'yes' : 'no'},advertisement:${ad ? 'yes' : 'no'},other:yes`);
}

function basePayload(): ConversionPayload {
  return { event_name: 'phone_number_clicked', event_id: 'E1', event_time: 1_700_000_000,
    value: 380, currency: 'GBP', user_data: { email: 'a@b.com', phone_number: '07123456789' } };
}

beforeEach(() => {
  resetAll();
  clearDiagnostics();
  document.body.innerHTML = '';
});
afterEach(() => vi.unstubAllGlobals());

describe('gateway contract (browser path, Run 6)', () => {
  it('POST body carries the exact server contract (every platform field, right shapes)', async () => {
    ckyCookie(true, true);
    setUrl('/?gclid=G9&utm_source=google&utm_medium=cpc');
    setCookie('_fbp', 'fb.1.123.456');
    setCookie('_fbc', 'fb.1.123.fbclidABC');
    setCookie('_ga', 'GA1.1.111.222');
    setCookie('_ga_ABCDEF', 'GS1.1.1700000000.7.1.1700000050');
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
    expect(body.event_name).toBe('phone_number_clicked');
    expect(body.event_id).toBe('E1');
    expect(Number.isInteger(body.event_time)).toBe(true);
    // value / currency
    expect(body.value).toBe(380);
    expect(body.currency).toBe('GBP');
    // raw user_data for server-side hashing (Meta CAPI contract)
    expect(body.user_data).toEqual({ email: 'a@b.com', phone_number: '07123456789' });
    // NO bot token — the Turnstile gate is retired; Origin allow-list is server-side
    expect(body.turnstile_token).toBeUndefined();
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

  it('EVERY server-ingress-only event is blocked client-side: no beacon, no fetch, TRK-1005', async () => {
    const beacon = vi.fn(() => true);
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: beacon });
    const fetchMock = vi.fn((..._a: unknown[]) => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(SERVER_INGRESS_ONLY_EVENTS.size).toBeGreaterThan(0);
    for (const name of SERVER_INGRESS_ONLY_EVENTS) {
      clearDiagnostics();
      const ok = await sendToWorker({ ...basePayload(), event_name: name });
      expect(ok, name).toBe(false);
      const diag = getDiagnostics().find((d) => d.code === 'TRK-1005');
      expect(diag, name).toBeTruthy();
      expect(diag!.context?.event_name, name).toBe(name);
    }
    expect(beacon).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('an event name OUTSIDE the browser allow-list is blocked too (unknown names cannot leak)', async () => {
    const beacon = vi.fn(() => true);
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: beacon });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(BROWSER_GATEWAY_EVENTS.has('lead_qualified')).toBe(false); // offline CRM event
    const ok = await sendToWorker({ ...basePayload(), event_name: 'lead_qualified' });
    expect(ok).toBe(false);
    expect(beacon).not.toHaveBeenCalled();
    expect(getDiagnostics().some((d) => d.code === 'TRK-1005')).toBe(true);
  });

  it('transport: sendBeacon success returns true without calling fetch', async () => {
    const beacon = vi.fn(() => true);
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: beacon });
    const fetchMock = vi.fn((..._a: unknown[]) => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);

    expect(await sendToWorker(basePayload())).toBe(true);
    expect(beacon).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('transport: sendBeacon failure falls back to fetch keepalive (TRK-1003)', async () => {
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => false });
    const fetchMock = vi.fn((..._a: unknown[]) => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);

    expect(await sendToWorker(basePayload())).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(getDiagnostics().some((d) => d.code === 'TRK-1003')).toBe(true);
  });

  it('fetch fallback INSPECTS the status: a 403 returns false and reports TRK-1006', async () => {
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => false });
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('Forbidden origin', { status: 403 }))));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const ok = await sendToWorker(basePayload());
    expect(ok).toBe(false); // the old code reported GATEWAY_OK here — that lie hid a 403 outage
    const rej = getDiagnostics().find((d) => d.code === 'TRK-1006');
    expect(rej).toBeTruthy();
    expect(rej!.severity).toBe('error');
    expect(rej!.context?.status).toBe(403);
  });

  it('worker unreachable: fetch rejects → returns false (no throw) and TRK-1002 is reported', async () => {
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => false });
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network down'))));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const ok = await sendToWorker(basePayload());
    expect(ok).toBe(false); // surfaced, not thrown — the page/lead is not stuck
    const fail = getDiagnostics().find((d) => d.code === 'TRK-1002');
    expect(fail).toBeTruthy();
    expect(fail!.severity).toBe('error');
    expect(fail!.context?.event_name).toBe('phone_number_clicked');
  });
});
