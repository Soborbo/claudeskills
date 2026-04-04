/**
 * Unified tracking entry point
 * Re-exports consent and events modules
 */

export { hasMarketingConsent, hasAnalyticsConsent, onConsentChange, waitForConsent } from './consent';
export { pushLeadConversion, pushContactConversion, trackCalculatorStart, trackPhoneClick, trackCallbackClick, initFormAbandonTracking, initScrollTracking } from './events';
export { initAttribution, getFirstTouch, getLastTouch } from './persistence';

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

/** Generate unique event ID for dedup between client-side and server-side */
export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Initialize tracking — call on page load */
export function initTracking(): void {
  window.dataLayer = window.dataLayer || [];
}

/** Populate hidden form fields with tracking data */
export function populateHiddenFields(form: HTMLFormElement): void {
  const eventId = generateEventId();
  const setField = (name: string, value: string) => {
    const input = form.querySelector<HTMLInputElement>(`[name="${name}"]`);
    if (input) input.value = value;
  };

  setField('event_id', eventId);
  setField('source_page', window.location.pathname);

  const params = new URLSearchParams(window.location.search);
  setField('utm_source', params.get('utm_source') || '');
  setField('utm_medium', params.get('utm_medium') || '');
  setField('utm_campaign', params.get('utm_campaign') || '');
}

/** Build payload for Google Sheets */
export function buildSheetsPayload(form: HTMLFormElement): Record<string, string> {
  const data = new FormData(form);
  const payload: Record<string, string> = {};

  for (const [key, value] of data.entries()) {
    if (key !== 'website' && key !== 'cf-turnstile-response') {
      payload[key] = String(value);
    }
  }

  payload.timestamp = new Date().toISOString();
  payload.page = window.location.pathname;
  payload.referrer = document.referrer || '';

  return payload;
}

/** Send beacon to tracking endpoint */
export function sendBeacon(endpoint: string, data: Record<string, unknown>): void {
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, JSON.stringify(data));
  } else {
    fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {});
  }
}
