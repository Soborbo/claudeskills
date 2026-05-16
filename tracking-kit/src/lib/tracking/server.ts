/**
 * Server-side tracking helpers (GA4 Measurement Protocol + Meta CAPI).
 *
 * Used from your form-success API route (engagement-event mirror), the
 * abandonment beacon endpoint, and the /api/meta/capi ingress for
 * client-driven Meta CAPI mirrors.
 *
 * All sends are best-effort: failures are logged but never thrown — the
 * primary tracking signal is the browser side, server is a redundancy
 * layer.
 *
 * Hashing uses `@noble/hashes`. If you'd rather use a different hash
 * library or the runtime's built-in WebCrypto SubtleCrypto.digest,
 * swap the `hash*` helpers below — the rest of the file is unchanged.
 *
 * Beyond hashing + sending, this module exports the validation,
 * rate-limit, and consent helpers that BOTH the Astro and Next.js
 * route mounts share. Keep route handlers thin: parse, hand off to
 * these helpers, return 204.
 */

import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import {
  normalizePhoneE164,
  type CountryCode,
  type UserData,
} from './tracking';
import {
  DEFAULT_COUNTRY,
  META_GRAPH_API_VERSION,
  RATE_LIMIT_WINDOW_MS,
} from './config';

/**
 * Server-side env contract. The keys are read on every send; the
 * helpers no-op when `_API_SECRET` / `_ACCESS_TOKEN` are missing so
 * Preview deploys without secrets degrade gracefully.
 *
 * `META_CAPI_TEST_EVENT_CODE` is for validation only — when set, all
 * Meta CAPI hits land in the Test Events tab. REMOVE before going live
 * or your production optimization will be polluted with test events.
 */
export interface ServerEnv {
  GA4_MEASUREMENT_ID?: string;
  GA4_API_SECRET?: string;
  META_PIXEL_ID?: string;
  META_CAPI_ACCESS_TOKEN?: string;
  META_CAPI_TEST_EVENT_CODE?: string;
}

/**
 * Minimal logger contract. Pass any object that has these methods —
 * `console` works for quick bring-up, but you'll likely want to wire
 * your project's structured logger here so failures are queryable.
 */
export interface Logger {
  debug(scope: string, message: string, meta?: Record<string, unknown>): void;
  warn(scope: string, message: string, meta?: Record<string, unknown>): void;
  error?(scope: string, message: string, meta?: Record<string, unknown>): void;
}

const consoleLogger: Logger = {
  debug: (scope, msg, meta) => console.debug(`[${scope}] ${msg}`, meta || ''),
  warn: (scope, msg, meta) => console.warn(`[${scope}] ${msg}`, meta || ''),
  error: (scope, msg, meta) => console.error(`[${scope}] ${msg}`, meta || ''),
};

/**
 * One-shot loud-warning state for missing server-side secrets.
 *
 * A no-op-on-missing-config policy is fine — secret rotations and
 * Preview deploys shouldn't 500 — but the "no-op" must be visible the
 * FIRST time it happens per process. A silent `log.debug` line drowns
 * in production log volume and lets `GA4_API_SECRET` stay unset for
 * weeks without anyone noticing. That's the failure mode that bit a
 * real production deploy of this kit for 2.5 weeks. See INVARIANTS.md
 * → "Server-side mirrors do not fail silently on missing config".
 *
 * The structured `__pipeline: 'error'` field on the meta object is so
 * a tail worker / Logflare / Datadog tag-based routing forwards these
 * to the operator. Adapt the meta shape to your log pipeline; the
 * principle is: once per process, loud, structured.
 */
const warnedMissingSecret = new Set<string>();
function warnMissingSecretOnce(log: Logger, scope: string, name: string): void {
  if (warnedMissingSecret.has(name)) return;
  warnedMissingSecret.add(name);
  (log.error || log.warn)(scope, `${name} is missing — server-side mirror is OFF`, {
    __pipeline: 'error',
    secret: name,
    impact: 'silent conversion loss until secret is set',
  });
}

// ---------------------------------------------------------------------------
// SHA-256 hashing for Meta CAPI
// ---------------------------------------------------------------------------

const enc = new TextEncoder();

function hashEmail(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return bytesToHex(sha256(enc.encode(value.trim().toLowerCase())));
}

function hashPostal(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return bytesToHex(sha256(enc.encode(value.replace(/\s/g, '').toUpperCase())));
}

function hashCountry(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return bytesToHex(sha256(enc.encode(value.trim().toLowerCase().slice(0, 2))));
}

// ---------------------------------------------------------------------------
// Validation primitives shared by the route handlers
// ---------------------------------------------------------------------------

