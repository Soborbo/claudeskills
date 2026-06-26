/**
 * Astro client-lib: server-side tracking dispatch a Soborbo Worker-hez.
 *
 * Használat: copy-paste az Astro site src/lib/-jába (Painless, BeautyFlow, stb.).
 * Astro env: PUBLIC_TURNSTILE_SITE_KEY publikus változó kell.
 *
 * Sprint 9 spec a 09-sprint-astro-painless.md-ben.
 */

import { generateUUID } from './uuid';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId?: string) => void;
      execute: (container?: string | HTMLElement) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
    dataLayer: unknown[];
    fbq?: (...args: unknown[]) => void;
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
  size?: 'normal' | 'compact' | 'invisible';
  appearance?: 'always' | 'execute' | 'interaction-only';
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
  // Stabil user/cookie azonosító (Meta external_id → EMQ-javítás). A Worker
  // hash-eli; ugyanezt az értéket add a böngésző Pixelnek is a dedup miatt.
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

let cachedTurnstileToken: string | undefined;
let cachedTokenExpiresAt = 0;
let turnstileWidgetId: string | undefined;
// A single widget is rendered once. Subsequent calls reset it and route the
// resolution through this pending pointer, so the original callbacks (which
// closed over the first call) can still resolve later promises.
let pendingResolver:
  | { resolve: (v: string | undefined) => void; timeout: ReturnType<typeof setTimeout> }
  | undefined;

export async function getTurnstileToken(): Promise<string | undefined> {
  if (cachedTurnstileToken && Date.now() < cachedTokenExpiresAt) {
    return cachedTurnstileToken;
  }

  if (!window.turnstile) {
    console.warn('[tracking] Turnstile not loaded');
    return undefined;
  }

  return new Promise((resolve) => {
    const container = document.getElementById('cf-turnstile-invisible');
    if (!container) {
      console.warn('[tracking] Turnstile container not found');
      resolve(undefined);
      return;
    }

    // If a previous request is still pending, resolve it as undefined
    // (we'll start a fresh challenge).
    if (pendingResolver) {
      clearTimeout(pendingResolver.timeout);
      pendingResolver.resolve(undefined);
    }

    const timeout = setTimeout(() => {
      if (pendingResolver) {
        const r = pendingResolver;
        pendingResolver = undefined;
        console.warn('[tracking] Turnstile timeout');
        r.resolve(undefined);
      }
    }, 10000);
    pendingResolver = { resolve, timeout };

    const onCallback = (token: string) => {
      if (!pendingResolver) return;
      const r = pendingResolver;
      pendingResolver = undefined;
      clearTimeout(r.timeout);
      cachedTurnstileToken = token;
      cachedTokenExpiresAt = Date.now() + 4 * 60 * 1000;
      r.resolve(token);
    };
    const onError = () => {
      if (!pendingResolver) return;
      const r = pendingResolver;
      pendingResolver = undefined;
      clearTimeout(r.timeout);
      r.resolve(undefined);
    };

    if (turnstileWidgetId !== undefined) {
      // Subsequent calls — reset and re-execute the existing widget.
      // The original callbacks delegate to the current pendingResolver above.
      window.turnstile!.reset(turnstileWidgetId);
      window.turnstile!.execute(container);
    } else {
      turnstileWidgetId = window.turnstile!.render(container, {
        sitekey: import.meta.env.PUBLIC_TURNSTILE_SITE_KEY,
        size: 'invisible',
        callback: onCallback,
        'error-callback': onError
      });
      window.turnstile!.execute(container);
    }
  });
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

// GA4 session id a `_ga_<STREAM>` cookie-ból. Két formátumot kell kezelni:
//   GS1: `GS1.1.<session_id>.<...>`
//   GS2: `GS2.1.s<session_id>$o..$g..`  ← 2025-05-06 óta az új session-ök defaultja
// A GS2-nél a session_id elé egy literál `s` kerül. Az opcionális `s`-t és a
// több jegyű verzió/slot szegmenseket is kezeljük. Nélküle az MP-event nem
// jelenik meg rendesen a GA4 riportokban.
function extractGASessionId(): string | undefined {
  const match = document.cookie.match(/_ga_[A-Z0-9]+=GS\d+\.\d+\.s?(\d+)/);
  return match ? match[1] : undefined;
}

// Consent Mode v2 állapot. Forrás-sorrend:
//   1) window.__trackingConsent (explicit override, pl. teszthez)
//   2) CookieYes `cookieyes-consent` cookie (GTM-ből betöltött CMP)
// Hiányában undefined → a Worker a SiteConfig.require_consent szerint dönt
// (EEA-n állítsd require_consent:true-ra → fail-closed cookie/döntés hiányában).
//
// CookieYes cookie formátum:
//   consentid:..,consent:yes,necessary:yes,functional:yes,analytics:yes,
//   performance:yes,advertisement:yes,other:yes   (elutasításnál :no)
// Consent Mode v2 leképezés (CookieYes hivatalos):
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
  // Ha nincs kategória-kulcs, nem CookieYes-cookie → ne találgassunk.
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

// ── Univerzális attribúció-gyűjtés ──────────────────────────────────────────
// Minden bevett click ID + UTM, az URL-ből + `_gcl_aw` cookie fallbackkel,
// localStorage-ban perzisztálva (a konverzió gyakran másik oldalon történik,
// mint a landing). Last-touch nyer a click ID-knél/UTM-eknél; a landing-kontextus
// (landing_page, referrer) first-touch.
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
    // localStorage tiltva (privacy mód) — best-effort, csendben kihagyjuk.
  }
}

