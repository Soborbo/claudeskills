/**
 * Browser-side dataLayer push helper + PII side-channel.
 *
 * Why a side-channel for PII? Anything pushed to `window.dataLayer` is
 * visible to every GTM tag and (for HTML-tag templates) to anything that
 * iterates `window.dataLayer` directly. We keep email/phone/name/address
 * in `data-*` attributes on a hidden DOM node and read them from GTM
 * Variables when (and only when) a tag actually needs them. That keeps
 * the dataLayer free of PII for inspection, vendor audits, and the
 * accidental third-party script that decides to grep it.
 */

import {
  COUNTRY_DIAL_CODES,
  DEFAULT_COUNTRY,
  USER_DATA_ELEMENT_ID,
  USER_DATA_STORAGE_KEY,
  USER_DATA_TTL_MS,
  type CountryCode,
} from './config';
import { generateUUID } from './uuid';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export type TrackingParams = Record<string, unknown> & { event_id?: string };

/**
 * Pushes a NON-PII event to `window.dataLayer`. Returns the `event_id`
 * used (generated if not provided) so callers that need to mirror to a
 * server-side endpoint with the same dedup key can do so.
 */
export function trackEvent(name: string, params: TrackingParams = {}): string {
  if (typeof window === 'undefined') return '';

  const { user_data, event_id: providedId, ...safe } = params;
  if (user_data && isDevEnv()) {
    // eslint-disable-next-line no-console
    console.warn(
      `[tracking] PII detected in trackEvent('${name}'). Use setUserDataOnDOM() instead.`,
    );
  }

  const event_id = (providedId as string | undefined) || generateUUID();
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: name,
    event_id,
    ...safe,
  });
  return event_id;
}

function isDevEnv(): boolean {
  // Vite/Astro: import.meta.env.DEV. Webpack/Next: process.env.NODE_ENV.
  // We check both so the warning works regardless of bundler.
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
      return true;
    }
  } catch {
    // import.meta not available (CommonJS) — fall through
  }
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// User-data side-channel (DOM-based, NOT dataLayer)
// ---------------------------------------------------------------------------

export interface UserData {
  email?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  street?: string;
  postal_code?: string;
  country?: string;
}

function ensureUserDataElement(): HTMLElement {
  let el = document.getElementById(USER_DATA_ELEMENT_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = USER_DATA_ELEMENT_ID;
    el.style.display = 'none';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  return el;
}

function writeUserDataToDOMElement(data: UserData): void {
  const el = ensureUserDataElement();
  if (data.email) el.dataset.email = data.email;
  if (data.phone_number) el.dataset.phone = data.phone_number;
  if (data.first_name) el.dataset.firstName = data.first_name;
  if (data.last_name) el.dataset.lastName = data.last_name;
  if (data.city) el.dataset.city = data.city;
  if (data.street) el.dataset.street = data.street;
  if (data.postal_code) el.dataset.postalCode = data.postal_code;
  if (data.country) el.dataset.country = data.country;
}

interface StoredUserData {
  v: 1;
  savedAt: number;
  data: UserData;
}

function isStoredUserData(v: unknown): v is StoredUserData {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return o.v === 1 && typeof o.savedAt === 'number' && !!o.data && typeof o.data === 'object';
}

/**
 * Stores user data on a hidden DOM element AND (gated by consent) in
 * localStorage with a TTL so the data survives a page close. Subsequent
 * page-loads call `restoreUserDataFromStorage()` from boot to repopulate
 * the DOM — this is what lets a late-conversion CAPI mirror (fired from
 * `boot.ts` before any UI component mounts) include hashed user
 * identifiers, which Meta requires.
 *
 * Persistence rules:
 *   - localStorage write only happens if `ad_storage` consent is
 *     granted. Without ads consent, PII lives only on the DOM element
 *     and dies with the tab.
 *   - Stored blob carries `savedAt`; on read past `USER_DATA_TTL_MS` it
 *     is purged, so an unattended browser doesn't leave PII recoverable
 *     indefinitely.
 *
 * Each call merges with previously-stored fields rather than replacing
 * the whole blob, so earlier-step data isn't wiped by later steps.
 */
export function setUserDataOnDOM(data: UserData): void {
  if (typeof document === 'undefined') return;
  writeUserDataToDOMElement(data);

  if (typeof localStorage === 'undefined') return;
  if (!hasAdStorageConsent()) return;
  try {
    const existing = readUserDataFromStorage();
    const merged: UserData = { ...existing, ...data };
    const blob: StoredUserData = { v: 1, savedAt: Date.now(), data: merged };
    localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(blob));
  } catch {
    // localStorage full / disabled — DOM-only is still functional
  }
}

function readUserDataFromStorage(): UserData {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(USER_DATA_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredUserData(parsed)) {
      // Legacy blob (pre-TTL format) or hand-edited junk — drop it.
      try { localStorage.removeItem(USER_DATA_STORAGE_KEY); } catch { /* ignore */ }
      return {};
    }
    if (Date.now() - parsed.savedAt > USER_DATA_TTL_MS) {
      try { localStorage.removeItem(USER_DATA_STORAGE_KEY); } catch { /* ignore */ }
      return {};
    }
    return parsed.data;
  } catch {
    return {};
  }
}

/**
 * Called from `boot.ts` on every page-load so the hidden DOM element
 * is repopulated before `resumeConversionTimer()` runs (which may
 * immediately fire a late conversion + CAPI mirror). Reads through
 * `readUserDataFromStorage()` which enforces the TTL, so an expired
 * blob is silently purged.
 */
