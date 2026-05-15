/**
 * E2E harness entry. Wires the tracking kit into a stubbed page so
 * Playwright tests can drive consent / clicks / form flow and observe
 * dataLayer + Meta CAPI mirror behavior without a full app.
 *
 * Vite serves this file via tests/e2e/fixtures/index.html.
 */

import {
  initGlobalListeners,
  resetConversionState,
  resumeConversionTimer,
  restoreUserDataFromStorage,
  setUserDataOnDOM,
  trackFormFieldFocus,
  trackFormStart,
  trackFormStep,
  trackFormSubmitted,
} from '../../../src/lib/tracking';

declare global {
  interface Window {
    __harness: {
      setUserDataOnDOM: typeof setUserDataOnDOM;
      resetConversionState: typeof resetConversionState;
      trackFormStart: typeof trackFormStart;
      trackFormFieldFocus: typeof trackFormFieldFocus;
      trackFormStep: typeof trackFormStep;
      trackFormSubmitted: typeof trackFormSubmitted;
    };
    __piiLeaks: unknown[];
  }
}

restoreUserDataFromStorage();
resumeConversionTimer();
initGlobalListeners();

window.__harness = {
  setUserDataOnDOM,
  resetConversionState,
  trackFormStart,
  trackFormFieldFocus,
  trackFormStep,
  trackFormSubmitted,
};

const form = document.getElementById('quote-form');
if (form) {
  const formId = 'e2e-quote';
  window.__harness.trackFormStart(formId, 'Quote');

  document.getElementById('email-field')?.addEventListener('focus', () => {
    window.__harness.trackFormFieldFocus(formId, 'email');
  });
  document.getElementById('phone-field')?.addEventListener('focus', () => {
    window.__harness.trackFormFieldFocus(formId, 'phone');
  });
  document.getElementById('step-1')?.addEventListener('click', () => {
    window.__harness.trackFormStep(formId, 'contact', 1, 2);
  });
  document.getElementById('submit-btn')?.addEventListener('click', () => {
    const email = (document.getElementById('email-field') as HTMLInputElement | null)?.value || '';
    const phone = (document.getElementById('phone-field') as HTMLInputElement | null)?.value || '';
    if (email || phone) window.__harness.setUserDataOnDOM({ email, phone_number: phone });
    window.__harness.trackFormSubmitted(formId);
    window.__harness.resetConversionState({ value: 49.99, currency: 'EUR', service: 'demo' });
  });
}