/** Meta `event_id` is a free-form string but must be stable, short, and
 *  printable. We accept the typical UUID/slug shape and cap length. */
const EVENT_ID_RE = /^[A-Za-z0-9._:\-]{1,200}$/;
const CURRENCY_RE = /^[A-Z]{3}$/;
/** Loose RFC-5321 email check — strict enough to reject obvious junk
 *  before we spend a hash on it; lenient enough to not reject valid
 *  unicode-local-part addresses outright. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FBP_RE = /^fb\.\d+\.\d+\.\d+$/;
const FBC_RE = /^fb\.\d+\.\d+\.[A-Za-z0-9_-]+$/;

/** Cap on `value` we'll forward to Meta. Anything above this is almost
 *  certainly an attacker trying to inflate Smart Bidding signals; legit
 *  lead values for B2C funnels are well below this. Tune for your
 *  business if you have genuinely high-ticket conversions. */
export const MAX_CONVERSION_VALUE = 1_000_000;

export function isValidEventId(v: unknown): v is string {
  return typeof v === 'string' && EVENT_ID_RE.test(v);
}

export function isValidCurrency(v: unknown): v is string {
  return typeof v === 'string' && CURRENCY_RE.test(v);
}

export function isValidConversionValue(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= MAX_CONVERSION_VALUE;
}

export function isValidEmail(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 320 && EMAIL_RE.test(v);
}

export function isValidFbp(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 100 && FBP_RE.test(v);
}

export function isValidFbc(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 200 && FBC_RE.test(v);
}

/** Validates `event_source_url` against the configured allowed origins.
 *  If it doesn't match (or is malformed), falls back to the request's
 *  Referer if THAT matches. Otherwise undefined — better to send no
 *  source URL than an attacker-controlled one. */