export function restoreUserDataFromStorage(): void {
  if (typeof document === 'undefined') return;
  const data = readUserDataFromStorage();
  if (Object.keys(data).length === 0) return;
  writeUserDataToDOMElement(data);
}

/**
 * Wipes the side-channel PII from BOTH the hidden DOM element and
 * localStorage. Call after a conversion is fully complete (e.g. once
 * `primary_conversion` fires and there's nothing else to attribute) so
 * the PII has the shortest possible at-rest lifetime.
 */
export function clearUserDataOnDOM(): void {
  if (typeof document === 'undefined') return;
  document.getElementById(USER_DATA_ELEMENT_ID)?.remove();
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(USER_DATA_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

// ---------------------------------------------------------------------------
// Consent state — read from Google's consent API (set by GTM Consent Mode v2)
// ---------------------------------------------------------------------------

export type ConsentValue = 'granted' | 'denied';
export interface ConsentSnapshot {
  ad_storage: ConsentValue;
  ad_user_data: ConsentValue;
  ad_personalization: ConsentValue;
  analytics_storage: ConsentValue;
}

interface GoogleTagData {
  ics?: { entries?: Record<string, { default?: string; update?: string }> };
}

declare global {
  interface Window {
    google_tag_data?: GoogleTagData;
  }
}

/**
 * Reads the current Consent Mode v2 state. GTM exposes the per-purpose
 * consent values on `window.google_tag_data.ics.entries`; if the user has
 * not interacted yet, the `default` from `GTMHead` applies (denied for
 * everything except security_storage).
 *
 * Returns 'denied' for any purpose we can't read — fail closed, never
 * fail open. Server-side callers (sendMetaCapi etc.) MUST receive this
 * snapshot from the client and refuse to forward when ads consent is
 * denied.
 */
export function getConsentSnapshot(): ConsentSnapshot {
  const fallback: ConsentSnapshot = {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  };
  if (typeof window === 'undefined') return fallback;
  const entries = window.google_tag_data?.ics?.entries;
  if (!entries) return fallback;
  const read = (k: keyof ConsentSnapshot): ConsentValue => {
    const e = entries[k];
    const v = e?.update ?? e?.default;
    return v === 'granted' ? 'granted' : 'denied';
  };
  return {
    ad_storage: read('ad_storage'),
    ad_user_data: read('ad_user_data'),
    ad_personalization: read('ad_personalization'),
    analytics_storage: read('analytics_storage'),
  };
}

export function hasAdStorageConsent(): boolean {
  return getConsentSnapshot().ad_storage === 'granted';
}

export function hasFullAdsConsent(): boolean {
  const c = getConsentSnapshot();
  return c.ad_storage === 'granted' && c.ad_user_data === 'granted';
}

export function readUserDataFromDOM(): UserData {
  if (typeof document === 'undefined') return {};
  const el = document.getElementById(USER_DATA_ELEMENT_ID);
  if (!el) return {};
  const d = el.dataset;
  const out: UserData = {};
  if (d.email) out.email = d.email;
  if (d.phone) out.phone_number = d.phone;
  if (d.firstName) out.first_name = d.firstName;
  if (d.lastName) out.last_name = d.lastName;
  if (d.city) out.city = d.city;
  if (d.street) out.street = d.street;
  if (d.postalCode) out.postal_code = d.postalCode;
  if (d.country) out.country = d.country;
  return out;
}

// ---------------------------------------------------------------------------
// Normalization (used by both client side and the CAPI endpoint)
// ---------------------------------------------------------------------------

export type { CountryCode } from './config';

/**
 * Normalizes a user-typed phone string to E.164. Strips spaces/hyphens/
 * parens. If a leading + is present we trust the caller. Otherwise we
 * resolve a national-format number (typically with a leading 0) to the
 * country's dial code.
 *
 * Add new countries to COUNTRY_DIAL_CODES in config.ts; the rules here
 * cover the common "trim leading 0, prepend dial code" case. If a
 * country's national format differs (e.g. variable trunk prefixes),
 * extend this function.
 */
export function normalizePhoneE164(
  phone: string,
  countryCode: CountryCode = DEFAULT_COUNTRY,
): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+')) return cleaned;

  const dial = COUNTRY_DIAL_CODES[countryCode];
  const dialDigits = dial.replace('+', '');

  // Hungary uses "06" trunk prefix; UK "0"; most others "0". Strip a
  // leading 0 (or "06" for HU) before prepending the dial code.
  if (countryCode === 'HU' && cleaned.startsWith('06')) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  } else if (cleaned.startsWith(dialDigits)) {
    return `+${cleaned}`;
  }
  return `${dial}${cleaned}`;
}

export function normalizeUserData(
  input: Partial<UserData>,
  countryCode: CountryCode = DEFAULT_COUNTRY,
): UserData {
  const out: UserData = { country: countryCode };
  if (input.email) out.email = input.email.toLowerCase().trim();
  if (input.phone_number) out.phone_number = normalizePhoneE164(input.phone_number, countryCode);
  if (input.first_name) out.first_name = input.first_name.toLowerCase().trim();
  if (input.last_name) out.last_name = input.last_name.toLowerCase().trim();
  if (input.city) out.city = input.city.toLowerCase().trim();
  if (input.street) out.street = input.street.toLowerCase().trim();
  if (input.postal_code) out.postal_code = input.postal_code.toUpperCase().replace(/\s/g, '');
  return out;
}
