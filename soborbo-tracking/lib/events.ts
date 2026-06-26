/**
 * DataLayer Events
 *
 * Every event checks consent before pushing.
 * Analytics events need analytics consent.
 * Conversion events need marketing consent (checked in index.ts).
 */

import { hasAnalyticsConsent, hasMarketingConsent } from './consent';
import { getSessionId, getDevice, getAttribution, getPageUrl, normalizeEmail, normalizePhone, sanitizeName } from './persistence';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

// ── Debug mode ─────────────────────────────────────────────────────

let debugMode = false;

export function enableDebug(): void { debugMode = true; }

function push(data: Record<string, unknown>): void {
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
  push({ event: 'calculator_start', calculator_name: name, session_id: getSessionId(), device: getDevice() });
}

export function trackCalculatorStep(stepId: string, stepIndex: number, totalSteps?: number): void {
  if (!hasAnalyticsConsent()) return;
  push({ event: 'calculator_step', step_id: stepId, step_index: stepIndex,
    ...(totalSteps != null && { total_steps: totalSteps }), session_id: getSessionId() });
}

export function trackCalculatorOption(stepId: string, value: string | string[]): void {
  if (!hasAnalyticsConsent()) return;
  push({ event: 'calculator_option', step_id: stepId,
    option_value: Array.isArray(value) ? value.join(',') : value, session_id: getSessionId() });
}

export function trackCalculatorComplete(name: string): void {
  if (!hasAnalyticsConsent()) return;
  push({ event: 'calculator_complete', calculator_name: name, session_id: getSessionId(), device: getDevice() });
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

export function pushLeadConversion(data: ConversionData): void {
  push({ event: 'lead_submit', ...buildConversionPayload(data) });
}

export function pushContactConversion(data: ConversionData): void {
  push({ event: 'contact_submit', ...buildConversionPayload(data) });
}

// ── Clicks — durable session dedup ─────────────────────────────────

const memoryClickSet = new Set<string>();

function hasClickFired(name: string): boolean {
  const k = `sb_click_${name}_${getSessionId()}`;
  if (memoryClickSet.has(k)) return true;
  if (hasAnalyticsConsent()) {
    try { return sessionStorage.getItem(k) === '1'; } catch { /* */ }
  }
  return false;
}
function markClickFired(name: string): void {
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
export function trackPhoneClick(eventId?: string): boolean {
  if (!hasAnalyticsConsent()) return false;
  if (hasClickFired('phone')) return false;   // session dedup — phone only
  markClickFired('phone');
  push({ event: 'phone_click', ...(eventId && { event_id: eventId }), session_id: getSessionId(), device: getDevice() });
  return true;
}

export function trackCallbackClick(eventId?: string): boolean {
  if (!hasAnalyticsConsent()) return false;
  push({ event: 'callback_click', ...(eventId && { event_id: eventId }), session_id: getSessionId(), device: getDevice() });
  return true;
}

export function trackEmailClick(eventId?: string): boolean {
  if (!hasAnalyticsConsent()) return false;
  push({ event: 'email_click', ...(eventId && { event_id: eventId }), session_id: getSessionId(), device: getDevice() });
  return true;
}

export function trackWhatsappClick(eventId?: string): boolean {
  if (!hasAnalyticsConsent()) return false;
  push({ event: 'whatsapp_click', ...(eventId && { event_id: eventId }), session_id: getSessionId(), device: getDevice() });
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
        push({ event: 'form_abandon', form_id: formId, last_field: lastField, session_id: getSessionId() });
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