export function pickEventSourceUrl(
  candidate: unknown,
  referer: string | null,
  allowedOrigins: ReadonlySet<string>,
): string | undefined {
  if (typeof candidate === 'string' && candidate.length <= 2000) {
    try {
      const u = new URL(candidate);
      if (allowedOrigins.has(u.origin)) return candidate;
    } catch { /* malformed URL — ignore */ }
  }
  if (referer) {
    try {
      const u = new URL(referer);
      if (allowedOrigins.has(u.origin)) return referer.slice(0, 2000);
    } catch { /* ignore */ }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Origin gate
// ---------------------------------------------------------------------------

/** Strict origin check: requests with no Origin header are REJECTED.
 *  The previous policy ("if Origin missing, allow") was bypassable from
 *  curl/server-to-server tools — the whole point of the gate is that
 *  fake conversions can't be POSTed from outside the browser. */
export function isAllowedOrigin(
  origin: string | null,
  allowed: ReadonlySet<string>,
): boolean {
  if (!origin) return false;
  return allowed.has(origin);
}

// ---------------------------------------------------------------------------
// Consent gate
// ---------------------------------------------------------------------------

export interface ConsentState {
  ad_storage?: 'granted' | 'denied' | string;
  ad_user_data?: 'granted' | 'denied' | string;
  ad_personalization?: 'granted' | 'denied' | string;
  analytics_storage?: 'granted' | 'denied' | string;
}

/** Fail-closed Meta CAPI gate. Forwarding ad-attributable conversions to
 *  Meta without ad consent is a regulatory exposure (GDPR + Meta's own
 *  policy). The client's `mirrorMetaCapi` already gates on this; the
 *  server re-checks because a tampered client can omit it. */
export function metaCapiConsentAllowed(consent: unknown): boolean {
  if (!consent || typeof consent !== 'object') return false;
  const c = consent as ConsentState;
  return c.ad_storage === 'granted' && c.ad_user_data === 'granted';
}

// ---------------------------------------------------------------------------
// In-memory rate limiter
// ---------------------------------------------------------------------------

/**
 * Per-IP sliding-window limiter, in-memory. Survives across requests
 * within the same isolate but NOT across isolates — on Cloudflare
 * Workers this means a single attacker can be rate-limited per isolate
 * but distributed traffic that lands on different isolates is not
 * counted globally. For stronger guarantees, swap this out for a
 * KV-backed (Cloudflare KV / Vercel KV / Redis) limiter.
 *
 * The map is bounded by periodic GC of expired entries to avoid
 * unbounded growth under unique-IP attack.
 */
const rateBuckets = new Map<string, number[]>();
let lastGc = 0;

function gcRateBuckets(now: number): void {
  if (now - lastGc < RATE_LIMIT_WINDOW_MS) return;
  lastGc = now;
  for (const [k, arr] of rateBuckets) {
    const fresh = arr.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (fresh.length === 0) rateBuckets.delete(k);
    else rateBuckets.set(k, fresh);
  }
}

export function checkRateLimit(key: string, max: number): boolean {
  if (!key) return true;
  const now = Date.now();
  gcRateBuckets(now);
  const arr = rateBuckets.get(key) || [];
  const fresh = arr.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (fresh.length >= max) {
    rateBuckets.set(key, fresh);
    return false;
  }
  fresh.push(now);
  rateBuckets.set(key, fresh);
  return true;
}

// ---------------------------------------------------------------------------
// CORS / OPTIONS preflight helper
// ---------------------------------------------------------------------------

/** Generic CORS-preflight responder. Echoes only allowed origins (never
 *  `*`) and limits methods to POST. */
export function corsPreflightResponse(
  origin: string | null,
  allowed: ReadonlySet<string>,
): Response {
  const headers = new Headers();
  if (origin && allowed.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    headers.set('Access-Control-Max-Age', '600');
  }
  return new Response(null, { status: 204, headers });
}

// ---------------------------------------------------------------------------
// GA4 Measurement Protocol
// ---------------------------------------------------------------------------

export interface GA4MPEvent {
  name: string;
  params?: Record<string, unknown>;
}

/**
 * Extract GA4 `client_id` and `session_id` from a request's Cookie header.
 *
 * - `_ga` cookie format: `GA1.<scope>.<random>.<timestamp>` →
 *   client_id is the trailing `<random>.<timestamp>` pair.
 * - `_ga_<container>` cookie format:
 *   `GS1.<x>.<session_id>.<session_count>.<engagement>.<last_active>...`
 *   The container suffix is the measurement ID stripped of `G-`
 *   (e.g. `G-ABCD1234` → cookie name `_ga_ABCD1234`).
 *
 * The kit's MP endpoints are same-origin, so these cookies ride along on
 * every form POST and `sendBeacon` automatically — no client-side relay
 * needed.
 *
 * Returns `{}` when the `_ga` cookie is missing — the caller MUST skip the
 * MP send when `clientId` is absent. Sending an MP event without a real
 * client_id creates an unattributed (not set)/(not set) session that
 * pollutes GA4 reports and Google Ads conversion imports. See INVARIANT #17.
 */
export function readGa4IdsFromCookie(
  cookieHeader: string | null | undefined,
  measurementId: string | undefined,
): { clientId?: string; sessionId?: string } {
  if (!cookieHeader) return {};

  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    const k = part.slice(0, eq).trim();
    if (!k) continue;
    cookies[k] = part.slice(eq + 1).trim();
  }

  let clientId: string | undefined;
  const ga = cookies._ga;
  if (ga) {
    const parts = ga.split('.');
    if (parts.length >= 4 && parts[0] === 'GA1') {
      const candidate = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
      if (/^\d+\.\d+$/.test(candidate)) clientId = candidate;
    }
  }

  let sessionId: string | undefined;
  if (measurementId) {
    const sessionCookieName = `_ga_${measurementId.replace(/^G-/, '')}`;
    const gaSession = cookies[sessionCookieName];
    if (gaSession) {
      const parts = gaSession.split('.');
      if (parts.length >= 3 && parts[0] === 'GS1' && /^\d+$/.test(parts[2])) {
        sessionId = parts[2];
      }
    }
  }

  return { clientId, sessionId };
}

/**
 * Sends one or more events to GA4 via Measurement Protocol.
 *
 * `clientId` MUST be a real `_ga` cookie client_id obtained from
 * `readGa4IdsFromCookie()` — never a synthetic hash / random / IP+UA
 * value. A synthetic id is an unknown user to GA4: new user, new session,
 * no source/medium, so the event lands in the `(not set)/(not set)`
 * bucket and (if it's a conversion) poisons Google Ads conversion imports
 * and Smart Bidding. The browser-side gtag event for the SAME conversion
 * arrives under the real `_ga` client_id, so GA4 can't even dedup the
 * pair. See INVARIANT #17.
 *
 * Pass `options.sessionId` (also from `readGa4IdsFromCookie()`) whenever
 * it's available: GA4 attaches the event to the browser's existing
 * session — inheriting its source/medium — only when every event's
 * params carry `session_id` plus a non-zero `engagement_time_msec`.
 * Without it the event still attributes to the right user but starts a
 * NEW session — a session-count distorter.
 */
export async function sendGA4MP(
  env: ServerEnv,
  clientId: string,
  events: GA4MPEvent[],
  options: { userId?: string; sessionId?: string; logger?: Logger } = {},
): Promise<void> {
  const log = options.logger || consoleLogger;
  const measurementId = env.GA4_MEASUREMENT_ID;
  const apiSecret = env.GA4_API_SECRET;
  if (!measurementId || !apiSecret) {
    if (!measurementId) warnMissingSecretOnce(log, 'GA4MP', 'GA4_MEASUREMENT_ID');
    if (!apiSecret) warnMissingSecretOnce(log, 'GA4MP', 'GA4_API_SECRET');
    return;
  }

  // GA4 only honours the session attachment when `session_id` is in each
  // event's own params — a top-level field is ignored. `engagement_time_msec`
  // must be present and non-zero or GA4 drops the session signal too.
  const eventsWithSession = options.sessionId
    ? events.map((evt) => ({
        ...evt,
        params: {
          session_id: options.sessionId,
          engagement_time_msec: 1,
          ...(evt.params || {}),
        },
      }))
    : events;

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
  const body = {
    client_id: clientId,
    ...(options.userId ? { user_id: options.userId } : {}),
    events: eventsWithSession,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      (log.error || log.warn)('GA4MP', `Non-2xx response: ${res.status}`);
    }
  } catch (err) {
    log.warn('GA4MP', 'Send failed', { error: err instanceof Error ? err.message : String(err) });
  }
}

