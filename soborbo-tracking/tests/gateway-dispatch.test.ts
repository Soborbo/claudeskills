import { describe, it, expect, vi } from 'vitest';
import {
  gatewayBaseUrl, isGatewayConfigured, readConsentFromCookie, resolveTestEventCode,
  buildGatewayPayload, sendGatewayConversion,
  type GatewayEnv, type GatewayConversionInput,
} from '../server/backend/gateway-dispatch';

// A BACKEND leg — ez viszi az ÖSSZES server_ingress_only (pénzes) konverziót.
// Minden itt tesztelt kontraktus megsértése néma konverzióvesztés vagy
// duplaszámolás élesben (lásd a modul fejlécének 5 kontraktusát).

const okResponse = (status = 200) => new Response('{}', { status });

function envWith(overrides: Partial<GatewayEnv> = {}): GatewayEnv {
  return {
    TRACKING_GATEWAY_TOKEN: 'tok-123',
    SITE_URL: 'https://lomtalan.hu',
    ...overrides,
  };
}

const INPUT: GatewayConversionInput = {
  eventName: 'quote_calculator_submitted',
  eventId: 'ev-1',
  value: 200000,
  currency: 'HUF',
  userData: { email: 'a@b.hu', phone_number: '+36301234567' },
};

describe('gatewayBaseUrl / isGatewayConfigured', () => {
  it('strips trailing slashes; undefined without SITE_URL', () => {
    expect(gatewayBaseUrl({ SITE_URL: 'https://x.hu///' })).toBe('https://x.hu');
    expect(gatewayBaseUrl({})).toBeUndefined();
  });

  it('configured only with token + binding + SITE_URL together', () => {
    const binding = { fetch: vi.fn() };
    expect(isGatewayConfigured({ TRACKING_GATEWAY_TOKEN: 't', GATEWAY: binding, SITE_URL: 'https://x.hu' })).toBe(true);
    expect(isGatewayConfigured({ GATEWAY: binding, SITE_URL: 'https://x.hu' })).toBe(false);
    expect(isGatewayConfigured({ TRACKING_GATEWAY_TOKEN: 't', SITE_URL: 'https://x.hu' })).toBe(false);
    expect(isGatewayConfigured({ TRACKING_GATEWAY_TOKEN: 't', GATEWAY: binding })).toBe(false);
  });
});

describe('readConsentFromCookie — the same mapping as the browser leg', () => {
  const header = (cky: string) => `foo=bar; cookieyes-consent=${encodeURIComponent(cky)}; other=1`;

  it('advertisement:yes → all three ad signals GRANTED; analytics independent', () => {
    const c = readConsentFromCookie(header('consentid:x,consent:yes,necessary:yes,analytics:no,advertisement:yes'))!;
    expect(c.ad_storage).toBe('GRANTED');
    expect(c.ad_user_data).toBe('GRANTED');
    expect(c.ad_personalization).toBe('GRANTED');
    expect(c.analytics_storage).toBe('DENIED');
  });

  it('advertisement:no → ad signals DENIED even with analytics:yes', () => {
    const c = readConsentFromCookie(header('necessary:yes,analytics:yes,advertisement:no'))!;
    expect(c.ad_storage).toBe('DENIED');
    expect(c.analytics_storage).toBe('GRANTED');
  });

  it('no Cookie header / no cookieyes cookie / non-CookieYes value → undefined (never guess)', () => {
    expect(readConsentFromCookie(null)).toBeUndefined();
    expect(readConsentFromCookie('sessionid=abc; theme=dark')).toBeUndefined();
    expect(readConsentFromCookie('cookieyes-consent=gibberish-without-categories')).toBeUndefined();
  });
});

