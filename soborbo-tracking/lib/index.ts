/**
 * Soborbo Tracking — Unified Entry Point (v6, Run 6 contract)
 *
 * Two channels, with a SHARED event_id (dedup):
 *   1) Browser: dataLayer push → GTM → GA4 / Google Ads / Meta Pixel (events.ts)
 *   2) Server: the event-gateway worker → Meta CAPI (+ TikTok/LinkedIn/MsAds
 *      click-ID forwarders) on-site. Model 2: on-site GA4 + Google Ads are
 *      browser-only; the server does Google Ads ONLY offline (CRM lead-status,
 *      Data Manager API) and sends NO GA4 at all.
 *
 * WHO SENDS THE SERVER LEG — the load-bearing split (lib/event-contract.ts):
 *   - LOW-RISK CLICKS (phone/email/whatsapp/video) → this lib POSTs them to the
 *     tokenless browser ingress (`/api/event/conversion`), fire-and-forget.
 *   - HIGH-VALUE CONVERSIONS (quote/callback/contact form, order, purchase) are
 *     `server_ingress_only`: the gateway 403s them on the browser path
 *     (TRK-400-017). This lib pushes ONLY their dataLayer leg; the SITE BACKEND
 *     dispatches the gateway leg via `/api/event/conversion-server` (per-site
 *     token, service binding) REUSING the browser event_id from the hidden form
 *     field — so Meta Pixel↔CAPI dedup is unchanged. See
 *     server/backend/gateway-dispatch.ts and INSTALL.md Step 3.
 *
 * There is NO Turnstile in the tracking path (the gateway does not validate it;
 * a client-side token gate once silently dropped two weeks of click conversions).
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
  trackEmailClick, trackWhatsappClick, setUserDataForEC, clearUserDataForEC,
  initScrollTracking, initFormAbandonTracking, enableDebug,
  generateEventId, pushLeadConversion, pushContactConversion,
  type ConversionData,
} from './events';
// Browser-path gateway dispatch — also available for direct use (guarded).
export { sendToWorker, collectAttribution, type ConversionPayload, type UserData } from './gateway';
// Ingress contract — which events may use the browser path at all.
export { BROWSER_GATEWAY_EVENTS, SERVER_INGRESS_ONLY_EVENTS, OFFLINE_EVENTS } from './event-contract';
// Observability — stable diagnostic codes (see docs/OBSERVABILITY-CODES.md).
export {
  report, getDiagnostics, clearDiagnostics, enableDiagDebug, redactPii,
  TRACKING_CODES, type TrackingDiagnostic, type TrackingCode, type TrackingCodeKey,
} from './observability';

import { hasMarketingConsent, hasAnalyticsConsent, onConsentChange } from './consent';
import {
  persistTrackingParams, captureUrlParams,
  getGclid, getFbclid, getSessionId, getSourceType, getAttribution, getAllTrackingData,
  normalizePhone,
} from './persistence';
import {
  generateEventId, pushLeadConversion, pushContactConversion, enableDebug,
  trackPhoneClick, trackCallbackClick, trackEmailClick, trackWhatsappClick,
  hasClickFired, markClickFired,
} from './events';
import { sendToWorker } from './gateway';
import { trackingConfig } from './config';

// ── Init ───────────────────────────────────────────────────────────

// initTracking runs on every astro:page-load (and again via the readyState fallback
// on first load). URL capture must run per navigation, but the consent listener must
// register ONCE — otherwise each view transition accumulates another onConsentChange
// handler (a slow leak that re-fires persistTrackingParams N times).
let consentListenerBound = false;

export function initTracking(): void {
  if (window.location.search.includes('debugTracking=1')) enableDebug();
  captureUrlParams();
  if (!consentListenerBound) {
    consentListenerBound = true;
    onConsentChange((c) => { if (c.marketing) persistTrackingParams(); });
  }
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

/**
 * Browser dispatch to the gateway for LOW-RISK events. `sendToWorker` guards the
 * event name against the ingress contract (server-only names are blocked with a
 * loud TRK-1005 instead of a silent gateway 403). Fire-and-forget: the transport
 * layer adds attribution/consent/fbp/fbc/session_id. The browser dataLayer push
 * goes SEPARATELY (events.ts) with the SAME event_id → Meta Pixel↔CAPI dedup.
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

/**
 * Lead/quote form submit → BROWSER LEG ONLY (dataLayer → GTM → Pixel/GA4/Ads).
 *
 * The gateway leg is DELIBERATELY absent here: `quote_calculator_submitted` is
 * server-ingress-only (browser path → 403, TRK-400-017). The site backend that
 * receives the form POST must call the gateway with the SAME event_id — it
 * arrives in the `event_id` hidden field this lib populates
 * (`populateHiddenFields`). See server/backend/gateway-dispatch.ts.
 */
