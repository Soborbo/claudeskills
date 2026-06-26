/**
 * Soborbo Tracking — Unified Entry Point (v5)
 *
 * Two channels, with a SHARED event_id (dedup):
 *   1) Browser: dataLayer push → GTM → GA4 / Google Ads / Meta Pixel (events.ts)
 *   2) Server: the event-gateway worker (/api/event/conversion) → Meta CAPI +
 *      GA4 MP + Google Ads uploadClickConversions (gateway.ts → sendToWorker)
 *
 * The earlier in-app /api/track (Meta-only) endpoint is GONE — the server side
 * belongs entirely to the gateway (all 3 platforms + durability). The gateway
 * itself adds the turnstile_token / attribution / consent / fbp / fbc / session_id
 * fields (see gateway.ts).
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
  trackEmailClick, trackWhatsappClick, setUserDataForEC,
  initScrollTracking, initFormAbandonTracking, enableDebug,
  generateEventId, pushLeadConversion, pushContactConversion,
  type ConversionData,
} from './events';
// Gateway dispatch (server side) — also available for direct use.
export { sendToWorker, getTurnstileToken, collectAttribution, type ConversionPayload, type UserData } from './gateway';

import { hasMarketingConsent, onConsentChange } from './consent';
import {
  persistTrackingParams, captureUrlParams,
  getGclid, getFbclid, getSessionId, getSourceType, getAttribution, getAllTrackingData,
  normalizePhone,
} from './persistence';
import {
  generateEventId, pushLeadConversion, pushContactConversion, enableDebug,
  trackPhoneClick, trackCallbackClick, trackEmailClick, trackWhatsappClick,
} from './events';
import { sendToWorker } from './gateway';
import { trackingConfig } from './config';

// ── Init ───────────────────────────────────────────────────────────

export function initTracking(): void {
  if (window.location.search.includes('debugTracking=1')) enableDebug();
  captureUrlParams();
  onConsentChange((c) => { if (c.marketing) persistTrackingParams(); });
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
  /** Override the gateway event name (default: contact_form_submit). */
  eventName?: string;
}

export interface LeadSubmitResult {
  success: boolean;
  consentBlocked: boolean;
  eventId: string;
  gclid: string | null;
  fbclid: string | null;
}

// Internal type → gateway event name (from the worker's ALLOWED_EVENT_NAMES).
const DEFAULT_GATEWAY_EVENT = 'contact_form_submit';

/**
 * Server-side dispatch to the gateway. Fire-and-forget: the gateway asynchronously
 * obtains the Turnstile token (cached 4 minutes) and adds the attribution/
 * consent/fbp/fbc/session_id fields. The browser dataLayer push goes SEPARATELY
 * (events.ts), with the SAME event_id → Meta Pixel↔CAPI dedup.
 */
function dispatchToGateway(
  eventName: string,
  eventId: string,
  params: { email?: string; phone?: string; firstName?: string; lastName?: string; value?: number; currency?: string },
): void {
  void sendToWorker({
    event_name: eventName,
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    ...(typeof params.value === 'number' ? { value: params.value } : {}),
    ...(params.currency ? { currency: params.currency } : {}),
    user_data: {
      email: params.email,
      phone_number: params.phone,
      first_name: params.firstName,
      last_name: params.lastName,
    },
  });
}

export function trackLeadSubmit(params: LeadSubmitParams): LeadSubmitResult {
  const gclid = getGclid(), fbclid = getFbclid(), eventId = generateEventId();
  if (!hasMarketingConsent()) return { success: false, consentBlocked: true, eventId, gclid, fbclid };

  const currency = params.currency || trackingConfig.currency;

  // 1) Browser (GTM) — unchanged
  pushLeadConversion({
    email: params.email, phone: params.phone,
    firstName: params.firstName, lastName: params.lastName,
    value: params.value, currency,
    gclid: gclid || undefined, eventId,
  });

  // 2) Server (gateway) — the SAME event_id
  dispatchToGateway(params.eventName || DEFAULT_GATEWAY_EVENT, eventId, {
    email: params.email, phone: params.phone,
    firstName: params.firstName, lastName: params.lastName,
    value: params.value, currency,
  });

  return { success: true, consentBlocked: false, eventId, gclid, fbclid };
}

