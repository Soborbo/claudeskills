/**
 * Meta Conversions API mirror endpoint — Astro + Cloudflare Pages.
 *
 * Mount at `src/pages/api/meta/capi.ts` in your Astro project.
 *
 * The browser fires Meta Pixel events (Lead, Contact, ViewContent) via
 * GTM. For each conversion the client also POSTs (or `sendBeacon`s)
 * here with the same `event_id` so Meta can dedupe browser + server.
 *
 * Server-side advantages:
 *   - iOS/ATT users where the browser Pixel is throttled
 *   - Adblock-affected sessions
 *   - Reliable hashed PII (we hash here; the browser side can't be
 *     trusted to do it consistently)
 *
 * Hardening:
 *   - Origin must be present AND in the allowlist (no Origin = reject;
 *     plain server-to-server / curl no longer slips through).
 *   - Per-IP sliding-window rate limit; CAPI events get a tighter cap
 *     than abandonment because every accepted hit costs a Meta CAPI
 *     forward.
 *   - `event_time` is clamped to a sane window so backdated/forward-
 *     dated events can't poison Smart Bidding.
 *   - `event_name`, `event_id`, `currency`, `value` are validated by
 *     shape and range.
 *   - `custom_data` is whitelisted to (`value`, `currency`,
 *     `content_name`) — anything else is dropped so a tampered client
 *     can't forward `predicted_ltv: 1e9` and poison bidding.
 *   - `fbp` / `fbc` cookie shape is validated server-side too —
 *     attribution-spoofing via crafted cookies doesn't reach Meta.
 *   - `event_source_url` is pinned to the configured origins; if the
 *     client supplied something else we fall back to the request's
 *     Referer (also pinned), or send no source URL at all.
 *   - Consent snapshot from the client is required to be `granted`
 *     for `ad_storage` AND `ad_user_data`. Missing snapshot = reject.
 */

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import {
  checkRateLimit,
  corsPreflightResponse,
  isAllowedOrigin,
  isValidConversionValue,
  isValidCurrency,
  isValidEventId,
  isValidEmail,
  isValidFbc,
  isValidFbp,
  metaCapiConsentAllowed,
  pickEventSourceUrl,
  sendMetaCapi,
  type MetaCapiEvent,
} from '@/lib/tracking/server';
import { DEFAULT_COUNTRY, RATE_LIMIT_CAPI_MAX } from '@/lib/tracking/config';

export const prerender = false;

// --- CUSTOMIZE: your allowed origins. Reject everything else. ---
const ALLOWED_ORIGINS = new Set<string>([
  'https://example.com',
  'https://www.example.com',
]);

// --- CUSTOMIZE: which Meta event names this endpoint accepts. Keep
//     it tight — adding `Purchase` here when you don't track purchases
//     just opens an injection vector for fake conversions. ---
const ALLOWED_EVENTS = new Set(['Lead', 'Contact', 'ViewContent']);

/** Acceptable event_time skew. Clamp older than 24h or newer than 5min
 *  to "now" so backdated/forward-dated events can't poison the data. */
const EVENT_TIME_MIN_AGE_S = 24 * 60 * 60;
const EVENT_TIME_FUTURE_S = 5 * 60;

