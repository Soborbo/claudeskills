/**
 * CRM lead-forward — Soborbo CRM signed webhook (`contact` surface).
 *
 * This is the STARTER's server leg. It signs and POSTs each lead to the CRM's
 * signed webhook (`{CRM_BASE_URL}/api/webhooks/contact`); the CRM stores the
 * lead AND — because we pass the shared `event_id` — writes an
 * `initial_conversion` row into its durable outbox (F3-C), which the CRM cron
 * dispatches to the event-gateway. So the ad conversion is delivered durably,
 * with retry, off the request path. The starter does NOT talk to the gateway
 * directly.
 *
 * Contract (mirror of the CRM `verify.ts` / painless `signer.ts`):
 *   - Signature base: `${timestamp}.${version}.${rawBody}`, HMAC-SHA256,
 *     lowercase hex, header prefixed `sha256=`.
 *   - Headers: x-webhook-signature, x-webhook-timestamp (unix SECONDS),
 *     x-webhook-version ('1.0').
 *   - Serialize the envelope ONCE; sign that exact string; send that string.
 *   - Re-sign on every retry (fresh timestamp) — the body (and thus event_id)
 *     is byte-identical across attempts, which is what makes redelivery
 *     idempotent on the CRM side.
 *   - Response: 200 `{ ok, lead_id, duplicate }`; 400/401 = our bug → no retry
 *     (except 401 stale timestamp → re-sign + retry); 5xx/network → retry.
 *
 * Best-effort: an unconfigured or unreachable CRM does NOT fail the submission
 * (the email notification is the fallback record of the lead). Empty
 * URL/secret/company = dormant.
 *
 * SERVER-SIDE ONLY — the HMAC secret must never reach the browser.
 */

import type { FormSubmission } from './types';

export interface CrmEnv {
  CRM_BASE_URL: string;
  CRM_WEBHOOK_SECRET: string;
  CRM_COMPANY_ID: string;
  /** Envelope `source`; defaults to "website". */
  CRM_WEBHOOK_SOURCE?: string;
}

export interface CrmResult {
  ok: boolean;
  /** CRM URL/secret/company not configured — dormant, submission not failed. */
  skipped?: boolean;
  /** The CRM saw this event_id before (idempotency hit). */
  duplicate?: boolean;
  status?: number;
  error?: string;
  /** True when the failure class is one the contract says to retry. */
  retriable?: boolean;
  /**
   * The CRM lead id (from the `{ lead_id }` response; `id` accepted as the
   * deprecated alias). Only returned when it matches the gateway lead_id format
   * (8–64 chars, [A-Za-z0-9_-]) — anything else the gateway would drop anyway.
   */
  leadId?: string;
  /** HTTP attempts made (1 = no retries; 0 = dormant/not configured). */
  attempts: number;
}

/** The only protocol version the CRM allow-lists. */
export const WEBHOOK_VERSION = '1.0';
const CONTACT_PATH = '/api/webhooks/contact';
const DEFAULT_RETRY_DELAYS_MS = [1000, 5000, 30000];
const DEFAULT_TIMEOUT_MS = 6000;
const LEAD_ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

/**
 * Minimal fetch shape — looser than the Workers-augmented global so test mocks
 * (and Node's fetch) assign without friction.
 */
export type FetchLike = (
  input: string,
  init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal },
) => Promise<Response>;

export interface ForwardOptions {
  /** Backoff schedule (ms). Overridable for tests. */
  retryDelaysMs?: number[];
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: FetchLike;
  /** Injectable sleep for tests. */
  sleepImpl?: (ms: number) => Promise<void>;
  /** Fixed unix-seconds timestamp for tests (defaults to now on each attempt). */
  timestamp?: number;
  /** Per-attempt request timeout (ms). */
  timeoutMs?: number;
}

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

/** Lowercase-hex HMAC-SHA256 of `message` under `secret` (WebCrypto). */
export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return toHex(sig);
}

/**
 * Signs the canonical base `${timestamp}.${version}.${rawBody}`. No `sha256=`
 * prefix — that is added when building the header. `rawBody` MUST be the exact
 * string sent as the request body.
 */
export async function signWebhook(
  secret: string,
  rawBody: string,
  timestamp: number | string,
  version: string = WEBHOOK_VERSION,
): Promise<string> {
  return hmacSha256Hex(secret, `${timestamp}.${version}.${rawBody}`);
}

export function isCrmConfigured(env: CrmEnv): boolean {
  return Boolean(env.CRM_BASE_URL && env.CRM_WEBHOOK_SECRET && env.CRM_COMPANY_ID);
}

/**
 * Builds the signed `contact`-surface envelope for a submission. The result is
 * serialized ONCE by the caller and that exact string is both signed and sent.
 * Only defined fields are included (the CRM schema uses optional/nullable).
 */
