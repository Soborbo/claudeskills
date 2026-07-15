/**
 * Astro client-lib: BROWSER-side tracking dispatch to the Soborbo event-gateway.
 *
 * Usage: copy-paste into the Astro site's src/lib/ (Painless, BeautyFlow, etc.).
 *
 * SCOPE — read this before "improving" anything:
 *
 *  - This module serves the BROWSER ingress path only (`/api/event/conversion`,
 *    tokenless, Origin allow-list + rate limit on the gateway). It may carry ONLY
 *    the low-risk click/engagement events in `BROWSER_GATEWAY_EVENTS`.
 *  - High-value conversions (forms/lead/purchase — `SERVER_INGRESS_ONLY_EVENTS`)
 *    are dispatched by the SITE BACKEND on `/api/event/conversion-server` with the
 *    per-site token (see server/backend/gateway-dispatch.ts). The gateway 403s
 *    them here (TRK-400-017). `sendToWorker` HARD-BLOCKS them client-side too, so
 *    a wiring mistake is a loud diagnostic instead of a silent conversion loss.
 *  - There is NO Turnstile anywhere in this path. The old Turnstile token gate
 *    silently swallowed real click conversions for two weeks in production
 *    (2026-06-28→07-13) while validating against a test secret. Do NOT add a
 *    "bot check" that can block the dispatch — the gateway's Origin allow-list +
 *    rate limit is the browser-path control, server-side.
 */

import { hasAnalyticsConsent, hasMarketingConsent } from './consent';
import { generateUUID } from './uuid';
import { report } from './observability';
import { BROWSER_GATEWAY_EVENTS, SERVER_INGRESS_ONLY_EVENTS } from './event-contract';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
  }
}

export interface UserData {
  email?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  street?: string;
  postal_code?: string;
  country?: string;
  // Stable user/cookie identifier (Meta external_id → EMQ improvement). The Worker
  // hashes it; pass the same value to the browser Pixel too for deduplication.
  external_id?: string;
}

export type ConsentSignal = 'GRANTED' | 'DENIED' | 'UNSPECIFIED';

export interface ConsentState {
  ad_user_data?: ConsentSignal;
  ad_personalization?: ConsentSignal;
  ad_storage?: ConsentSignal;
  analytics_storage?: ConsentSignal;
}

export type AttributionParams = Record<string, string>;

export interface ConversionPayload {
  event_name: string;
  event_id: string;
  event_time: number;
  value?: number;
  currency?: string;
  source?: string;
  service?: string;
  user_data?: UserData;
  event_source_url?: string;
  consent?: ConsentState;
  attribution?: AttributionParams;
}

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}

function extractGAClientId(gaCookie: string | undefined): string | undefined {
  if (!gaCookie) return undefined;
  const parts = gaCookie.split('.');
  return parts.length >= 4 ? `${parts[2]}.${parts[3]}` : undefined;
}

// GA4 session id from the `_ga_<STREAM>` cookie. Two formats must be handled:
//   GS1: `GS1.1.<session_id>.<...>`
//   GS2: `GS2.1.s<session_id>$o..$g..`  ← the default for new sessions since 2025-05-06
// In GS2 a literal `s` precedes the session_id. We handle the optional `s` and the
// multi-digit version/slot segments too.
function extractGASessionId(): string | undefined {
  const match = document.cookie.match(/_ga_[A-Z0-9]+=GS\d+\.\d+\.s?(\d+)/);
  return match ? match[1] : undefined;
}

