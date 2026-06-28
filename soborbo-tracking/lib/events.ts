/**
 * DataLayer Events
 *
 * Every event checks consent before pushing.
 * Analytics events need analytics consent.
 * Conversion events need marketing consent (checked in index.ts).
 */

import { hasAnalyticsConsent, hasMarketingConsent } from './consent';
import { getSessionId, getDevice, getAttribution, getPageUrl, normalizeEmail, normalizePhone, sanitizeName } from './persistence';
import { report, redactPii, enableDiagDebug } from './observability';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

// ── Debug mode ─────────────────────────────────────────────────────

let debugMode = false;

export function enableDebug(): void { debugMode = true; enableDiagDebug(); }

function push(data: Record<string, unknown>): void {
  // Defense in depth: PII must never reach the dataLayer (it goes to the hidden
  // side-channel). If a future change leaks a PII-shaped key, strip it AND report
  // it (TRK-3001) so the regression is visible instead of becoming a GDPR incident.
  const leaked = redactPii(data);
  if (leaked.length) report('PII_IN_DATALAYER', { event: data.event, keys: leaked });
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
  if (debugMode) console.log('[TRACK]', data);
}

// ── Event ID ───────────────────────────────────────────────────────

export function generateEventId(): string {
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
  return uuid;
}

// ── Calculator / Quiz ──────────────────────────────────────────────

export function trackCalculatorStart(name: string): void {
  if (!hasAnalyticsConsent()) return;
  push({ event: 'quote_calculator_opened', calculator_name: name, session_id: getSessionId(), device: getDevice() });
}

export function trackCalculatorStep(stepId: string, stepIndex: number, totalSteps?: number): void {
  if (!hasAnalyticsConsent()) return;
  push({ event: 'quote_calculator_step_completed', step_id: stepId, step_index: stepIndex,
    ...(totalSteps != null && { total_steps: totalSteps }), session_id: getSessionId() });
}

export function trackCalculatorOption(stepId: string, value: string | string[]): void {
  if (!hasAnalyticsConsent()) return;
  push({ event: 'quote_calculator_option_selected', step_id: stepId,
    option_value: Array.isArray(value) ? value.join(',') : value, session_id: getSessionId() });
}

export function trackCalculatorComplete(name: string): void {
  if (!hasAnalyticsConsent()) return;
  // Canonical: the calculator completion IS the quote conversion (quote_calculator_submitted).
  // NOTE: the conversion-grade emission (event_id + value + PII side-channel + gateway) comes
  // from trackLeadSubmit/trackServerEvent; this milestone shares the canonical name. Wire ONE
  // of them as the actual quote conversion per site.
  push({ event: 'quote_calculator_submitted', calculator_name: name, session_id: getSessionId(), device: getDevice() });
}

// ── Conversions (PII) ──────────────────────────────────────────────

export interface ConversionData {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  value?: number;
  currency?: string;
  gclid?: string;
  eventId?: string;
}

/**
 * Hidden side-channel for Google Ads Enhanced Conversions user-provided data.
 *
 * Raw PII (email/phone/name) must NOT go into the dataLayer — that's a GDPR /
 * security red flag (anything in the dataLayer is readable by every other GTM
 * tag and any script on the page). Instead we write the normalized user data to
 *   1) a window-scoped object (`window.__sbUserData`), and
 *   2) a hidden DOM element (`#__sb_user_data__`),
 * and GTM's "User-Provided Data" variable is a Custom JS variable that reads
 * from there (see docs/gtm-setup.md). The server (gateway) path is unaffected —
 * PII goes in the POST body and is hashed server-side.
 *
 * Gated on marketing consent: nothing is written without it.
 */
export const USER_DATA_ELEMENT_ID = '__sb_user_data__';

declare global {
  interface Window {
    __sbUserData?: Record<string, string>;
  }
}

/** How long the EC PII stays readable before the auto-clear sweeps it (ms).
 *  Long enough for GTM to read it when its tags fire, short enough to limit the
 *  window where any other script could read it. */
const EC_CLEAR_DELAY_MS = 5_000;
let ecClearTimer: ReturnType<typeof setTimeout> | null = null;

/** Wipe the Enhanced-Conversions side-channel (window object + hidden element). */
export function clearUserDataForEC(): void {
  if (typeof window === 'undefined') return;
  try { delete window.__sbUserData; } catch { /* */ }
  try { document.getElementById(USER_DATA_ELEMENT_ID)?.remove(); } catch { /* */ }
}

export function setUserDataForEC(ud: Record<string, string>): void {
  if (!hasMarketingConsent()) return;
  if (typeof window === 'undefined') return;
  window.__sbUserData = ud;
  try {
    let el = document.getElementById(USER_DATA_ELEMENT_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = USER_DATA_ELEMENT_ID;
      el.hidden = true;
      (document.body || document.documentElement).appendChild(el);
    }
    el.textContent = JSON.stringify(ud);
  } catch { /* DOM unavailable — the window-scoped object is enough */ }
  // Defense in depth: don't leave PII readable for the whole page lifetime.
  // GTM reads it synchronously when its conversion tags fire (right after the
  // dataLayer push), so a few seconds is ample. Re-arm on each write.
  if (ecClearTimer) clearTimeout(ecClearTimer);
  ecClearTimer = setTimeout(() => { clearUserDataForEC(); ecClearTimer = null; }, EC_CLEAR_DELAY_MS);
}

