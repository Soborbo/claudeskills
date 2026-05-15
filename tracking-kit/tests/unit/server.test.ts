import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_CONVERSION_VALUE,
  checkRateLimit,
  corsPreflightResponse,
  isAllowedOrigin,
  isValidConversionValue,
  isValidCurrency,
  isValidEmail,
  isValidEventId,
  isValidFbc,
  isValidFbp,
  metaCapiConsentAllowed,
  pickEventSourceUrl,
  readGa4IdsFromCookie,
  sendGA4MP,
  sendMetaCapi,
} from '../../src/lib/tracking/server';
import { RATE_LIMIT_WINDOW_MS } from '../../src/lib/tracking/config';

describe('isAllowedOrigin', () => {
  const allowed = new Set(['https://example.com', 'https://www.example.com']);

  it('rejects null Origin (no curl/server-to-server)', () => {
    expect(isAllowedOrigin(null, allowed)).toBe(false);
  });

  it('rejects an origin not in the allowlist', () => {
    expect(isAllowedOrigin('https://evil.example.com', allowed)).toBe(false);
  });

  it('accepts an origin in the allowlist', () => {
    expect(isAllowedOrigin('https://example.com', allowed)).toBe(true);
    expect(isAllowedOrigin('https://www.example.com', allowed)).toBe(true);
  });

  it('is case-sensitive (https !== HTTPS)', () => {
    expect(isAllowedOrigin('HTTPS://example.com', allowed)).toBe(false);
  });
});

describe('metaCapiConsentAllowed', () => {
  it('rejects undefined / null / non-object input', () => {
    expect(metaCapiConsentAllowed(undefined)).toBe(false);
    expect(metaCapiConsentAllowed(null)).toBe(false);
    expect(metaCapiConsentAllowed('granted')).toBe(false);
    expect(metaCapiConsentAllowed(123)).toBe(false);
  });

  it('rejects when ad_storage is not granted', () => {
    expect(
      metaCapiConsentAllowed({ ad_storage: 'denied', ad_user_data: 'granted' }),
    ).toBe(false);
  });

  it('rejects when ad_user_data is not granted', () => {
    expect(
      metaCapiConsentAllowed({ ad_storage: 'granted', ad_user_data: 'denied' }),
    ).toBe(false);
  });

  it('accepts when both ads keys are granted', () => {
    expect(
      metaCapiConsentAllowed({
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
      }),
    ).toBe(true);
  });
});