interface IncomingPayload {
  event_name?: string;
  event_id?: string;
  event_time?: number;
  event_source_url?: string;
  user_data?: Record<string, unknown>;
  custom_data?: Record<string, unknown>;
  consent_state?: Record<string, unknown>;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function clampEventTime(input: unknown): number {
  const now = Math.floor(Date.now() / 1000);
  if (typeof input !== 'number' || !Number.isFinite(input)) return now;
  if (input < now - EVENT_TIME_MIN_AGE_S) return now;
  if (input > now + EVENT_TIME_FUTURE_S) return now;
  return Math.floor(input);
}

/** Drop everything except the value/currency/content_name keys we
 *  actually consume, and range-check the numbers. Without this, a
 *  tampered client can post `value: 1e12` or pollute `predicted_ltv`
 *  / `content_ids` / etc. and poison Smart Bidding. */
function sanitizeCustomData(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (isValidConversionValue(input.value)) out.value = input.value;
  if (isValidCurrency(input.currency)) out.currency = input.currency;
  if (typeof input.content_name === 'string' && input.content_name.length <= 200) {
    out.content_name = input.content_name;
  }
  return out;
}

export const OPTIONS: APIRoute = async ({ request }) => {
  return corsPreflightResponse(request.headers.get('Origin'), ALLOWED_ORIGINS);
};

export const POST: APIRoute = async (context) => {
  const { request } = context;
  const origin = request.headers.get('Origin');

  if (!isAllowedOrigin(origin, ALLOWED_ORIGINS)) {
    return new Response(null, { status: 204 });
  }

  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (!checkRateLimit(`capi:${ip}`, RATE_LIMIT_CAPI_MAX)) {
    return new Response(null, { status: 429 });
  }

  try {
    const body = (await request.json()) as IncomingPayload;

    if (!body || !isValidEventId(body.event_id)) {
      return new Response(JSON.stringify({ error: 'invalid event_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (typeof body.event_name !== 'string' || !ALLOWED_EVENTS.has(body.event_name)) {
      return new Response(JSON.stringify({ error: 'event_name not allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!metaCapiConsentAllowed(body.consent_state)) {
      // Drop silently — sendBeacon can't read the body, and we don't
      // want a noisy retry loop on the client. The client is also
      // supposed to gate on consent before sending; this is the
      // server-side defense-in-depth check.
      return new Response(null, { status: 204 });
    }

    const ua = request.headers.get('User-Agent') || undefined;
    const incomingUserData = isPlainObject(body.user_data) ? body.user_data : {};
    const incomingCustom = isPlainObject(body.custom_data) ? body.custom_data : {};

    const userData: NonNullable<MetaCapiEvent['user_data']> = {};
    if (isValidEmail(incomingUserData.email)) userData.email = incomingUserData.email;
    if (typeof incomingUserData.phone_number === 'string' && incomingUserData.phone_number.length <= 32) {
      userData.phone_number = incomingUserData.phone_number;
    }
    if (typeof incomingUserData.first_name === 'string' && incomingUserData.first_name.length <= 100) {
      userData.first_name = incomingUserData.first_name;
    }
    if (typeof incomingUserData.last_name === 'string' && incomingUserData.last_name.length <= 100) {
      userData.last_name = incomingUserData.last_name;
    }
    if (typeof incomingUserData.city === 'string' && incomingUserData.city.length <= 100) {
      userData.city = incomingUserData.city;
    }
    if (typeof incomingUserData.postal_code === 'string' && incomingUserData.postal_code.length <= 20) {
      userData.postal_code = incomingUserData.postal_code;
    }
    userData.country = typeof incomingUserData.country === 'string' && incomingUserData.country.length === 2
      ? incomingUserData.country
      : DEFAULT_COUNTRY;
    if (isValidFbp(incomingUserData.fbp)) userData.fbp = incomingUserData.fbp;
    if (isValidFbc(incomingUserData.fbc)) userData.fbc = incomingUserData.fbc;
    if (ua) userData.client_user_agent = ua.slice(0, 500);
    if (ip) userData.client_ip_address = ip;

    const event: MetaCapiEvent = {
      event_name: body.event_name,
      event_id: body.event_id,
      event_time: clampEventTime(body.event_time),
      action_source: 'website',
      user_data: userData,
      custom_data: sanitizeCustomData(incomingCustom),
    };
    const sourceUrl = pickEventSourceUrl(
      body.event_source_url,
      request.headers.get('Referer'),
      ALLOWED_ORIGINS,
    );
    if (sourceUrl) event.event_source_url = sourceUrl;

    await sendMetaCapi(env as Parameters<typeof sendMetaCapi>[0], [event], { countryCode: DEFAULT_COUNTRY });
  } catch (err) {
    console.warn('[MetaCAPI] Failed to process mirror request', err);
  }

  return new Response(null, { status: 204 });
};