describe('resolveTestEventCode — keyed on the synthetic lead address, never global', () => {
  const env = envWith({ TRACKING_TEST_LEAD_EMAIL: 'Smoke@Soborbo.co.uk', TRACKING_TEST_EVENT_CODE: 'TEST123' });

  it('matches case- and whitespace-insensitively', () => {
    expect(resolveTestEventCode(env, '  smoke@soborbo.CO.UK ')).toBe('TEST123');
  });

  it('a REAL lead is never diverted to the test stream', () => {
    expect(resolveTestEventCode(env, 'real.customer@gmail.com')).toBeUndefined();
  });

  it('missing marker / code / email → undefined', () => {
    expect(resolveTestEventCode(envWith(), 'smoke@soborbo.co.uk')).toBeUndefined();
    expect(resolveTestEventCode(env, undefined)).toBeUndefined();
  });
});

describe('buildGatewayPayload — the five contracts', () => {
  it('carries event_name/event_id/lead_id + positive value with currency', () => {
    const p = buildGatewayPayload({ ...INPUT, leadId: 'crm-42' });
    expect(p.event_name).toBe('quote_calculator_submitted');
    expect(p.event_id).toBe('ev-1');
    expect(p.lead_id).toBe('crm-42');
    expect(p.value).toBe(200000);
    expect(p.currency).toBe('HUF');
    expect(typeof p.event_time).toBe('number');
  });

  it('contract #4: value 0 / negative / missing currency → value AND currency both omitted', () => {
    for (const bad of [
      { ...INPUT, value: 0 },
      { ...INPUT, value: -5 },
      { ...INPUT, value: 100, currency: undefined },
      { ...INPUT, value: 100, currency: 'FORINT' }, // not 3-letter ISO
      { ...INPUT, value: Number.NaN },
    ]) {
      const p = buildGatewayPayload(bad as GatewayConversionInput);
      expect(p.value, JSON.stringify(bad)).toBeUndefined();
      expect(p.currency, JSON.stringify(bad)).toBeUndefined();
    }
  });

  it('compacts empty PII fields and omits empty user_data/attribution wholesale', () => {
    const p = buildGatewayPayload({
      eventName: 'contact_form_submitted', eventId: 'e',
      userData: { email: 'a@b.hu', phone_number: '', first_name: undefined },
      attribution: { gclid: '', utm_source: undefined as unknown as string },
    });
    expect((p.user_data as Record<string, unknown>).email).toBe('a@b.hu');
    expect((p.user_data as Record<string, unknown>).phone_number).toBeUndefined();
    expect(p.attribution).toBeUndefined(); // everything compacted away → omitted
  });

  it('NEVER contains a turnstile_token (retired mechanism that silently ate conversions)', () => {
    const p = buildGatewayPayload(INPUT);
    expect('turnstile_token' in p).toBe(false);
  });
});