export function buildContactEnvelope(
  submission: FormSubmission,
  source: string,
  companyId: string,
): Record<string, unknown> {
  const attribution: Record<string, string> = {};
  if (submission.sourcePage) attribution.landing_page = submission.sourcePage;
  if (submission.utmSource) attribution.utm_source = submission.utmSource;
  if (submission.utmMedium) attribution.utm_medium = submission.utmMedium;
  if (submission.utmCampaign) attribution.utm_campaign = submission.utmCampaign;

  const customer: Record<string, unknown> = {
    full_name: submission.name,
    email: submission.email,
    phone: submission.phone,
  };
  if (submission.postcode) customer.postcode = submission.postcode;

  const envelope: Record<string, unknown> = {
    event_id: submission.eventId,
    source,
    company_id: companyId,
    customer,
    consent: {
      // Privacy-policy accept = lawful basis for processing this lead.
      gdpr: submission.consent === true,
      // Ad-tracking consent. Governs whether the CRM lets the initial ad
      // conversion fire (adAllowed). Fail-closed: only true when the visitor
      // actually granted the CookieYes `marketing` category.
      marketing: submission.marketingConsent === true,
    },
  };
  if (submission.message) envelope.message = submission.message;
  if (Object.keys(attribution).length > 0) envelope.attribution = attribution;

  return envelope;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Signs and delivers one submission to the CRM `contact` webhook, retrying on
 * 5xx/network (and 401 stale timestamp) per the contract. Never throws — always
 * resolves with a `CrmResult`, so a CRM problem cannot fail the form submission.
 */
export async function forwardToCrm(
  submission: FormSubmission,
  env: CrmEnv,
  options: ForwardOptions = {},
): Promise<CrmResult> {
  if (!isCrmConfigured(env)) {
    return { ok: false, skipped: true, attempts: 0 };
  }
  if (!submission.eventId) {
    // event_id is REQUIRED on the signed path; without it the CRM returns 400
    // invalid_envelope (non-retriable). Surface it as a config/wiring bug
    // rather than burning the retry budget.
    return { ok: false, error: 'missing_event_id', retriable: false, attempts: 0 };
  }

  const source = env.CRM_WEBHOOK_SOURCE ?? 'website';
  const fetchImpl = options.fetchImpl ?? (fetch as unknown as FetchLike);
  const sleep = options.sleepImpl ?? defaultSleep;
  const retryDelays = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // Serialize ONCE — this exact string is what we sign and what we send.
  const rawBody = JSON.stringify(buildContactEnvelope(submission, source, env.CRM_COMPANY_ID));
  const url = `${env.CRM_BASE_URL}${CONTACT_PATH}`;

  for (let attempt = 0; ; attempt++) {
    const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000);
    const signature = await signWebhook(env.CRM_WEBHOOK_SECRET, rawBody, timestamp);
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-webhook-signature': `sha256=${signature}`,
      'x-webhook-timestamp': String(timestamp),
      'x-webhook-version': WEBHOOK_VERSION,
    };

    try {
      const res = await fetchImpl(url, {
        method: 'POST',
        headers,
        body: rawBody,
        // A sick CRM must not hold the lead request open indefinitely.
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (res.status === 200) {
        const body = (await res.json().catch(() => ({}))) as {
          lead_id?: unknown;
          id?: unknown;
          duplicate?: boolean;
        };
        const rawId =
          typeof body.lead_id === 'string' ? body.lead_id
          : typeof body.id === 'string' ? body.id
          : undefined;
        let leadId: string | undefined;
        if (rawId && LEAD_ID_RE.test(rawId)) {
          leadId = rawId;
        } else if (rawId) {
          console.warn('[crm] lead id does not match the gateway lead_id format — dropping', {
            length: rawId.length,
          });
        }
        return { ok: true, duplicate: !!body.duplicate, status: 200, leadId, attempts: attempt + 1 };
      }

      if (res.status === 400 || res.status === 401) {
        const text = await res.text().catch(() => '');
        // A 401 from clock skew / expired timestamp is TRANSIENT — every attempt
        // re-signs with a fresh timestamp, so a retry very likely succeeds. Only
        // a genuine invalid_signature / invalid_envelope is non-retriable.
        // Distinguish by the response body (the CRM keeps these strings stable).
        const isStale = res.status === 401 && /stale|timestamp|clock|expired/.test(text.toLowerCase());
        if (isStale && attempt < retryDelays.length) {
          await sleep(retryDelays[attempt]);
          continue;
        }
        console.warn('[crm] non-retriable webhook response', { status: res.status, body: text.slice(0, 200) });
        return {
          ok: false,
          status: res.status,
          error: text.slice(0, 200) || `http_${res.status}`,
          retriable: isStale,
          attempts: attempt + 1,
        };
      }

      // 5xx / 429 / unexpected → retriable.
      if (attempt < retryDelays.length) {
        await sleep(retryDelays[attempt]);
        continue;
      }
      return { ok: false, status: res.status, error: `http_${res.status}`, retriable: true, attempts: attempt + 1 };
    } catch (err) {
      // Network error / timeout — retriable.
      const message = err instanceof Error ? err.message : String(err);
      if (attempt < retryDelays.length) {
        await sleep(retryDelays[attempt]);
        continue;
      }
      return { ok: false, error: message, retriable: true, attempts: attempt + 1 };
    }
  }
}