export function trackContactSubmit(
  params: Pick<LeadSubmitParams, 'email' | 'phone' | 'eventName'>,
): LeadSubmitResult {
  const gclid = getGclid(), fbclid = getFbclid(), eventId = generateEventId();
  if (!hasMarketingConsent()) return { success: false, consentBlocked: true, eventId, gclid, fbclid };

  pushContactConversion({ email: params.email, phone: params.phone, eventId, gclid: gclid || undefined });
  dispatchToGateway(params.eventName || DEFAULT_GATEWAY_EVENT, eventId, {
    email: params.email, phone: params.phone,
  });
  return { success: true, consentBlocked: false, eventId, gclid, fbclid };
}

/**
 * Generic server-side event to the gateway (e.g. phone_conversion,
 * callback_conversion, quote_calculator_conversion). The browser dataLayer
 * push must be handled separately (events.ts) with the same event_id if dedup is needed.
 */
export function trackServerEvent(
  eventName: string,
  params: { eventId?: string; value?: number; currency?: string; email?: string; phone?: string } = {},
): string {
  const eventId = params.eventId || generateEventId();
  if (!hasMarketingConsent()) return eventId;
  dispatchToGateway(eventName, eventId, { value: params.value, currency: params.currency, email: params.email, phone: params.phone });
  return eventId;
}

// ── Click conversions (phone / callback / email / whatsapp) ─────────
//
// These are the #1 lead-gen signals. Each fires BOTH channels with ONE shared
// event_id (Meta Pixel↔CAPI dedup): the browser dataLayer push (events.ts,
// analytics-consent gated, phone keeps its session dedup) AND the server-side
// gateway dispatch (marketing-consent gated → Meta CAPI + Google Ads). The
// gateway dispatch only fires when the dataLayer push actually happened, so the
// phone session dedup covers both channels.

const CLICK_GATEWAY_EVENT = {
  phone: 'phone_conversion',
  callback: 'callback_conversion',
  email: 'email_conversion',
  whatsapp: 'whatsapp_conversion',
} as const;

function trackClickConversion(
  pushDataLayer: (eventId: string) => boolean,
  gatewayEvent: string,
  params: { email?: string; phone?: string } = {},
): string | null {
  const eventId = generateEventId();
  const pushed = pushDataLayer(eventId);
  if (!pushed) return null; // consent-blocked or deduped → skip the gateway too
  if (hasMarketingConsent()) dispatchToGateway(gatewayEvent, eventId, params);
  return eventId;
}

/** Phone click → dataLayer `phone_click` + gateway `phone_conversion` (shared event_id). */
export function trackPhoneConversion(params: { phone?: string } = {}): string | null {
  return trackClickConversion(trackPhoneClick, CLICK_GATEWAY_EVENT.phone, { phone: params.phone });
}

/** Callback click → dataLayer `callback_click` + gateway `callback_conversion`. */
export function trackCallbackConversion(params: { email?: string; phone?: string } = {}): string | null {
  return trackClickConversion(trackCallbackClick, CLICK_GATEWAY_EVENT.callback, params);
}

/** Email (mailto:) click → dataLayer `email_click` + gateway `email_conversion`. */
export function trackEmailConversion(params: { email?: string } = {}): string | null {
  return trackClickConversion(trackEmailClick, CLICK_GATEWAY_EVENT.email, { email: params.email });
}

/** WhatsApp click → dataLayer `whatsapp_click` + gateway `whatsapp_conversion`. */
export function trackWhatsappConversion(params: { phone?: string } = {}): string | null {
  return trackClickConversion(trackWhatsappClick, CLICK_GATEWAY_EVENT.whatsapp, { phone: params.phone });
}

// ── Hidden fields ──────────────────────────────────────────────────

export function populateHiddenFields(form: HTMLFormElement, result: LeadSubmitResult): void {
  // Last-touch UTM/click context for the hidden form fields. getAttribution()
  // returns first_/last_-prefixed keys (for the Sheets sink), NOT bare utm_*;
  // getAllTrackingData() is the right source for raw utm_source/medium/... here.
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

// ── Sheets payload (optional CRM/Sheets sink) ────────────────────

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
    value: data.value, currency: data.currency || trackingConfig.currency,
    ...getAttribution(),
  };
}

export function waitForTracking(ms = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
