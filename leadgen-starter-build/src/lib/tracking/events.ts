/**
 * DataLayer event helpers
 * All events push to window.dataLayer for GTM processing
 */

import { hasAnalyticsConsent, hasMarketingConsent } from './consent';

function push(event: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

// ── CALCULATOR ──

export function trackCalculatorStart(calculatorId: string): void {
  if (!hasAnalyticsConsent()) return;
  push({ event: 'calculator_start', calculator_id: calculatorId });
}

// ── CONVERSIONS ──
//
// The dataLayer carries EVENT METADATA ONLY — never PII, not even hashed
// (CLAUDE.md §15). Advanced Matching happens on the SERVER leg: the API route
// forwards name/email/phone to the CRM signed webhook, and the CRM hashes and
// dispatches to the gateway using the SAME event_id these events carry, so the
// browser Pixel event and the server CAPI event deduplicate.

export function pushLeadConversion(data: {
  eventId: string;
  formId: string;
  value?: number;
  currency?: string;
}): void {
  if (!hasMarketingConsent()) return;
  const event: Record<string, unknown> = {
    event: 'generate_lead',
    event_id: data.eventId,
    form_id: data.formId,
  };
  // CLAUDE.md §3: omit `value` entirely when there is none, and `currency` is
  // mandatory whenever `value` is present. NEVER push value:0 — Meta logs it as
  // a real amount and skews ROAS. Currency comes from the caller (site config),
  // never hardcoded, so a non-GBP site is not silently mislabelled.
  if (typeof data.value === 'number' && data.value > 0 && data.currency) {
    event.value = data.value;
    event.currency = data.currency;
  }
  push(event);
}

export function pushContactConversion(data: {
  eventId: string;
  formId: string;
}): void {
  if (!hasMarketingConsent()) return;
  push({
    event: 'contact',
    event_id: data.eventId,
    form_id: data.formId,
  });
}

// ── CLICKS ──

const clickedIds = new Set<string>();

export function trackPhoneClick(phoneNumber: string): void {
  if (!hasAnalyticsConsent()) return;
  const dedup = `phone-${phoneNumber}`;
  if (clickedIds.has(dedup)) return;
  clickedIds.add(dedup);
  push({ event: 'phone_click', click_url: `tel:${phoneNumber}` });
}

export function trackCallbackClick(url: string): void {
  if (!hasAnalyticsConsent()) return;
  const dedup = `callback-${url}`;
  if (clickedIds.has(dedup)) return;
  clickedIds.add(dedup);
  push({ event: 'callback_click', click_url: url });
}

// ── FORM ABANDONMENT ──

export function initFormAbandonTracking(formEl: HTMLFormElement): () => void {
  if (!hasAnalyticsConsent()) return () => {};

  let interacted = false;
  let submitted = false;

  const interactHandler = () => { interacted = true; };
  const submitHandler = () => { submitted = true; };

  formEl.addEventListener('input', interactHandler, { once: true });
  formEl.addEventListener('submit', submitHandler);

  const beforeUnload = () => {
    if (interacted && !submitted) {
      const filledFields = Array.from(formEl.elements)
        .filter((el): el is HTMLInputElement => el instanceof HTMLInputElement && el.value.length > 0 && el.type !== 'hidden')
        .map(el => el.name);

      push({
        event: 'form_abandon',
        form_id: formEl.dataset.formId || 'unknown',
        fields_filled: filledFields,
        fields_count: filledFields.length,
      });
    }
  };

  window.addEventListener('beforeunload', beforeUnload);

  return () => {
    formEl.removeEventListener('input', interactHandler);
    formEl.removeEventListener('submit', submitHandler);
    window.removeEventListener('beforeunload', beforeUnload);
  };
}

// ── SCROLL DEPTH ──

export function initScrollTracking(): () => void {
  if (!hasAnalyticsConsent()) return () => {};

  const thresholds = [25, 50, 75, 100];
  const reached = new Set<number>();

  const handler = () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const percent = Math.round((window.scrollY / docHeight) * 100);

    for (const t of thresholds) {
      if (percent >= t && !reached.has(t)) {
        reached.add(t);
        push({ event: 'scroll_depth', depth: t });
      }
    }
  };

  window.addEventListener('scroll', handler, { passive: true });
  return () => window.removeEventListener('scroll', handler);
}