describe('sendGatewayConversion — transport + retry policy', () => {
  it('not configured → instant loud failure, zero attempts', async () => {
    const r = await sendGatewayConversion({}, INPUT);
    expect(r).toEqual({ ok: false, error: 'gateway_not_configured', retriable: false, attempts: 0 });
  });

  it('POSTs the site-scoped conversion-server URL with the x-admin-token header', async () => {
    const fetchImpl = vi.fn(() => Promise.resolve(okResponse()));
    const r = await sendGatewayConversion(envWith(), INPUT, { fetchImpl });
    expect(r.ok).toBe(true);
    expect(r.attempts).toBe(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://lomtalan.hu/api/event/conversion-server');
    expect((init.headers as Record<string, string>)['x-admin-token']).toBe('tok-123');
    const body = JSON.parse(init.body as string);
    expect(body.event_id).toBe('ev-1');
    expect(body.value).toBe(200000);
  });

  it('auto-resolves the test_event_code for the designated synthetic lead only', async () => {
    const env = envWith({ TRACKING_TEST_LEAD_EMAIL: 'smoke@soborbo.co.uk', TRACKING_TEST_EVENT_CODE: 'TESTX' });
    const fetchImpl = vi.fn(() => Promise.resolve(okResponse()));

    const calls = fetchImpl.mock.calls as unknown as [string, RequestInit][];
    await sendGatewayConversion(env, { ...INPUT, userData: { email: 'smoke@soborbo.co.uk' } }, { fetchImpl });
    expect(JSON.parse(calls[0][1].body as string).test_event_code).toBe('TESTX');

    await sendGatewayConversion(env, { ...INPUT, userData: { email: 'real@customer.hu' } }, { fetchImpl });
    expect(JSON.parse(calls[1][1].body as string).test_event_code).toBeUndefined();
  });

  it.each([400, 401, 403, 404])('contract #5: %s is NON-retriable — one attempt, no sleep', async (status) => {
    const fetchImpl = vi.fn(() => Promise.resolve(okResponse(status)));
    const sleepImpl = vi.fn(() => Promise.resolve());
    const r = await sendGatewayConversion(envWith(), INPUT, { fetchImpl, sleepImpl });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(status);
    expect(r.error).toBe(`gateway_rejected_${status}`);
    expect(r.retriable).toBe(false);
    expect(r.attempts).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(sleepImpl).not.toHaveBeenCalled();
  });

  it('5xx retries through the backoff schedule, then reports retriable', async () => {
    const fetchImpl = vi.fn(() => Promise.resolve(okResponse(503)));
    const sleepImpl = vi.fn(() => Promise.resolve());
    const r = await sendGatewayConversion(envWith(), INPUT, { fetchImpl, sleepImpl, retryDelaysMs: [400, 1200] });
    expect(r.ok).toBe(false);
    expect(r.retriable).toBe(true);
    expect(r.error).toBe('gateway_status_503');
    expect(r.attempts).toBe(3); // initial + 2 retries
    expect((sleepImpl.mock.calls as unknown as [number][]).map((c) => c[0])).toEqual([400, 1200]);
  });

  it('recovers when a retry succeeds', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(okResponse(503))
      .mockResolvedValueOnce(okResponse(200));
    const sleepImpl = vi.fn(() => Promise.resolve());
    const r = await sendGatewayConversion(envWith(), INPUT, { fetchImpl, sleepImpl });
    expect(r.ok).toBe(true);
    expect(r.attempts).toBe(2);
    expect(sleepImpl).toHaveBeenCalledTimes(1);
  });

  it('network throw is retriable and surfaces the error message', async () => {
    const fetchImpl = vi.fn(() => Promise.reject(new Error('binding exploded')));
    const sleepImpl = vi.fn(() => Promise.resolve());
    const r = await sendGatewayConversion(envWith(), INPUT, { fetchImpl, sleepImpl, retryDelaysMs: [10] });
    expect(r.ok).toBe(false);
    expect(r.retriable).toBe(true);
    expect(r.error).toBe('binding exploded');
    expect(r.attempts).toBe(2);
  });

  it('uses the GATEWAY service binding when no fetchImpl override is given', async () => {
    const bindingFetch = vi.fn(() => Promise.resolve(okResponse()));
    const env = envWith({ GATEWAY: { fetch: bindingFetch } });
    const r = await sendGatewayConversion(env, INPUT);
    expect(r.ok).toBe(true);
    expect(bindingFetch).toHaveBeenCalledTimes(1);
  });
});

describe('remaining transport branches', () => {
  it('uses the real default backoff sleeper when none injected (tiny delays)', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response('{}', { status: 503 }))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));
    const r = await sendGatewayConversion(envWith(), INPUT, { fetchImpl, retryDelaysMs: [1] });
    expect(r.ok).toBe(true);
    expect(r.attempts).toBe(2);
  });

  it('an all-empty userData object is omitted wholesale from the payload', () => {
    const p = buildGatewayPayload({ eventName: 'contact_form_submitted', eventId: 'e', userData: { email: '', phone_number: undefined } });
    expect(p.user_data).toBeUndefined();
  });

  it('a non-Error rejection is stringified into the result error', async () => {
    const fetchImpl = vi.fn(() => Promise.reject('plain-string-reason'));
    const sleepImpl = vi.fn(() => Promise.resolve());
    const r = await sendGatewayConversion(envWith(), INPUT, { fetchImpl, sleepImpl, retryDelaysMs: [] });
    expect(r.ok).toBe(false);
    expect(r.error).toBe('plain-string-reason');
  });
});
