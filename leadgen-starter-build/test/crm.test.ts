import { describe, it, expect, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  signWebhook,
  buildContactEnvelope,
  isCrmConfigured,
  forwardToCrm,
  WEBHOOK_VERSION,
  type CrmEnv,
  type FetchLike,
} from '../src/lib/forms/crm';
import type { FormSubmission } from '../src/lib/forms/types';

const ENV: CrmEnv = {
  CRM_BASE_URL: 'https://crm.example.com',
  CRM_WEBHOOK_SECRET: 'whsec_test_123',
  CRM_COMPANY_ID: 'cmp_1',
  CRM_WEBHOOK_SOURCE: 'website',
};

function submission(overrides: Partial<FormSubmission> = {}): FormSubmission {
  return {
    leadId: 'internal-uuid',
    formId: 'contact',
    sourcePage: '/contact',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+447700900000',
    consent: true,
    marketingConsent: false,
    eventId: 'evt-123',
    timestamp: '2026-07-21T10:00:00.000Z',
    ...overrides,
  };
}

/** A minimal Response stand-in for the mock fetch. */
function res(status: number, body: unknown): Response {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    status,
    async json() { return typeof body === 'string' ? JSON.parse(text) : body; },
    async text() { return text; },
  } as unknown as Response;
}

describe('signWebhook', () => {
  it('byte-matches the CRM canonical base `${ts}.${version}.${rawBody}` (cross-impl vs node:crypto)', async () => {
    const rawBody = JSON.stringify({ hello: 'world' });
    const ts = 1700000000;
    const got = await signWebhook(ENV.CRM_WEBHOOK_SECRET, rawBody, ts);
    const expected = createHmac('sha256', ENV.CRM_WEBHOOK_SECRET)
      .update(`${ts}.${WEBHOOK_VERSION}.${rawBody}`)
      .digest('hex');
    expect(got).toBe(expected);
  });
});

describe('buildContactEnvelope', () => {
  it('maps to the contact surface with only-defined fields + shared event_id', () => {
    const env = buildContactEnvelope(submission({ postcode: 'SW1A 1AA', message: 'hi' }), 'website', 'cmp_1');
    expect(env).toMatchObject({
      event_id: 'evt-123',
      source: 'website',
      company_id: 'cmp_1',
      customer: { full_name: 'Jane Doe', email: 'jane@example.com', phone: '+447700900000', postcode: 'SW1A 1AA' },
      message: 'hi',
      attribution: { landing_page: '/contact' },
      consent: { gdpr: true, marketing: false },
    });
  });

  it('omits message/attribution/postcode when absent and reflects marketing consent', () => {
    const env = buildContactEnvelope(
      submission({ sourcePage: '', postcode: undefined, message: undefined, marketingConsent: true }),
      'website',
      'cmp_1',
    ) as Record<string, unknown>;
    expect(env.message).toBeUndefined();
    expect(env.attribution).toBeUndefined();
    expect((env.customer as Record<string, unknown>).postcode).toBeUndefined();
    expect(env.consent).toEqual({ gdpr: true, marketing: true });
  });

  it('NEVER carries hashed or raw PII beyond the named customer fields', () => {
    const env = buildContactEnvelope(submission(), 'website', 'cmp_1');
    const json = JSON.stringify(env);
    expect(json).not.toContain('sha256');
    expect(Object.keys(env.customer as object).sort()).toEqual(['email', 'full_name', 'phone']);
  });
});

describe('isCrmConfigured', () => {
  it('is false unless URL + secret + company are all set', () => {
    expect(isCrmConfigured(ENV)).toBe(true);
    expect(isCrmConfigured({ ...ENV, CRM_WEBHOOK_SECRET: '' })).toBe(false);
    expect(isCrmConfigured({ ...ENV, CRM_COMPANY_ID: '' })).toBe(false);
  });
});

describe('forwardToCrm', () => {
  it('is dormant (skipped, no throw) when the CRM is not configured', async () => {
    const r = await forwardToCrm(submission(), { ...ENV, CRM_BASE_URL: '' });
    expect(r).toEqual({ ok: false, skipped: true, attempts: 0 });
  });

  it('refuses to send without an event_id (would be a non-retriable 400)', async () => {
    const r = await forwardToCrm(submission({ eventId: undefined }), ENV);
    expect(r).toMatchObject({ ok: false, error: 'missing_event_id', retriable: false, attempts: 0 });
  });

  it('signs the EXACT body it sends and posts to the contact path with the right headers', async () => {
    let seen: { url: string; headers: Record<string, string>; body: string } | undefined;
    const fetchImpl: FetchLike = vi.fn(async (url, init) => {
      seen = { url, headers: init.headers, body: init.body };
      return res(200, { ok: true, lead_id: 'abcd1234efgh', duplicate: false });
    });
    const r = await forwardToCrm(submission(), ENV, { fetchImpl, timestamp: 1700000000 });
    expect(r).toMatchObject({ ok: true, leadId: 'abcd1234efgh', duplicate: false, attempts: 1 });
    expect(seen!.url).toBe('https://crm.example.com/api/webhooks/contact');
    expect(seen!.headers['x-webhook-version']).toBe('1.0');
    expect(seen!.headers['x-webhook-timestamp']).toBe('1700000000');
    // The signature must verify against the exact bytes sent.
    const expected = createHmac('sha256', ENV.CRM_WEBHOOK_SECRET)
      .update(`1700000000.1.0.${seen!.body}`)
      .digest('hex');
    expect(seen!.headers['x-webhook-signature']).toBe(`sha256=${expected}`);
  });

  it('accepts the deprecated `id` alias and drops an id that fails the gateway format', async () => {
    const fromAlias = await forwardToCrm(submission(), ENV, {
      fetchImpl: async () => res(200, { ok: true, id: 'abcd1234efgh' }),
    });
    expect(fromAlias.leadId).toBe('abcd1234efgh');

    const badFormat = await forwardToCrm(submission(), ENV, {
      fetchImpl: async () => res(200, { ok: true, lead_id: 'short' }),
    });
    expect(badFormat.ok).toBe(true);
    expect(badFormat.leadId).toBeUndefined();
  });

  it('re-signs and retries on a 401 stale timestamp, then succeeds', async () => {
    let n = 0;
    const fetchImpl: FetchLike = vi.fn(async () => {
      n += 1;
      return n === 1 ? res(401, 'stale_timestamp') : res(200, { ok: true, lead_id: 'abcd1234efgh' });
    });
    const r = await forwardToCrm(submission(), ENV, { fetchImpl, sleepImpl: async () => {}, retryDelaysMs: [1] });
    expect(n).toBe(2);
    expect(r).toMatchObject({ ok: true, leadId: 'abcd1234efgh', attempts: 2 });
  });

  it('does NOT retry a genuine 400 invalid_envelope (our bug → lead-drop, not a loop)', async () => {
    const fetchImpl: FetchLike = vi.fn(async () => res(400, 'invalid_envelope'));
    const r = await forwardToCrm(submission(), ENV, { fetchImpl, sleepImpl: async () => {}, retryDelaysMs: [1, 1] });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(r).toMatchObject({ ok: false, status: 400, retriable: false });
  });

  it('retries a 5xx up to the budget, then reports a retriable failure', async () => {
    const fetchImpl: FetchLike = vi.fn(async () => res(503, 'unavailable'));
    const r = await forwardToCrm(submission(), ENV, { fetchImpl, sleepImpl: async () => {}, retryDelaysMs: [1, 1] });
    expect(fetchImpl).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    expect(r).toMatchObject({ ok: false, status: 503, retriable: true, attempts: 3 });
  });
});
