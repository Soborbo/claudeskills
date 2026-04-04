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

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ── CALCULATOR ──

export function trackCalculatorStart(calculatorId: string): void {
  if (!hasAnalyticsConsent()) return;
  push({ event: 'calculator_start', calculator_id: calculatorId });
}

// ── CONVERSIONS ──

/** SHA-256 hash for PII before pushing to dataLayer */
async function hashPii(value: string): Promise<string> {
  if (!value) return '';
  const data = new TextEncoder().encode(value.toLowerCase().trim());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function pushLeadConversion(data: {
  email: string;
  phone?: string;
  eventId: string;
  formId: string;
  value?: number;
}): Promise<void> {
  if (!hasMarketingConsent()) return;
  push({
    event: 'generate_lead',
    event_id: data.eventId,
    form_id: data.formId,
    currency: 'GBP',
    value: data.value || 0,
    user_data: {
      sha256_email: await hashPii(data.email),
      sha256_phone: data.phone ? await hashPii(data.phone) : '',
    },
  });
}

export async function pushContactConversion(data: {
  email: string;
  phone?: string;
  eventId: string;
  formId: string;
}): Promise<void> {
  if (!hasMarketingConsent()) return;
  push({
    event: 'contact',
    event_id: data.eventId,
    form_id: data.formId,
    user_data: {
      sha256_email: await hashPii(data.email),
      sha256_phone: data.phone ? await hashPii(data.phone) : '',
    },
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
