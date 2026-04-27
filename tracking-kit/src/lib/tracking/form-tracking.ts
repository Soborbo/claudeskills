/**
 * Form tracking: form_start, form_step_complete, form_abandonment.
 *
 * Abandonment is best-effort. We listen on `pagehide` and
 * `visibilitychange` (the latter for mobile background-tab cases) and
 * fire a `navigator.sendBeacon` to a dedicated endpoint that forwards
 * to GA4 Measurement Protocol server-side. We also push a regular
 * `form_abandonment` to dataLayer for any in-tab GTM consumers — but
 * dataLayer pushes during `pagehide` are not reliably flushed on
 * mobile, which is why the beacon exists.
 *
 * Cleanup: this module assumes a hard-navigation MPA (see notes in
 * global-listeners.ts).
 */

import { ABANDONMENT_BEACON_URL, ABANDONMENT_MIN_DWELL_MS } from './config';
import { trackEvent } from './tracking';

interface FormState {
  formName: string;
  startedAt: number;
  lastStep?: string;
  lastField?: string;
  submitted: boolean;
}

const activeForms = new Map<string, FormState>();
let listenersInstalled = false;

export function trackFormStart(formId: string, formName: string): void {
  if (activeForms.has(formId)) return;
  activeForms.set(formId, { formName, startedAt: Date.now(), submitted: false });
  installAbandonmentListeners();
  trackEvent('form_start', {
    form_name: formName,
    page_path: location.pathname,
    page_title: document.title,
  });
}

export function trackFormFieldFocus(formId: string, fieldName: string): void {
  const state = activeForms.get(formId);
  if (!state) return;
  state.lastField = fieldName;
}

export function trackFormStep(
  formId: string,
  stepName: string,
  stepNumber: number,
  totalSteps: number,
): void {
  const state = activeForms.get(formId);
  if (state) state.lastStep = stepName;
  trackEvent('form_step_complete', {
    form_name: state?.formName,
    step_name: stepName,
    step_number: stepNumber,
    total_steps: totalSteps,
    page_path: location.pathname,
  });
}

export function trackFormSubmitted(formId: string): void {
  const state = activeForms.get(formId);
  if (state) state.submitted = true;
}

function reportAbandonment(state: FormState): void {
  if (Date.now() - state.startedAt < ABANDONMENT_MIN_DWELL_MS) return;

  const payload = {
    form_name: state.formName,
    last_step: state.lastStep || 'unknown',
    last_field: state.lastField || 'unknown',
    time_spent_seconds: Math.round((Date.now() - state.startedAt) / 1000),
    exit_page_path: location.pathname,
    exit_page_title: document.title,
    exit_page_url: location.href,
  };

  if (typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(ABANDONMENT_BEACON_URL, blob);
    } catch {
      // ignore — the dataLayer push below is the secondary path
    }
  }
  trackEvent('form_abandonment', payload);
}

function flushAbandonments(): void {
  activeForms.forEach((state) => {
    if (!state.submitted) reportAbandonment(state);
  });
  activeForms.clear();
}

function installAbandonmentListeners(): void {
  if (listenersInstalled || typeof window === 'undefined') return;
  listenersInstalled = true;

  window.addEventListener('pagehide', flushAbandonments);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushAbandonments();
  });
}
