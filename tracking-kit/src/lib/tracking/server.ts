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
 */

import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import {
  normalizePhoneE164,
  type CountryCode,
  type UserData,
} from './tracking';
import { DEFAULT_COUNTRY } from './config';

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

// ---------------------------------------------------------------------------
// SHA-256 hashing for Meta CAPI
// ---------------------------------------------------------------------------

const enc = new TextEncoder();

function hash(value: string | undefined): string | undefined {
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
// GA4 Measurement Protocol
// ---------------------------------------------------------------------------

export interface GA4MPEvent {
  name: string;
  params?: Record<string, unknown>;
}

/**
 * Sends one or more events to GA4 via Measurement Protocol. Uses a
 * stable `client_id` (caller-provided, e.g. derived from request
 * fingerprint) so server-side hits attribute to the same user the
 * browser-side gtag is reporting under, when possible.
 *
 * Server-side hits do NOT carry browser context (no _ga cookie, no
 * gclid auto-resolution). Use this primarily for events the browser
 * may not have a chance to fire (abandonment, late conversions where
 * we know the tab closed) — not as a primary conversion path.
 */
export async function sendGA4MP(
  env: ServerEnv,
  clientId: string,
  events: GA4MPEvent[],
  options: { userId?: string; logger?: Logger } = {},
): Promise<void> {
  const log = options.logger || consoleLogger;
  const measurementId = env.GA4_MEASUREMENT_ID;
  const apiSecret = env.GA4_API_SECRET;
  if (!measurementId || !apiSecret) {
    log.debug('GA4MP', 'Skipping send — measurement_id or api_secret missing');
    return;
  }

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
  const body = {
    client_id: clientId,
    ...(options.userId ? { user_id: options.userId } : {}),
    events,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      log.warn('GA4MP', `Non-2xx response: ${res.status}`);
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
    log.debug('MetaCAPI', 'Skipping send — pixel_id or access_token missing');
    return;
  }

  const transformed = events.map((evt) => {
    const ud = evt.user_data || {};
    const phone = ud.phone_number ? normalizePhoneE164(ud.phone_number, countryCode) : undefined;
    return {
      event_name: evt.event_name,
      event_id: evt.event_id,
      event_time: evt.event_time,
      event_source_url: evt.event_source_url,
      action_source: evt.action_source || 'website',
      user_data: {
        em: hash(ud.email) ? [hash(ud.email)] : undefined,
        ph: hash(phone) ? [hash(phone)] : undefined,
        fn: hash(ud.first_name) ? [hash(ud.first_name)] : undefined,
        ln: hash(ud.last_name) ? [hash(ud.last_name)] : undefined,
        ct: hash(ud.city) ? [hash(ud.city)] : undefined,
        zp: hashPostal(ud.postal_code) ? [hashPostal(ud.postal_code)] : undefined,
        country: hashCountry(ud.country) ? [hashCountry(ud.country)] : undefined,
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

  const url = `https://graph.facebook.com/v18.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      log.warn('MetaCAPI', `Non-2xx response: ${res.status}`, { body: text.slice(0, 500) });
      return;
    }
  } catch (err) {
    log.warn('MetaCAPI', 'Send failed', { error: err instanceof Error ? err.message : String(err) });
  }
}

/**
 * Creates a stable-ish GA4 `client_id` from a fingerprint. GA4 expects a
 * dot-separated random.timestamp shape but accepts any string; we use the
 * fingerprint hex so two server-side hits for the same session share an
 * id.
 */
export function deriveClientId(fingerprint: string): string {
  if (fingerprint && fingerprint.length >= 8) {
    const head = parseInt(fingerprint.slice(0, 8), 16);
    if (Number.isFinite(head)) {
      return `${head}.${Math.floor(Date.now() / 1000)}`;
    }
  }
  return `${Math.floor(Math.random() * 1e10)}.${Math.floor(Date.now() / 1000)}`;
}