describe('isValidEventId', () => {
  it('accepts a UUID v4', () => {
    expect(isValidEventId('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
  });

  it('accepts a short slug', () => {
    expect(isValidEventId('abc-123_ok')).toBe(true);
  });

  it('rejects values longer than 200 chars', () => {
    expect(isValidEventId('a'.repeat(201))).toBe(false);
  });

  it('rejects whitespace', () => {
    expect(isValidEventId('has space')).toBe(false);
  });

  it('rejects HTML / script content', () => {
    expect(isValidEventId('<script>alert(1)</script>')).toBe(false);
  });

  it('rejects non-strings', () => {
    expect(isValidEventId(123)).toBe(false);
    expect(isValidEventId(undefined)).toBe(false);
  });
});

describe('isValidCurrency', () => {
  it.each(['GBP', 'EUR', 'USD'])('accepts ISO 4217 code "%s"', (c) => {
    expect(isValidCurrency(c)).toBe(true);
  });

  it.each(['gbp', 'GBPP', 'GB', '€'])('rejects "%s"', (c) => {
    expect(isValidCurrency(c)).toBe(false);
  });
});

describe('isValidConversionValue', () => {
  it('accepts 0 and small positives', () => {
    expect(isValidConversionValue(0)).toBe(true);
    expect(isValidConversionValue(99.99)).toBe(true);
  });

  it('rejects negatives, Infinity, NaN', () => {
    expect(isValidConversionValue(-1)).toBe(false);
    expect(isValidConversionValue(Infinity)).toBe(false);
    expect(isValidConversionValue(NaN)).toBe(false);
  });

  it('rejects strings', () => {
    expect(isValidConversionValue('100')).toBe(false);
  });

  it(`rejects values above MAX_CONVERSION_VALUE (${MAX_CONVERSION_VALUE})`, () => {
    expect(isValidConversionValue(MAX_CONVERSION_VALUE)).toBe(true);
    expect(isValidConversionValue(MAX_CONVERSION_VALUE + 1)).toBe(false);
  });
});

describe('isValidEmail / isValidFbp / isValidFbc', () => {
  it('email accepts well-formed addresses', () => {
    expect(isValidEmail('a@b.com')).toBe(true);
    expect(isValidEmail('alice.smith+tag@example.co.uk')).toBe(true);
  });

  it('email rejects junk and oversize input', () => {
    expect(isValidEmail('no-at-sign')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a'.repeat(321) + '@b.com')).toBe(false);
  });

  it('fbp accepts the canonical shape and rejects everything else', () => {
    expect(isValidFbp('fb.1.1700000000.1234567890')).toBe(true);
    expect(isValidFbp('fb.1.abc.def')).toBe(false);
    expect(isValidFbp('fb.1.1.1.extra')).toBe(false);
  });

  it('fbc accepts the canonical shape and rejects everything else', () => {
    expect(isValidFbc('fb.1.1700000000.IwAR12_3-AB')).toBe(true);
    expect(isValidFbc('fb.1.1700000000.')).toBe(false);
    expect(isValidFbc('not-fbc')).toBe(false);
  });
});

describe('pickEventSourceUrl', () => {
  const allowed = new Set(['https://example.com']);

  it('accepts a candidate whose origin is allowed', () => {
    expect(pickEventSourceUrl('https://example.com/page', null, allowed)).toBe(
      'https://example.com/page',
    );
  });

  it('falls back to Referer when candidate is disallowed', () => {
    expect(
      pickEventSourceUrl('https://evil.com/x', 'https://example.com/y', allowed),
    ).toBe('https://example.com/y');
  });

  it('returns undefined when neither candidate nor referer is allowed', () => {
    expect(
      pickEventSourceUrl('https://evil.com/x', 'https://attacker.com/y', allowed),
    ).toBeUndefined();
  });

  it('returns undefined for malformed candidate without a valid referer', () => {
    expect(pickEventSourceUrl('::not a url::', null, allowed)).toBeUndefined();
  });

  it('rejects oversize candidate URLs', () => {
    const huge = 'https://example.com/' + 'a'.repeat(3000);
    expect(pickEventSourceUrl(huge, null, allowed)).toBeUndefined();
  });
});

describe('readGa4IdsFromCookie', () => {
  it('returns {} when cookie header is missing', () => {
    expect(readGa4IdsFromCookie(null, 'G-ABCD1234')).toEqual({});
  });

  it('extracts client_id from _ga and session_id from _ga_<id>', () => {
    const header = '_ga=GA1.1.1234567890.1700000000; _ga_ABCD1234=GS1.1.1700000001.1.1.1.0.0';
    const { clientId, sessionId } = readGa4IdsFromCookie(header, 'G-ABCD1234');
    expect(clientId).toBe('1234567890.1700000000');
    expect(sessionId).toBe('1700000001');
  });

  it('does NOT synthesize a client_id when _ga is missing', () => {
    expect(readGa4IdsFromCookie('foo=bar', 'G-ABCD1234')).toEqual({});
  });

  it('rejects a malformed _ga cookie', () => {
    expect(readGa4IdsFromCookie('_ga=NOT-A-GA-COOKIE', 'G-ABCD1234')).toEqual({});
  });

  it('returns clientId without sessionId when measurementId is undefined', () => {
    const out = readGa4IdsFromCookie('_ga=GA1.1.1.1', undefined);
    expect(out.clientId).toBe('1.1');
    expect(out.sessionId).toBeUndefined();
  });
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows up to max requests per window then blocks', () => {
    const key = `iptest-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 5)).toBe(true);
    }
    expect(checkRateLimit(key, 5)).toBe(false);
  });

  it('isolates per-key buckets', () => {
    const a = `ip-a-${Math.random()}`;
    const b = `ip-b-${Math.random()}`;
    for (let i = 0; i < 3; i++) checkRateLimit(a, 3);
    expect(checkRateLimit(a, 3)).toBe(false);
    expect(checkRateLimit(b, 3)).toBe(true);
  });

  it('refills after the window elapses', () => {
    const key = `ip-window-${Math.random()}`;
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3);
    expect(checkRateLimit(key, 3)).toBe(false);
    vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1000);
    expect(checkRateLimit(key, 3)).toBe(true);
  });

  it('treats an empty key as unlimited (avoid total denial when IP is unknown)', () => {
    for (let i = 0; i < 100; i++) expect(checkRateLimit('', 1)).toBe(true);
  });
});

describe('corsPreflightResponse', () => {
  const allowed = new Set(['https://example.com']);

  it('echoes the origin and POST method for an allowed origin', () => {
    const res = corsPreflightResponse('https://example.com', allowed);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('omits CORS headers entirely for a disallowed origin', () => {
    const res = corsPreflightResponse('https://evil.com', allowed);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('handles a missing Origin header', () => {
    const res = corsPreflightResponse(null, allowed);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});

describe('sendGA4MP', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 204 })),
    ) as unknown as typeof fetch;
  });

  it('no-ops when measurement_id is missing', async () => {
    await sendGA4MP({ GA4_API_SECRET: 's' }, 'cid', [{ name: 'x' }]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('no-ops when api_secret is missing', async () => {
    await sendGA4MP({ GA4_MEASUREMENT_ID: 'G-X' }, 'cid', [{ name: 'x' }]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('attaches session_id + engagement_time_msec when sessionId is provided', async () => {
    await sendGA4MP(
      { GA4_MEASUREMENT_ID: 'G-X', GA4_API_SECRET: 's' },
      'cid',
      [{ name: 'form_abandonment', params: { foo: 'bar' } }],
      { sessionId: '12345' },
    );
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.client_id).toBe('cid');
    expect(body.events[0].params).toMatchObject({
      session_id: '12345',
      engagement_time_msec: 1,
      foo: 'bar',
    });
  });

  it('does NOT attach session params when sessionId is absent', async () => {
    await sendGA4MP(
      { GA4_MEASUREMENT_ID: 'G-X', GA4_API_SECRET: 's' },
      'cid',
      [{ name: 'x', params: { a: 1 } }],
    );
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.events[0].params).not.toHaveProperty('session_id');
  });
});

describe('sendMetaCapi', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(null, { status: 200 })),
    ) as unknown as typeof fetch;
  });

  it('no-ops when pixel_id or access_token is missing', async () => {
    await sendMetaCapi({ META_PIXEL_ID: undefined }, [
      { event_name: 'Lead', event_id: 'x', event_time: 0 },
    ]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('hashes email/phone/name/address fields with SHA-256 and never sends raw values', async () => {
    await sendMetaCapi(
      {
        META_PIXEL_ID: 'pix',
        META_CAPI_ACCESS_TOKEN: 'tok',
      },
      [
        {
          event_name: 'Lead',
          event_id: 'evt-1',
          event_time: 1700000000,
          user_data: {
            email: 'Alice@Example.COM',
            phone_number: '+447700900123',
            first_name: 'Alice',
            last_name: 'Smith',
            city: 'London',
            postal_code: 'SW1A 1AA',
            country: 'GB',
          },
        },
      ],
    );
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const bodyText = (init as RequestInit).body as string;
    // Raw PII must not appear anywhere in the outbound JSON.
    expect(bodyText.toLowerCase()).not.toContain('alice@example.com');
    expect(bodyText).not.toContain('447700900123');
    expect(bodyText.toLowerCase()).not.toContain('alice');
    expect(bodyText.toLowerCase()).not.toContain('smith');
    expect(bodyText.toLowerCase()).not.toContain('london');
    expect(bodyText).not.toContain('SW1A 1AA');

    const body = JSON.parse(bodyText);
    const ud = body.data[0].user_data;
    expect(ud.em[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(ud.ph[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(ud.fn[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(ud.ln[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(ud.ct[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(ud.zp[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(ud.country[0]).toMatch(/^[a-f0-9]{64}$/);
  });

  it('normalises an un-normalised phone before hashing', async () => {
    const { sha256 } = await import('@noble/hashes/sha2.js');
    const { bytesToHex } = await import('@noble/hashes/utils.js');
    const expected = bytesToHex(sha256(new TextEncoder().encode('+447700900123')));

    await sendMetaCapi(
      { META_PIXEL_ID: 'pix', META_CAPI_ACCESS_TOKEN: 'tok' },
      [
        {
          event_name: 'Lead',
          event_id: 'evt-1',
          event_time: 1700000000,
          user_data: { phone_number: '07700 900123' },
        },
      ],
      { countryCode: 'GB' },
    );
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.data[0].user_data.ph[0]).toBe(expected);
  });

  it('attaches test_event_code when env has it set, omits it otherwise', async () => {
    await sendMetaCapi(
      {
        META_PIXEL_ID: 'pix',
        META_CAPI_ACCESS_TOKEN: 'tok',
        META_CAPI_TEST_EVENT_CODE: 'TEST123',
      },
      [{ event_name: 'Lead', event_id: 'x', event_time: 0 }],
    );
    const [, init1] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse((init1 as RequestInit).body as string).test_event_code).toBe('TEST123');

    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
    await sendMetaCapi(
      { META_PIXEL_ID: 'pix', META_CAPI_ACCESS_TOKEN: 'tok' },
      [{ event_name: 'Lead', event_id: 'x', event_time: 0 }],
    );
    const [, init2] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse((init2 as RequestInit).body as string).test_event_code).toBeUndefined();
  });

  it('logs a warning on non-2xx response but does not throw', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response('bad request', { status: 400 }),
    );
    const logger = { debug: vi.fn(), warn: vi.fn(), error: vi.fn() };
    await sendMetaCapi(
      { META_PIXEL_ID: 'pix', META_CAPI_ACCESS_TOKEN: 'tok' },
      [{ event_name: 'Lead', event_id: 'x', event_time: 0 }],
      { logger },
    );
    expect(logger.error).toHaveBeenCalled();
  });

  it('forwards fbp / fbc / client_user_agent / client_ip_address verbatim', async () => {
    await sendMetaCapi(
      { META_PIXEL_ID: 'pix', META_CAPI_ACCESS_TOKEN: 'tok' },
      [
        {
          event_name: 'Lead',
          event_id: 'x',
          event_time: 0,
          user_data: {
            fbp: 'fb.1.1.1',
            fbc: 'fb.1.1.abc',
            client_user_agent: 'UA/1',
            client_ip_address: '1.2.3.4',
          },
        },
      ],
    );
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const ud = JSON.parse((init as RequestInit).body as string).data[0].user_data;
    expect(ud.fbp).toBe('fb.1.1.1');
    expect(ud.fbc).toBe('fb.1.1.abc');
    expect(ud.client_user_agent).toBe('UA/1');
    expect(ud.client_ip_address).toBe('1.2.3.4');
  });
});

describe('module export hygiene', () => {
  it('does NOT export a deriveClientId / fingerprintClientId helper (INVARIANT #17)', async () => {
    const mod = await import('../../src/lib/tracking/server');
    expect(mod).not.toHaveProperty('deriveClientId');
    expect(mod).not.toHaveProperty('fingerprintClientId');
  });
});