function buildConversionPayload(data: ConversionData): Record<string, unknown> {
  const ud: Record<string, string> = { email: normalizeEmail(data.email) };
  if (data.phone && data.phone.length >= 8) ud.phone_number = normalizePhone(data.phone);
  if (data.firstName) ud.first_name = sanitizeName(data.firstName);
  if (data.lastName) ud.last_name = sanitizeName(data.lastName);

  // PII → hidden side-channel for Enhanced Conversions (NOT the dataLayer).
  setUserDataForEC(ud);

  // dataLayer payload is PII-free: event_id + value + currency + attribution.
  return {
    event_id: data.eventId,
    session_id: getSessionId(),
    device: getDevice(),
    page_url: getPageUrl(),
    ...getAttribution(),
    ...(data.value != null && data.value > 0 && { value: data.value }),
    ...(data.currency && { currency: data.currency }),
    ...(data.gclid && { gclid: data.gclid }),
  };
}

// §2.1: the lead/quote form = quote_calculator_submitted (Meta Lead — the calculator
// is the ajánlatkérő). The old lead_submit→contact_form_submit (Contact) duality is gone.
export function pushLeadConversion(data: ConversionData): void {
  push({ event: 'quote_calculator_submitted', ...buildConversionPayload(data) });
}

export function pushContactConversion(data: ConversionData): void {
  push({ event: 'contact_form_submitted', ...buildConversionPayload(data) });
}

// ── Clicks — durable session dedup ─────────────────────────────────

const memoryClickSet = new Set<string>();

// Exported so the conversion layer (index.ts) can apply the SAME session dedup
// across BOTH channels (dataLayer + gateway) — see trackPhoneConversion. The
// memory set always works; sessionStorage is added under analytics consent so
// dedup survives reloads, and still degrades gracefully (memory-only) when
// analytics consent is absent but marketing consent is present.
export function hasClickFired(name: string): boolean {
  const k = `sb_click_${name}_${getSessionId()}`;
  if (memoryClickSet.has(k)) return true;
  if (hasAnalyticsConsent()) {
    try { return sessionStorage.getItem(k) === '1'; } catch { /* */ }
  }
  return false;
}
export function markClickFired(name: string): void {
  const k = `sb_click_${name}_${getSessionId()}`;
  memoryClickSet.add(k);
  if (hasAnalyticsConsent()) {
    try { sessionStorage.setItem(k, '1'); } catch { /* */ }
  }
}

/**
 * Click trackers push to the dataLayer (browser channel). They accept an optional
 * `eventId` so the caller (index.ts) can use the SAME id for the gateway dispatch
 * → Meta Pixel↔CAPI dedup. They return `true` when an event was actually pushed
 * (false = blocked by consent or session dedup), so the caller knows whether to
 * also dispatch server-side.
 */
export function trackPhoneClick(eventId?: string, dedup = true): boolean {
  if (!hasAnalyticsConsent()) return false;
  // `dedup=false` is passed by the conversion layer (index.ts), which owns the
  // session dedup so it can cover BOTH channels even when analytics consent is off.
  if (dedup) {
    if (hasClickFired('phone')) return false;
    markClickFired('phone');
  }
  push({ event: 'phone_number_clicked', ...(eventId && { event_id: eventId }), session_id: getSessionId(), device: getDevice() });
  return true;
}

export function trackCallbackClick(eventId?: string): boolean {
  if (!hasAnalyticsConsent()) return false;
  push({ event: 'callback_request_submitted', ...(eventId && { event_id: eventId }), session_id: getSessionId(), device: getDevice() });
  return true;
}

export function trackEmailClick(eventId?: string): boolean {
  if (!hasAnalyticsConsent()) return false;
  push({ event: 'email_address_clicked', ...(eventId && { event_id: eventId }), session_id: getSessionId(), device: getDevice() });
  return true;
}

export function trackWhatsappClick(eventId?: string): boolean {
  if (!hasAnalyticsConsent()) return false;
  push({ event: 'whatsapp_button_clicked', ...(eventId && { event_id: eventId }), session_id: getSessionId(), device: getDevice() });
  return true;
}

// ── Form abandonment — returns cleanup function ────────────────────

export function initFormAbandonTracking(
  form: HTMLFormElement, formId = 'quote', timeoutMs = 60_000,
): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastField = '';
  let started = false;

  const onFocus = (e: FocusEvent) => {
    if (!hasAnalyticsConsent()) return;
    const name = (e.target as HTMLElement).getAttribute('name');
    if (!name) return;
    lastField = name;
    if (!started) {
      started = true;
      timer = setTimeout(() => {
        push({ event: 'form_abandoned', form_id: formId, last_field: lastField, session_id: getSessionId() });
      }, timeoutMs);
    }
  };

  const onSubmit = () => {
    if (timer) { clearTimeout(timer); timer = null; }
    started = false;
  };

  form.addEventListener('focusin', onFocus);
  form.addEventListener('submit', onSubmit);

  // Cleanup function — call on route change or unmount
  return () => {
    if (timer) { clearTimeout(timer); timer = null; }
    form.removeEventListener('focusin', onFocus);
    form.removeEventListener('submit', onSubmit);
  };
}

// ── Scroll depth — with cleanup ────────────────────────────────────

let scrollCleanup: (() => void) | null = null;

export function initScrollTracking(): void {
  // Remove previous handler
  if (scrollCleanup) { scrollCleanup(); scrollCleanup = null; }

  const fired = new Set<number>();
  const thresholds = [25, 50, 75, 100];

  const handler = () => {
    if (!hasAnalyticsConsent()) return;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (h <= 0) return;
    const pct = Math.round((window.scrollY / h) * 100);
    for (const t of thresholds) {
      if (pct >= t && !fired.has(t)) {
        fired.add(t);
        push({ event: 'scroll_depth', scroll_percentage: t });
      }
    }
  };

  window.addEventListener('scroll', handler, { passive: true });
  scrollCleanup = () => window.removeEventListener('scroll', handler);
}
