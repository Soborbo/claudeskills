/**
 * Soborbo Tracking — Unified Entry Point (v5)
 *
 * Két csatorna, MEGOSZTOTT event_id-vel (dedup):
 *   1) Böngésző: dataLayer push → GTM → GA4 / Google Ads / Meta Pixel (events.ts)
 *   2) Szerver: az event-gateway worker (/api/event/conversion) → Meta CAPI +
 *      GA4 MP + Google Ads uploadClickConversions (gateway.ts → sendToWorker)
 *
 * A korábbi in-app /api/track (Meta-only) endpoint MEGSZŰNT — a szerver-oldal
 * teljesen a gateway-é (mind a 3 platform + durability). A gateway maga teszi
 * hozzá a turnstile_token / attribution / consent / fbp / fbc / session_id
 * mezőket (lásd gateway.ts).
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
// Gateway-dispatch (szerver-oldal) — közvetlen használathoz is elérhető.
export { sendToWorker, getTurnstileToken, collectAttribution, type ConversionPayload, type UserData } from './gateway';

import { hasMarketingConsent, onConsentChange } from './consent';
import {
  persistTrackingParams, captureUrlParams,
  getGclid, getFbclid, getSessionId, getSourceType, getAttribution,
  normalizePhone,
} from './persistence';
import { generateEventId, pushLeadConversion, pushContactConversion, enableDebug } from './events';
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
  /** Gateway event-név felülírása (default: contact_form_submit). */
  eventName?: string;
}

export interface LeadSubmitResult {
  success: boolean;
  consentBlocked: boolean;
  eventId: string;
  gclid: string | null;
  fbclid: string | null;
}

// Belső típus → gateway event-név (a worker ALLOWED_EVENT_NAMES-éből).
const DEFAULT_GATEWAY_EVENT = 'contact_form_submit';

/**
 * Szerver-oldali dispatch a gateway-re. Fire-and-forget: a gateway aszinkron
 * megszerzi a Turnstile-tokent (cache 4 perc) és hozzárakja az attribution/
 * consent/fbp/fbc/session_id mezőket. A böngésző dataLayer push KÜLÖN megy
 * (events.ts), UGYANAZZAL az event_id-vel → Meta Pixel↔CAPI dedup.
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

  // 1) Böngésző (GTM) — változatlan
  pushLeadConversion({
    email: params.email, phone: params.phone,
    firstName: params.firstName, lastName: params.lastName,
    value: params.value, currency,
    gclid: gclid || undefined, eventId,
  });

  // 2) Szerver (gateway) — UGYANAZ az event_id
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
 * Általános szerver-oldali esemény a gateway-re (pl. phone_conversion,
 * callback_conversion, quote_calculator_conversion). A böngésző dataLayer
 * push-t külön kell intézni (events.ts) az azonos event_id-vel, ha kell dedup.
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

// ── Hidden fields ──────────────────────────────────────────────────

export function populateHiddenFields(form: HTMLFormElement, result: LeadSubmitResult): void {
  const t = getAttribution();
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

// ── Sheets payload (opcionális CRM/Sheets sink) ────────────────────

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
