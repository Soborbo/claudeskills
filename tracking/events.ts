/**
 * DataLayer Events
 *
 * Every event checks consent before pushing.
 * Analytics events need analytics consent.
 * Conversion events need marketing consent (checked in index.ts).
 */

import { hasAnalyticsConsent } from './consent';
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

function buildConversionPayload(data: ConversionData): Record<string, unknown> {
  const ud: Record<string, string> = { email: normalizeEmail(data.email) };
  if (data.phone && data.phone.length >= 8) ud.phone_number = normalizePhone(data.phone);
  if (data.firstName) ud.first_name = sanitizeName(data.firstName);
  if (data.lastName) ud.last_name = sanitizeName(data.lastName);

  return {
    user_provided_data: ud,
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

export function trackPhoneClick(): void {
  if (!hasAnalyticsConsent()) return;
  if (hasClickFired('phone')) return;
  markClickFired('phone');
  push({ event: 'phone_click', session_id: getSessionId(), device: getDevice() });
}

export function trackCallbackClick(): void {
  if (!hasAnalyticsConsent()) return;
  push({ event: 'callback_click', session_id: getSessionId(), device: getDevice() });
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