// Consent Mode v2 state. Source order:
//   1) window.__trackingConsent (explicit override, e.g. for testing)
//   2) CookieYes `cookieyes-consent` cookie (CMP loaded from GTM)
// If absent → undefined → the Worker decides based on SiteConfig.require_consent
// (on EEA set require_consent:true → fail-closed when the cookie/decision is missing).
//
// CookieYes cookie format:
//   consentid:..,consent:yes,necessary:yes,functional:yes,analytics:yes,
//   performance:yes,advertisement:yes,other:yes   (:no when rejected)
// Consent Mode v2 mapping (CookieYes official):
//   advertisement → ad_storage + ad_user_data + ad_personalization
//   analytics     → analytics_storage
function getConsentState(): ConsentState | undefined {
  if (typeof window === 'undefined') return undefined;

  const override = (window as unknown as { __trackingConsent?: ConsentState }).__trackingConsent;
  if (override && typeof override === 'object') return override;

  const raw = getCookie('cookieyes-consent');
  if (!raw) return undefined;

  const map: Record<string, string> = {};
  for (const part of raw.split(',')) {
    const idx = part.indexOf(':');
    if (idx > 0) map[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  // If there is no category key, it's not a CookieYes cookie → don't guess.
  if (map.advertisement === undefined && map.analytics === undefined) return undefined;

  const sig = (yes: boolean): ConsentSignal => (yes ? 'GRANTED' : 'DENIED');
  const adGranted = map.advertisement === 'yes';
  return {
    ad_user_data: sig(adGranted),
    ad_personalization: sig(adGranted),
    ad_storage: sig(adGranted),
    analytics_storage: sig(map.analytics === 'yes')
  };
}

// ── Universal attribution collection ────────────────────────────────────────
// All common click IDs + UTMs, from the URL + a `_gcl_aw` cookie fallback,
// persisted in localStorage (the conversion often happens on a different page
// than the landing). Last-touch wins for click IDs/UTMs; the landing context
// (landing_page, referrer) is first-touch.
const ATTR_STORAGE_KEY = '__sb_attribution';
const ATTR_CLICK_PARAMS = [
  'gclid',
  'gbraid',
  'wbraid',
  'gclsrc',
  'gad_source',
  'dclid',
  'fbclid',
  'msclkid',
  'ttclid',
  'li_fat_id',
  'twclid'
];
const ATTR_UTM_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_source_platform',
  'utm_creative_format',
  'utm_marketing_tactic'
];

function readStoredAttribution(): AttributionParams {
  try {
    const raw = localStorage.getItem(ATTR_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AttributionParams) : {};
  } catch {
    return {};
  }
}

function writeStoredAttribution(a: AttributionParams): void {
  try {
    localStorage.setItem(ATTR_STORAGE_KEY, JSON.stringify(a));
  } catch {
    // localStorage blocked (privacy mode) — best-effort, silently skip.
  }
}

// gclid from the `_gcl_aw` cookie (format: GCL.<ts>.<gclid>) — fallback when the
// URL no longer has a gclid (e.g. the user converts on an internal page).
function gclidFromCookie(): string | undefined {
  const c = getCookie('_gcl_aw');
  if (!c) return undefined;
  const parts = c.split('.');
  return parts.length >= 3 ? parts.slice(2).join('.') : undefined;
}

export function collectAttribution(): AttributionParams {
  const stored = readStoredAttribution();
  const fresh: AttributionParams = {};

  // Ad-consent gate: click IDs are ad identifiers → we ONLY collect/store/send
  // them with ad consent (ePrivacy/TCF). UTM/landing is analytics metadata.
  //
  // Consent-source consistency: getConsentState() reads the CookieYes COOKIE, while
  // the rest of the lib gates on the CookieYes JS API (hasMarketingConsent). If the
  // cookie isn't present yet but the JS API already says marketing is granted, the
  // old code stripped all click IDs from the server-side payload even though the
  // user consented. Fall back to the JS API when the cookie/override is absent so
  // the two channels agree. (When the cookie IS present we respect its signals,
  // including an explicit DENIED.) Fail-closed when neither source grants.
  const consent = getConsentState();
  const adGranted = consent
    ? consent.ad_user_data === 'GRANTED' || consent.ad_storage === 'GRANTED'
    : hasMarketingConsent();

  try {
    const params = new URLSearchParams(window.location.search);
    if (adGranted) {
      for (const k of ATTR_CLICK_PARAMS) {
        const v = params.get(k);
        if (v) fresh[k] = v;
      }
    }
    for (const k of ATTR_UTM_PARAMS) {
      const v = params.get(k);
      if (v) fresh[k] = v;
    }
  } catch {
    // no-op
  }

  if (adGranted && !fresh.gclid) {
    const g = gclidFromCookie();
    if (g) fresh.gclid = g;
  }

  // Last-touch: the fresh URL signals override the stored ones.
  const merged: AttributionParams = { ...stored, ...fresh };

  // First-touch landing context (don't overwrite if already present).
  if (!merged.landing_page) merged.landing_page = window.location.href;
  if (!merged.referrer && document.referrer) merged.referrer = document.referrer;

  if (adGranted) {
    writeStoredAttribution(merged);
    return merged;
  }

  // Click-ID handling without a grant is THREE-state, not two:
  //  - explicit DENIED → honor the revocation at rest too: purge stored
  //    click IDs and send none.
  //  - UNKNOWN (no CookieYes cookie yet, JS API not loaded — the boot
  //    race on every early page-load) → fail-closed on the WIRE (no click
  //    IDs leave the browser), but do NOT purge IDs stored under a prior
  //    grant. Treating "unknown" as a denial deleted a consented user's
  //    gclid before the CMP initialised, orphaning the conversion from
  //    its ad click.
  const adDenied = consent
    ? consent.ad_user_data === 'DENIED' && consent.ad_storage === 'DENIED'
    : false;

  if (adDenied) {
    for (const k of ATTR_CLICK_PARAMS) delete merged[k];
    writeStoredAttribution(merged);
    return merged;
  }

  // Unknown: persist untouched (fresh contains no click IDs — collection
  // above is grant-gated), strip click IDs from the outgoing copy only.
  writeStoredAttribution(merged);
  const outgoing: AttributionParams = { ...merged };
  for (const k of ATTR_CLICK_PARAMS) delete outgoing[k];
  return outgoing;
}

/**
 * Browser dispatch to the gateway (`/api/event/conversion`).
 *
 * GUARDRAIL: only `BROWSER_GATEWAY_EVENTS` pass. A `server_ingress_only` event
 * (or any name outside the browser allow-list) is refused HERE, with a loud
 * TRK-1005 diagnostic — the gateway would 403/drop it anyway, but a client-side
 * block turns "silently lost conversion" into "visible wiring bug". Send those
 * events from the site backend instead (server/backend/gateway-dispatch.ts).
 *
 * Transport: `sendBeacon` first (survives page unload — tel:/mailto: clicks
 * navigate away), `fetch keepalive` fallback. The fetch fallback DOES inspect the
 * HTTP status: a 4xx/5xx reports TRK-1006 (GATEWAY_REJECTED) instead of lying
 * "sent". (A queued beacon cannot be inspected — that's inherent to beacons and
 * acceptable for low-risk click events; the gateway's D1 ledger is the ground
 * truth either way.)
 */
export async function sendToWorker(payload: ConversionPayload): Promise<boolean> {
  if (SERVER_INGRESS_ONLY_EVENTS.has(payload.event_name) || !BROWSER_GATEWAY_EVENTS.has(payload.event_name)) {
    report('GATEWAY_SERVER_ONLY_EVENT', { event_name: payload.event_name });
    return false;
  }

  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');
  const clientId = extractGAClientId(getCookie('_ga'));
  const sessionId = extractGASessionId();

  const body = JSON.stringify({
    ...payload,
    fbp,
    fbc,
    client_id: clientId,
    session_id: sessionId,
    consent: payload.consent || getConsentState(),
    attribution: payload.attribution || collectAttribution(),
    event_source_url: payload.event_source_url || location.href
  });

  if (typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([body], { type: 'application/json' });
      const queued = navigator.sendBeacon('/api/event/conversion', blob);
      if (queued) { report('GATEWAY_OK', { event_name: payload.event_name, transport: 'beacon' }); return true; }
      report('GATEWAY_BEACON_FALLBACK', { event_name: payload.event_name });
    } catch {
      report('GATEWAY_BEACON_FALLBACK', { event_name: payload.event_name });
    }
  }

  try {
    const res = await fetch('/api/event/conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    });
    if (!res.ok) {
      // 403 = Origin not allow-listed OR a server-ingress-only event slipped
      // through (TRK-400-017 on the gateway); 429 = rate limit; 404 = hostname
      // missing from SITE_CONFIG KV. All of them mean the conversion did NOT land.
      report('GATEWAY_REJECTED', { event_name: payload.event_name, status: res.status });
      return false;
    }
    report('GATEWAY_OK', { event_name: payload.event_name, transport: 'fetch' });
    return true;
  } catch (err) {
    report('GATEWAY_NETWORK_FAIL', { event_name: payload.event_name, error: String(err) });
    return false;
  }
}

/**
 * @deprecated Prefer the consent-safe entry points in `index.ts`
 * (`trackServerEvent` / `trackPhoneConversion` …). This low-level helper is kept
 * for direct/advanced use. It is CONSENT-GATED to match the skill's consent
 * matrix: the dataLayer push needs analytics consent, the gateway dispatch needs
 * marketing consent. Without either it is a no-op. The gateway leg only accepts
 * browser-path events (see `sendToWorker`).
 */
export async function trackConversion(
  eventName: string,
  params: {
    event_id?: string;
    value?: number;
    currency?: string;
    source?: string;
    service?: string;
    user_data?: UserData;
    consent?: ConsentState;
  } = {}
): Promise<void> {
  const analytics = hasAnalyticsConsent();
  const marketing = hasMarketingConsent();
  if (!analytics && !marketing) return; // no consent → don't push or dispatch

  const eventId = params.event_id || generateUUID();
  const eventTime = Math.floor(Date.now() / 1000);

  // 1. Client GTM dataLayer push (for Meta Pixel browser-side dedup) — analytics consent.
  // PII does NOT go into the dataLayer.
  if (analytics && typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      event_id: eventId,
      ...(params.value !== undefined && { value: params.value }),
      ...(params.currency && { currency: params.currency }),
      ...(params.source && { source: params.source }),
      ...(params.service && { service: params.service })
    });
  }

  // 2. Server-side Worker dispatch (PII in the body, hashed in the Worker) — marketing consent.
  if (marketing) {
    await sendToWorker({
      event_name: eventName,
      event_id: eventId,
      event_time: eventTime,
      value: params.value,
      currency: params.currency,
      source: params.source,
      service: params.service,
      user_data: params.user_data,
      consent: params.consent
    });
  }
}