// gclid a `_gcl_aw` cookie-ból (formátum: GCL.<ts>.<gclid>) — fallback, ha az
// URL-ben már nincs gclid (pl. a felhasználó belső oldalon konvertál).
function gclidFromCookie(): string | undefined {
  const c = getCookie('_gcl_aw');
  if (!c) return undefined;
  const parts = c.split('.');
  return parts.length >= 3 ? parts.slice(2).join('.') : undefined;
}

export function collectAttribution(): AttributionParams {
  const stored = readStoredAttribution();
  const fresh: AttributionParams = {};

  // Ad-consent kapu: a click ID-k ad-azonosítók → CSAK ad-consent mellett
  // gyűjtjük/tároljuk/küldjük (ePrivacy/TCF). UTM/landing analitikai metaadat.
  // Consent hiányában (még nincs döntés) fail-closed → nincs click ID.
  const consent = getConsentState();
  const adGranted =
    consent?.ad_user_data === 'GRANTED' || consent?.ad_storage === 'GRANTED';

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

  // Last-touch: a friss URL-jelek felülírják a tároltat.
  const merged: AttributionParams = { ...stored, ...fresh };

  // Ad-consent visszavonva/hiányzik → a korábban tárolt click ID-ket is dobjuk
  // (ne perzisztáljon/menjen ad-azonosító consent nélkül).
  if (!adGranted) {
    for (const k of ATTR_CLICK_PARAMS) delete merged[k];
  }

  // First-touch landing-kontextus (nem írjuk felül, ha már megvan).
  if (!merged.landing_page) merged.landing_page = window.location.href;
  if (!merged.referrer && document.referrer) merged.referrer = document.referrer;

  writeStoredAttribution(merged);
  return merged;
}

export async function sendToWorker(payload: ConversionPayload): Promise<boolean> {
  const turnstileToken = await getTurnstileToken();
  if (!turnstileToken) {
    console.warn('[tracking] No Turnstile token, skipping server-side dispatch', payload.event_name);
    return false;
  }

  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');
  const clientId = extractGAClientId(getCookie('_ga'));
  const sessionId = extractGASessionId();

  const body = JSON.stringify({
    ...payload,
    turnstile_token: turnstileToken,
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
      if (queued) return true;
    } catch {
      // Fall through to fetch
    }
  }

  try {
    await fetch('/api/event/conversion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    });
    return true;
  } catch (err) {
    console.warn('[tracking] sendToWorker failed', err);
    return false;
  }
}

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
  const eventId = params.event_id || generateUUID();
  const eventTime = Math.floor(Date.now() / 1000);

  // 1. Existing kliens GTM dataLayer push (Meta Pixel browser-side dedup-hoz).
  // PII NEM kerül dataLayer-be — CLAUDE.md #15.
  if (typeof window !== 'undefined') {
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

  // 2. Server-side Worker dispatch (PII a body-ban, hash-elve a Worker-ben).
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
