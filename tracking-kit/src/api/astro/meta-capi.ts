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
 * Hardening: the endpoint accepts only events from your own origins,
 * rate-limits per-IP (PROVIDE YOUR OWN — see comments below), clamps
 * `event_time` to a sane window so backdated/forward-dated events
 * can't pollute Smart Bidding, and only allows the Meta event names
 * you actually fire.
 */

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { sendMetaCapi, type MetaCapiEvent } from '@/lib/tracking/server';
import { DEFAULT_COUNTRY } from '@/lib/tracking/config';

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

// --- CUSTOMIZE: drop in your project's rate limiter. Cloudflare KV /
//     Durable Objects / a third-party limiter are all fine. The point
//     is to bound burst rate per-IP so a single client can't burn
//     your Meta CAPI quota or pollute Smart Bidding with fake events. ---
async function checkRateLimit(_request: Request): Promise<boolean> {
  // return await yourRateLimiter.allow(_request.headers.get('CF-Connecting-IP'));
  return true;
}

export const POST: APIRoute = async (context) => {
  const { request } = context;
  const origin = request.headers.get('Origin');

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return new Response(null, { status: 204 });
  }

  const rateLimitOk = await checkRateLimit(request);
  if (!rateLimitOk) {
    return new Response(null, { status: 204 });
  }

  try {
    const body = (await request.json()) as IncomingPayload;

    if (!body || !body.event_name || !body.event_id) {
      return new Response(JSON.stringify({ error: 'event_name and event_id required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!ALLOWED_EVENTS.has(body.event_name)) {
      return new Response(JSON.stringify({ error: 'event_name not allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ip = request.headers.get('CF-Connecting-IP') || undefined;
    const ua = request.headers.get('User-Agent') || undefined;
    const incomingUserData = isPlainObject(body.user_data) ? body.user_data : {};
    const incomingCustom = isPlainObject(body.custom_data) ? body.custom_data : {};

    const userData: NonNullable<MetaCapiEvent['user_data']> = {};
    if (typeof incomingUserData.email === 'string') userData.email = incomingUserData.email;
    if (typeof incomingUserData.phone_number === 'string') userData.phone_number = incomingUserData.phone_number;
    if (typeof incomingUserData.first_name === 'string') userData.first_name = incomingUserData.first_name;
    if (typeof incomingUserData.last_name === 'string') userData.last_name = incomingUserData.last_name;
    if (typeof incomingUserData.city === 'string') userData.city = incomingUserData.city;
    if (typeof incomingUserData.postal_code === 'string') userData.postal_code = incomingUserData.postal_code;
    userData.country = typeof incomingUserData.country === 'string' ? incomingUserData.country : DEFAULT_COUNTRY;
    if (typeof incomingUserData.fbp === 'string') userData.fbp = incomingUserData.fbp;
    if (typeof incomingUserData.fbc === 'string') userData.fbc = incomingUserData.fbc;
    if (ua) userData.client_user_agent = ua;
    if (ip) userData.client_ip_address = ip;

    const event: MetaCapiEvent = {
      event_name: body.event_name,
      event_id: String(body.event_id).slice(0, 200),
      event_time: clampEventTime(body.event_time),
      action_source: 'website',
      user_data: userData,
      custom_data: incomingCustom,
    };
    if (typeof body.event_source_url === 'string') {
      event.event_source_url = body.event_source_url.slice(0, 2000);
    }

    await sendMetaCapi(env as Parameters<typeof sendMetaCapi>[0], [event], { countryCode: DEFAULT_COUNTRY });
  } catch (err) {
    console.warn('[MetaCAPI] Failed to process mirror request', err);
  }

  return new Response(null, { status: 204 });
};