// ---------------------------------------------------------------------------
// Meta Conversions API
// ---------------------------------------------------------------------------

export interface MetaCapiEvent {
  event_name: string;
  event_id: string;
  event_time: number;
  event_source_url?: string;
  action_source?: 'website';
  user_data?: UserData & {
    fbp?: string;
    fbc?: string;
    client_user_agent?: string;
    client_ip_address?: string;
  };
  custom_data?: Record<string, unknown>;
}

export async function sendMetaCapi(
  env: ServerEnv,
  events: MetaCapiEvent[],
  options: { countryCode?: CountryCode; logger?: Logger } = {},
): Promise<void> {
  const log = options.logger || consoleLogger;
  const countryCode = options.countryCode || DEFAULT_COUNTRY;
  const pixelId = env.META_PIXEL_ID;
  const accessToken = env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
    if (!pixelId) warnMissingSecretOnce(log, 'MetaCAPI', 'META_PIXEL_ID');
    if (!accessToken) warnMissingSecretOnce(log, 'MetaCAPI', 'META_CAPI_ACCESS_TOKEN');
    return;
  }

  const transformed = events.map((evt) => {
    const ud = evt.user_data || {};
    const phone = ud.phone_number ? normalizePhoneE164(ud.phone_number, countryCode) : undefined;
    // Hash each field once. The previous form computed each hash twice
    // (once for the truthy check, once for the value) which is both
    // wasteful and easy to read wrong.
    const em = hashEmail(ud.email);
    const ph = hashEmail(phone);
    const fn = hashEmail(ud.first_name);
    const ln = hashEmail(ud.last_name);
    const ct = hashEmail(ud.city);
    const zp = hashPostal(ud.postal_code);
    const country = hashCountry(ud.country);
    return {
      event_name: evt.event_name,
      event_id: evt.event_id,
      event_time: evt.event_time,
      event_source_url: evt.event_source_url,
      action_source: evt.action_source || 'website',
      user_data: {
        em: em ? [em] : undefined,
        ph: ph ? [ph] : undefined,
        fn: fn ? [fn] : undefined,
        ln: ln ? [ln] : undefined,
        ct: ct ? [ct] : undefined,
        zp: zp ? [zp] : undefined,
        country: country ? [country] : undefined,
        fbp: ud.fbp,
        fbc: ud.fbc,
        client_user_agent: ud.client_user_agent,
        client_ip_address: ud.client_ip_address,
      },
      custom_data: evt.custom_data,
    };
  });

  const payload: Record<string, unknown> = { data: transformed };
  if (env.META_CAPI_TEST_EVENT_CODE) {
    payload.test_event_code = env.META_CAPI_TEST_EVENT_CODE;
  }

  const url = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      (log.error || log.warn)('MetaCAPI', `Non-2xx response: ${res.status}`, { body: text.slice(0, 500) });
      return;
    }
  } catch (err) {
    log.warn('MetaCAPI', 'Send failed', { error: err instanceof Error ? err.message : String(err) });
  }
}

// NOTE: there is intentionally no `deriveClientId()` / fingerprint helper.
// A synthetic GA4 `client_id` creates an unattributed (not set)/(not set)
// session — see INVARIANT #17. Read the real `_ga` cookie id with
// `readGa4IdsFromCookie()` instead, and skip the MP send when it's absent.
