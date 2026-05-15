import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type GA4Call = [unknown, string, Array<{ name: string; params?: Record<string, unknown> }>, { sessionId?: string }, ...unknown[]];
const sendGA4MP = vi.fn<(...args: any[]) => Promise<void>>(() => Promise.resolve());

vi.mock('../../src/lib/tracking/server', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/tracking/server')>(
    '../../src/lib/tracking/server',
  );
  return { ...actual, sendGA4MP };
});

const route = await import('../../src/api/nextjs/abandonment.route');
const { POST, OPTIONS } = route;

const GOOD_ORIGIN = 'https://example.com';
const BAD_ORIGIN = 'https://evil.example.com';

function buildRequest(opts: {
  method?: string;
  origin?: string | null;
  ip?: string;
  cookie?: string;
  body?: unknown;
} = {}): Request {
  const headers = new Headers();
  if (opts.origin !== null && opts.origin !== undefined) headers.set('Origin', opts.origin);
  if (opts.ip) headers.set('x-forwarded-for', opts.ip);
  if (opts.cookie) headers.set('cookie', opts.cookie);
  if (opts.body !== undefined) headers.set('Content-Type', 'application/json');
  return new Request('https://example.com/api/track/abandonment', {
    method: opts.method || 'POST',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

const basePayload = {
  form_name: 'Quote',
  last_step: 'contact',
  last_field: 'email',
  time_spent_seconds: 35,
  exit_page_path: '/quote',
  exit_page_title: 'Quote',
  exit_page_url: 'https://example.com/quote',
};

beforeEach(() => {
  sendGA4MP.mockClear();
  process.env.GA4_MEASUREMENT_ID = 'G-ABCD1234';
  process.env.GA4_API_SECRET = 'secret';
});

afterEach(() => {
  delete process.env.GA4_MEASUREMENT_ID;
  delete process.env.GA4_API_SECRET;
});

describe('OPTIONS preflight', () => {
  it('echoes origin for allowed origin', async () => {
    const res = await OPTIONS(buildRequest({ method: 'OPTIONS', origin: GOOD_ORIGIN }));
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(GOOD_ORIGIN);
  });
});

describe('POST origin gate', () => {
  it('returns 204 with no send when Origin is missing', async () => {
    const res = await POST(buildRequest({ origin: null, body: basePayload }));
    expect(res.status).toBe(204);
    expect(sendGA4MP).not.toHaveBeenCalled();
  });

  it('returns 204 with no send when Origin is not allowed', async () => {
    const res = await POST(buildRequest({ origin: BAD_ORIGIN, body: basePayload }));
    expect(res.status).toBe(204);
    expect(sendGA4MP).not.toHaveBeenCalled();
  });
});

describe('POST body sanitisation', () => {
  it('drops unknown keys and forwards only allowed ones', async () => {
    await POST(
      buildRequest({
        origin: GOOD_ORIGIN,
        ip: `ab-${Math.random()}`,
        cookie: '_ga=GA1.1.123.456; _ga_ABCD1234=GS1.1.1700000000.1.1.1.0.0',
        body: {
          ...basePayload,
          email: 'should-not-pass@example.com',
          phone: '+447700900123',
        },
      }),
    );
    expect(sendGA4MP).toHaveBeenCalledTimes(1);
    const [, , events] = sendGA4MP.mock.calls[0] as GA4Call;
    const params = events[0].params || {};
    expect(params).not.toHaveProperty('email');
    expect(params).not.toHaveProperty('phone');
    expect(params).toMatchObject({ form_name: 'Quote', last_step: 'contact' });
  });

  it('truncates long string fields at 500 chars', async () => {
    const long = 'a'.repeat(2000);
    await POST(
      buildRequest({
        origin: GOOD_ORIGIN,
        ip: `ab-${Math.random()}`,
        cookie: '_ga=GA1.1.123.456',
        body: { ...basePayload, last_step: long },
      }),
    );
    const [, , events] = sendGA4MP.mock.calls[0] as GA4Call;
    expect((events[0].params!.last_step as string).length).toBe(500);
  });
});

describe('POST GA4 MP gate', () => {
  it('does NOT send when the request has no _ga cookie (no synthetic client_id)', async () => {
    const res = await POST(
      buildRequest({
        origin: GOOD_ORIGIN,
        ip: `ng-${Math.random()}`,
        body: basePayload,
        // no cookie header
      }),
    );
    expect(res.status).toBe(204);
    expect(sendGA4MP).not.toHaveBeenCalled();
  });

  it('sends when _ga cookie is present, attaching sessionId from _ga_<id>', async () => {
    await POST(
      buildRequest({
        origin: GOOD_ORIGIN,
        ip: `s-${Math.random()}`,
        cookie: '_ga=GA1.1.111.222; _ga_ABCD1234=GS1.1.1700001234.1.1.1.0.0',
        body: basePayload,
      }),
    );
    expect(sendGA4MP).toHaveBeenCalledTimes(1);
    const [, clientId, events, opts] = sendGA4MP.mock.calls[0] as GA4Call;
    expect(clientId).toBe('111.222');
    expect(events[0].name).toBe('form_abandonment');
    expect(opts.sessionId).toBe('1700001234');
  });
});

describe('POST resilience', () => {
  it('returns 204 even when body is junk', async () => {
    const req = new Request('https://example.com/api/track/abandonment', {
      method: 'POST',
      headers: { Origin: GOOD_ORIGIN, 'Content-Type': 'application/json' },
      body: '{{not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(204);
  });
});