export function trackLeadSubmit(params: LeadSubmitParams): LeadSubmitResult {
  const gclid = getGclid(), fbclid = getFbclid(), eventId = generateEventId();
  if (!hasMarketingConsent()) return { success: false, consentBlocked: true, eventId, gclid, fbclid };

  const currency = params.currency || trackingConfig.currency;

  pushLeadConversion({
    email: params.email, phone: params.phone,
    firstName: params.firstName, lastName: params.lastName,
    value: params.value, currency,
    gclid: gclid || undefined, eventId,
  });

  return { success: true, consentBlocked: false, eventId, gclid, fbclid };
}

/**
 * Contact form submit → BROWSER LEG ONLY. `contact_form_submitted` is
 * server-ingress-only — same contract as trackLeadSubmit: the backend sends the
 * gateway leg with the event_id from the hidden field.
 */
export function trackContactSubmit(
  params: Pick<LeadSubmitParams, 'email' | 'phone'>,
): LeadSubmitResult {
  const gclid = getGclid(), fbclid = getFbclid(), eventId = generateEventId();
  if (!hasMarketingConsent()) return { success: false, consentBlocked: true, eventId, gclid, fbclid };

  pushContactConversion({ email: params.email, phone: params.phone, eventId, gclid: gclid || undefined });
  return { success: true, consentBlocked: false, eventId, gclid, fbclid };
}

/**
 * Generic BROWSER-PATH event to the gateway (phone_number_clicked,
 * email_address_clicked, whatsapp_button_clicked, video_play, begin_checkout).
 * The browser dataLayer push must be handled separately (events.ts) with the same
 * event_id if dedup is needed.
 *
 * GUARDRAIL: server-ingress-only names (quote_calculator_submitted,
 * callback_request_submitted, contact_form_submitted, order_request_submitted,
 * purchase) are BLOCKED by sendToWorker with a TRK-1005 error diagnostic — the
 * gateway would 403 them anyway. Those go through the site backend.
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
// These are the #1 lead-gen signals. phone/email/whatsapp fire up to TWO channels
// with ONE shared event_id (Meta Pixel↔CAPI dedup):
//   • browser dataLayer push (events.ts) — gated on ANALYTICS consent (browser GA4)
//   • browser-path gateway dispatch      — gated on MARKETING consent (Meta CAPI)
// The two gates are INDEPENDENT (this matches the skill's consent matrix): a
// visitor who grants marketing but not analytics still gets the server-side ad
// conversion — the money signal — even though the browser GA4 event is withheld.
// Each click type keeps a session dedup that the conversion layer owns (keyed per
// type: phone/callback/email/whatsapp), so a repeat click in the same session is
// suppressed on BOTH channels regardless of which consents are present — otherwise
// a user tapping a tel:/mailto:/wa.me link N times would book N server-side ad
// conversions (each with a fresh event_id → the worker can't dedup them), poisoning
// Smart Bidding / Meta optimization.
//
// CALLBACK IS THE EXCEPTION: `callback_request_submitted` is server-ingress-only,
// so the bare CTA click has NO gateway leg (dataLayer only). Where the callback is
// a real form POST, the backend dispatches the conversion (same contract as
// trackLeadSubmit).

// Exported so the event-name contract test can assert against the REAL map the code
// dispatches with (not a copy), guaranteeing they stay in the gateway's browser set.
// `null` = no gateway leg (server-ingress-only event; the browser path would 403).
export const CLICK_GATEWAY_EVENT = {
  phone: 'phone_number_clicked',
  callback: null,
  email: 'email_address_clicked',
  whatsapp: 'whatsapp_button_clicked',
} as const;

function trackClickConversion(
  pushDataLayer: (eventId: string) => void,
  // null → no gateway leg (server-ingress-only event; the browser path would 403)
  gatewayEvent: string | null,
  opts: { dedupName?: string; params?: { email?: string; phone?: string } } = {},
): string | null {
  const { dedupName, params = {} } = opts;
  const analytics = hasAnalyticsConsent();
  const marketing = hasMarketingConsent();
  if (!analytics && !marketing) return null;             // nothing consented → no-op, no dedup mark
  if (dedupName && hasClickFired(dedupName)) return null; // already fired this session (both channels)

  const eventId = generateEventId();
  if (analytics) pushDataLayer(eventId);                  // browser GA4 (dataLayer)
  if (marketing && gatewayEvent) dispatchToGateway(gatewayEvent, eventId, params); // server Meta CAPI
  if (dedupName) markClickFired(dedupName);
  return eventId;
}

/** Phone click → dataLayer + gateway `phone_number_clicked` (shared event_id, session-deduped). */
export function trackPhoneConversion(params: { phone?: string } = {}): string | null {
  // dedup is owned here → pass dedup=false to the dataLayer pusher to avoid double-marking.
  return trackClickConversion((id) => { trackPhoneClick(id, false); }, CLICK_GATEWAY_EVENT.phone, {
    dedupName: 'phone', params: { phone: params.phone },
  });
}

