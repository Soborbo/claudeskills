/**
 * Soborbo Tracking — Unified Entry Point
 */

export { hasMarketingConsent, hasAnalyticsConsent, hasAnyConsent, onConsentChange, waitForConsent, type ConsentCategory } from './consent';
export {
  persistTrackingParams, captureUrlParams, getGclid, getFbclid, getFbp, getFbc,
  getAllTrackingData, getStoredData, getAttribution, getSourceType,
  getSessionId, getDevice, getPageUrl, clearTrackingData,
  normalizeEmail, normalizePhone, sanitizeName,
  type TrackingData, type AttributionData,
} from './persistence';
export {
  trackCalculatorStart, trackCalculatorStep, trackCalculatorOption,
  trackCalculatorComplete, trackPhoneClick, trackCallbackClick,
  initScrollTracking, initFormAbandonTracking, enableDebug,
  generateEventId, pushLeadConversion, pushContactConversion,
  type ConversionData,
} from './events';

import { hasMarketingConsent, onConsentChange } from './consent';
import {
  persistTrackingParams, captureUrlParams,
  getGclid, getFbclid, getFbp, getFbc,
  getAllTrackingData, getAttribution, getSourceType, getSessionId, getPageUrl,
  normalizePhone,
} from './persistence';
import { generateEventId, pushLeadConversion, pushContactConversion, enableDebug } from './events';

// ── Init ───────────────────────────────────────────────────────────

export function initTracking(): void {
  // Debug mode: add ?debugTracking=1 to URL
  if (window.location.search.includes('debugTracking=1')) enableDebug();

  // Capture URL params into memory immediately (no storage)
  captureUrlParams();

  // When consent arrives → persist to localStorage
  onConsentChange((c) => { if (c.marketing) persistTrackingParams(); });

  // Already consented → persist now
  if (hasMarketingConsent()) persistTrackingParams();
}

// ── Conversion ─────────────────────────────────────────────────────

export interface LeadSubmitParams {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  value?: number;
  currency?: string;
  contentName?: string;
}

export interface LeadSubmitResult {
  success: boolean;
  consentBlocked: boolean;
  eventId: string;
  gclid: string | null;
  fbclid: string | null;
}

function buildBeaconPayload(
  type: 'lead' | 'contact',
  params: LeadSubmitParams | Pick<LeadSubmitParams, 'email' | 'phone'>,
  eventId: string,
): Record<string, unknown> {
  return {
    type,
    email: params.email,
    phone: params.phone ? normalizePhone(params.phone) : undefined,
    ...('firstName' in params && { firstName: params.firstName }),
    ...('lastName' in params && { lastName: params.lastName }),
    ...('value' in params && { value: params.value }),
    ...('currency' in params && { currency: (params as LeadSubmitParams).currency || 'GBP' }),
    ...('contentName' in params && { contentName: (params as LeadSubmitParams).contentName }),
    eventId,
    sessionId: getSessionId(),
    sourceType: getSourceType(),
    pageUrl: getPageUrl(),
    gclid: getGclid(), fbclid: getFbclid(),
    fbp: getFbp(), fbc: getFbc(),
    ...getAttribution(),
    ...getAllTrackingData(),
  };
}

export function trackLeadSubmit(params: LeadSubmitParams): LeadSubmitResult {
  const gclid = getGclid(), fbclid = getFbclid(), eventId = generateEventId();
  if (!hasMarketingConsent()) return { success: false, consentBlocked: true, eventId, gclid, fbclid };

  pushLeadConversion({
    email: params.email, phone: params.phone,
    firstName: params.firstName, lastName: params.lastName,
    value: params.value, currency: params.currency || 'GBP',
    gclid: gclid || undefined, eventId,
  });

  sendBeacon(buildBeaconPayload('lead', params, eventId));
  return { success: true, consentBlocked: false, eventId, gclid, fbclid };
}

export function trackContactSubmit(
  params: Pick<LeadSubmitParams, 'email' | 'phone'>,
): LeadSubmitResult {
  const gclid = getGclid(), fbclid = getFbclid(), eventId = generateEventId();
  if (!hasMarketingConsent()) return { success: false, consentBlocked: true, eventId, gclid, fbclid };

  pushContactConversion({ email: params.email, phone: params.phone, eventId, gclid: gclid || undefined });
  sendBeacon(buildBeaconPayload('contact', params, eventId));
  return { success: true, consentBlocked: false, eventId, gclid, fbclid };
}

// ── Hidden fields ──────────────────────────────────────────────────

export function populateHiddenFields(form: HTMLFormElement, result: LeadSubmitResult): void {
  const t = getAllTrackingData();
  const fields: Record<string, string | null | undefined> = {
    gclid: result.gclid, fbclid: result.fbclid, event_id: result.eventId,
    utm_source: t.utm_source, utm_medium: t.utm_medium,
    utm_campaign: t.utm_campaign, utm_content: t.utm_content, utm_term: t.utm_term,
  };
  for (const [name, value] of Object.entries(fields)) {
    let input = form.querySelector<HTMLInputElement>(`input[name="${name}"]`);
    if (!input) { input = document.createElement('input'); input.type = 'hidden'; input.name = name; form.appendChild(input); }
    input.value = value || '';
  }
}

// ── Sheets payload ─────────────────────────────────────────────────

export function buildSheetsPayload(data: {
  eventType: string; name?: string; email: string; phone?: string;
  value?: number; currency?: string; eventId: string;
}): Record<string, unknown> {
  return {
    lead_id: data.eventId, event_type: data.eventType,
    submitted_at: new Date().toISOString(),
    session_id: getSessionId(), source_type: getSourceType(),
    name: data.name, email: data.email,
    phone: data.phone ? normalizePhone(data.phone) : undefined,
    value: data.value, currency: data.currency || 'GBP',
    ...getAttribution(),
  };
}

// ── Beacon — best-effort ───────────────────────────────────────────

function sendBeacon(data: Record<string, unknown>): void {
  const endpoint = '/api/track';
  try {
    const payload = JSON.stringify({
      ...data,
      timestamp: new Date().toISOString(),
      url: getPageUrl(),
      userAgent: navigator.userAgent,
    });
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      if (!navigator.sendBeacon(endpoint, blob)) {
        fetch(endpoint, { method: 'POST', body: payload, keepalive: true,
          headers: { 'Content-Type': 'application/json' } }).catch(() => {});
      }
    } else {
      fetch(endpoint, { method: 'POST', body: payload, keepalive: true,
        headers: { 'Content-Type': 'application/json' } }).catch(() => {});
    }
  } catch { /* best-effort */ }
}

export function waitForTracking(ms = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
