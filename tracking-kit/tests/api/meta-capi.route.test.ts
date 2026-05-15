import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// We test the Next.js route handler because it's framework-agnostic at
// the parsing layer (request/response Web standards). The Astro route
// is structurally identical — see ../../src/api/astro/meta-capi.ts.

type CapiCall = [unknown, Array<Record<string, any>>, ...unknown[]];
const sendMetaCapi = vi.fn<(...args: any[]) => Promise<void>>(() => Promise.resolve());

vi.mock('../../src/lib/tracking/server', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/tracking/server')>(
    '../../src/lib/tracking/server',
  );
  return {
    ...actual,
    sendMetaCapi,
  };
});

// The route hardcodes ALLOWED_ORIGINS as a top-level Set. We import it
// after the mock is in place so the route picks up our `sendMetaCapi`.
const routeModule = await import('../../src/api/nextjs/meta-capi.route');
const { POST, OPTIONS } = routeModule;

const GOOD_ORIGIN = 'https://example.com';
const BAD_ORIGIN = 'https://evil.example.com';

const VALID_CONSENT = {
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  analytics_storage: 'granted',
};

function buildRequest(opts: {
  method?: string;
  origin?: string | null;
  ip?: string;
  ua?: string;
  referer?: string;
  body?: unknown;
} = {}): Request {
  const headers = new Headers();
  if (opts.origin !== null && opts.origin !== undefined) headers.set('Origin', opts.origin);
  if (opts.ip) headers.set('x-forwarded-for', opts.ip);
  if (opts.ua) headers.set('User-Agent', opts.ua);
  if (opts.referer) headers.set('Referer', opts.referer);
  if (opts.body !== undefined) headers.set('Content-Type', 'application/json');
  return new Request('https://example.com/api/meta/capi', {
    method: opts.method || 'POST',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

function basePayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    event_name: 'Lead',
    event_id: '123e4567-e89b-12d3-a456-426614174000',
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: `${GOOD_ORIGIN}/quote`,
    user_data: { email: 'alice@example.com', country: 'GB' },
    custom_data: { value: 49.99, currency: 'EUR' },
    consent_state: VALID_CONSENT,
    ...overrides,
  };
}

beforeEach(() => {
  sendMetaCapi.mockClear();
  // Use unique IPs per test to dodge cross-test rate-limit accumulation
  // (the limiter is module-level, shared across tests in the same isolate).
});

afterEach(() => {
  vi.useRealTimers();
});

describe('OPTIONS preflight', () => {
  it('sets allow-origin for an allowed origin', async () => {
    const res = await OPTIONS(buildRequest({ method: 'OPTIONS', origin: GOOD_ORIGIN }));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(GOOD_ORIGIN);
  });

  it('omits allow-origin for a disallowed origin', async () => {
    const res = await OPTIONS(buildRequest({ method: 'OPTIONS', origin: BAD_ORIGIN }));
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});

describe('POST origin gate', () => {
  it('returns 204 with no send when Origin header is missing', async () => {
    const res = await POST(buildRequest({ origin: null, body: basePayload() }));
    expect(res.status).toBe(204);
    expect(sendMetaCapi).not.toHaveBeenCalled();
  });

  it('returns 204 with no send when Origin is not allowed', async () => {
    const res = await POST(buildRequest({ origin: BAD_ORIGIN, body: basePayload() }));
    expect(res.status).toBe(204);
    expect(sendMetaCapi).not.toHaveBeenCalled();
  });
});

describe('POST rate limit', () => {
  it('returns 429 after the per-IP cap is hit', async () => {
    const ip = `rl-${Math.random().toString(36).slice(2, 10)}`;
    const RATE_LIMIT_CAPI_MAX = (await import('../../src/lib/tracking/config'))
      .RATE_LIMIT_CAPI_MAX;
    for (let i = 0; i < RATE_LIMIT_CAPI_MAX; i++) {
      const ok = await POST(buildRequest({ origin: GOOD_ORIGIN, ip, body: basePayload() }));
      expect([204, 400]).toContain(ok.status);
    }
    const blocked = await POST(buildRequest({ origin: GOOD_ORIGIN, ip, body: basePayload() }));
    expect(blocked.status).toBe(429);
  });
});

describe('POST validation', () => {
  it('rejects invalid event_id with 400', async () => {
    const res = await POST(
      buildRequest({
        origin: GOOD_ORIGIN,
        ip: `v-${Math.random()}`,
        body: basePayload({ event_id: '<script>' }),
      }),
    );
    expect(res.status).toBe(400);
    expect(sendMetaCapi).not.toHaveBeenCalled();
  });

  it('rejects an event_name that is not in ALLOWED_EVENTS', async () => {
    const res = await POST(
      buildRequest({
        origin: GOOD_ORIGIN,
        ip: `v-${Math.random()}`,
        body: basePayload({ event_name: 'Purchase' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('swallows invalid JSON (no send, 204)', async () => {
    const req = new Request('https://example.com/api/meta/capi', {
      method: 'POST',
      headers: { Origin: GOOD_ORIGIN, 'Content-Type': 'application/json' },
      body: 'not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(204);
    expect(sendMetaCapi).not.toHaveBeenCalled();
  });
});

describe('POST consent gate', () => {
  it('drops silently (204, no send) when consent_state is denied', async () => {
    const res = await POST(
      buildRequest({
        origin: GOOD_ORIGIN,
        ip: `c-${Math.random()}`,
        body: basePayload({
          consent_state: { ...VALID_CONSENT, ad_user_data: 'denied' },
        }),
      }),
    );
    expect(res.status).toBe(204);
    expect(sendMetaCapi).not.toHaveBeenCalled();
  });

  it('drops silently when consent_state is missing', async () => {
    const payload = basePayload();
    delete (payload as Record<string, unknown>).consent_state;
    const res = await POST(
      buildRequest({ origin: GOOD_ORIGIN, ip: `c-${Math.random()}`, body: payload }),
    );
    expect(res.status).toBe(204);
    expect(sendMetaCapi).not.toHaveBeenCalled();
  });
});

describe('POST happy path', () => {
  it('calls sendMetaCapi exactly once with sanitised event', async () => {
    const res = await POST(
      buildRequest({
        origin: GOOD_ORIGIN,
        ip: `h-${Math.random()}`,
        ua: 'Mozilla/5.0 Test',
        body: basePayload(),
      }),
    );
    expect(res.status).toBe(204);
    expect(sendMetaCapi).toHaveBeenCalledTimes(1);
    const [, events] = sendMetaCapi.mock.calls[0] as CapiCall;
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      event_name: 'Lead',
      event_id: '123e4567-e89b-12d3-a456-426614174000',
      action_source: 'website',
      event_source_url: `${GOOD_ORIGIN}/quote`,
    });
    expect(events[0].user_data.client_user_agent).toBe('Mozilla/5.0 Test');
  });

  it('strips unknown custom_data keys (e.g. predicted_ltv)', async () => {
    await POST(
      buildRequest({
        origin: GOOD_ORIGIN,
        ip: `cd-${Math.random()}`,
        body: basePayload({
          custom_data: {
            value: 50,
            currency: 'EUR',
            content_name: 'Quote',
            predicted_ltv: 1_000_000_000,
            email: 'leak@example.com',
          },
        }),
      }),
    );
    const [, events] = sendMetaCapi.mock.calls[0] as CapiCall;
    expect(events[0].custom_data).toEqual({
      value: 50,
      currency: 'EUR',
      content_name: 'Quote',
    });
  });

  it('drops invalid event_source_url and falls back to a valid Referer', async () => {
    await POST(
      buildRequest({
        origin: GOOD_ORIGIN,
        ip: `src-${Math.random()}`,
        referer: `${GOOD_ORIGIN}/from-referer`,
        body: basePayload({ event_source_url: 'https://evil.com/x' }),
      }),
    );
    const [, events] = sendMetaCapi.mock.calls[0] as CapiCall;
    expect(events[0].event_source_url).toBe(`${GOOD_ORIGIN}/from-referer`);
  });

  it('drops invalid _fbp / _fbc cookies from incoming user_data', async () => {
    await POST(
      buildRequest({
        origin: GOOD_ORIGIN,
        ip: `fb-${Math.random()}`,
        body: basePayload({
          user_data: {
            email: 'a@b.com',
            country: 'GB',
            fbp: 'not-a-valid-fbp',
            fbc: 'not-a-valid-fbc',
          },
        }),
      }),
    );
    const [, events] = sendMetaCapi.mock.calls[0] as CapiCall;
    expect(events[0].user_data.fbp).toBeUndefined();
    expect(events[0].user_data.fbc).toBeUndefined();
  });

  it('caps client_user_agent at 500 chars', async () => {
    const long = 'A'.repeat(2000);
    await POST(
      buildRequest({
        origin: GOOD_ORIGIN,
        ip: `ua-${Math.random()}`,
        ua: long,
        body: basePayload(),
      }),
    );
    const [, events] = sendMetaCapi.mock.calls[0] as CapiCall;
    expect(events[0].user_data.client_user_agent).toHaveLength(500);
  });

  it('captures the client IP into client_ip_address', async () => {
    const ip = '203.0.113.42';
    await POST(buildRequest({ origin: GOOD_ORIGIN, ip, body: basePayload() }));
    const [, events] = sendMetaCapi.mock.calls[0] as CapiCall;
    expect(events[0].user_data.client_ip_address).toBe(ip);
  });

  it.each([
    { name: 'too old', skew: -(48 * 60 * 60) },
    { name: 'too future', skew: 24 * 60 * 60 },
  ])('clamps event_time skew that is $name', async ({ skew }) => {
    const before = Math.floor(Date.now() / 1000);
    await POST(
      buildRequest({
        origin: GOOD_ORIGIN,
        ip: `t-${Math.random()}`,
        body: basePayload({ event_time: before + skew }),
      }),
    );
    const after = Math.floor(Date.now() / 1000);
    const [, events] = sendMetaCapi.mock.calls[0] as CapiCall;
    expect(events[0].event_time).toBeGreaterThanOrEqual(before);
    expect(events[0].event_time).toBeLessThanOrEqual(after + 1);
  });
});