/**
 * Callback CTA click → dataLayer ONLY (session-deduped). The gateway leg is
 * deliberately absent: `callback_request_submitted` is server-ingress-only (the
 * browser path answers 403, TRK-400-017). Where the callback is a form POST, the
 * backend dispatches the server conversion with the shared event_id; for a bare
 * CTA click the browser Pixel/GA4 leg is the whole signal.
 */
export function trackCallbackConversion(params: { email?: string; phone?: string } = {}): string | null {
  return trackClickConversion((id) => { trackCallbackClick(id); }, CLICK_GATEWAY_EVENT.callback, {
    dedupName: 'callback', params,
  });
}

/** Email (mailto:) click → dataLayer + gateway `email_address_clicked` (shared event_id, session-deduped). */
export function trackEmailConversion(params: { email?: string } = {}): string | null {
  return trackClickConversion((id) => { trackEmailClick(id); }, CLICK_GATEWAY_EVENT.email, {
    dedupName: 'email', params: { email: params.email },
  });
}

/** WhatsApp click → dataLayer + gateway `whatsapp_button_clicked` (shared event_id, session-deduped). */
export function trackWhatsappConversion(params: { phone?: string } = {}): string | null {
  return trackClickConversion((id) => { trackWhatsappClick(id); }, CLICK_GATEWAY_EVENT.whatsapp, {
    dedupName: 'whatsapp', params: { phone: params.phone },
  });
}

// ── Hidden fields ──────────────────────────────────────────────────

/**
 * Writes gclid/fbclid/event_id/UTM into hidden inputs so the form POST carries
 * them to the site backend. The `event_id` field is LOAD-BEARING: the backend
 * reuses it for the gateway dispatch (Pixel↔CAPI dedup) — if it goes missing,
 * Meta double-counts every lead.
 */
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

/**
 * NAMING GUARDRAIL: the key is `event_id`, NOT `lead_id`. In the gateway's
 * vocabulary `lead_id` is EXCLUSIVELY the CRM's own record id (from the CRM
 * webhook response) — it joins the on-site event to the offline CRM loop. A
 * client-minted UUID in that column looks populated but joins to nothing, which
 * is worse than NULL. Keep the two namespaces apart.
 */
export function buildSheetsPayload(data: {
  eventType: string; name?: string; email: string; phone?: string;
  value?: number; currency?: string; eventId: string;
}): Record<string, unknown> {
  return {
    event_id: data.eventId, event_type: data.eventType,
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
