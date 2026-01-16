/**
 * @leadgen/tracking-v2/client
 *
 * Client-side tracking API.
 * Import: import { trackConversion, ... } from '@leadgen/tracking-v2/client';
 */

if (typeof window === 'undefined') {
  throw new Error('@leadgen/tracking-v2/client can only be used in browser');
}

// =============================================================================
// Re-exports - Core
// =============================================================================

export { TRACKING_VERSION, EVENT_NAMES, getSiteCurrency, log } from './constants';
export { safeGetItem, safeSetItem, safeRemoveItem } from './storage';
export { getOrCreateSessionId, getCurrentSessionId, hasActiveSession } from './session';
export {
  captureAttributionParams,
  getFirstTouch,
  getLastTouch,
  getAttributionData,
  getGclid,
  getFbclid,
  buildAttributionForDataLayer,
  hasAttributionData,
  clearAttributionData,
} from './params';
export { classifySourceType, getSourceTypeLabel } from './source-type';
export {
  getConsentState,
  hasMarketingConsent,
  hasAnalyticsConsent,
  getConsentStateLabel,
  onConsentChange,
  waitForConsent,
} from './consent';
export {
  pushPhoneClick,
  pushQuoteRequest,
  pushCallbackRequest,
  pushContactForm,
  pushCalculatorStart,
  pushCalculatorStep,
  pushCalculatorOption,
  pushFormAbandon,
  getDataLayer,
  getDeviceType,
} from './dataLayer';
export { isZarazAvailable, trackMetaLead, trackMetaContact, setZarazUserData } from './zaraz';
export { generateLeadId, generateIdempotencyKey, shouldFirePhoneClick } from './idempotency';

// =============================================================================
// Re-exports - Custom Events
// =============================================================================

export { trackEvent, trackEvents } from './customEvents';
export type { CustomEventParams, TrackEventResult } from './customEvents';

// =============================================================================
// Re-exports - Offline Queue
// =============================================================================

export {
  initOfflineQueue,
  queueRequest,
  processQueue,
  fetchWithQueue,
  getQueueStats,
  clearQueue,
} from './offlineQueue';

// =============================================================================
// Re-exports - Plugins
// =============================================================================

export {
  registerPlugin,
  unregisterPlugin,
  getPlugin,
  getPlugins,
  initPlugins,
  notifyPageView,
  notifyEvent,
  notifyConversion,
  notifyPhoneClick,
  notifyConsentChange,
  notifyError,
  createConsoleLoggerPlugin,
  createErrorReporterPlugin,
} from './plugins';
export type { TrackingPlugin, PluginContext } from './plugins';

// =============================================================================
// Re-exports - Cross-Domain
// =============================================================================

export {
  getCrossDomainData,
  encodeCrossDomainData,
  decorateUrl,
  decorateLinksTodomains,
  decodeCrossDomainData,
  applyCrossDomainData,
  initCrossDomain,
} from './crossDomain';

// =============================================================================
// Re-exports - Debug Overlay
// =============================================================================

export {
  logDebugEvent,
  showDebugOverlay,
  hideDebugOverlay,
  toggleDebugOverlay,
  isDebugOverlayVisible,
  initDebugMode,
} from './debugOverlay';

// =============================================================================
// Re-exports - Validation
// =============================================================================

export {
  validateEvent,
  validateAndWarn,
  registerSchema,
  getSchema,
  unregisterSchema,
  listSchemas,
} from './validation';
export type { ValidationError, ValidationResult } from './validation';

// =============================================================================
// Re-exports - Funnel Analytics
// =============================================================================

export {
  createFunnel,
  getFunnel,
  getAllFunnels,
  enableAutoTracking,
  getConversionRate,
  getDropoffAnalysis,
} from './funnel';
export type { Funnel, FunnelStep, FunnelProgress, FunnelStats } from './funnel';

// =============================================================================
// Re-exports - Form Analytics
// =============================================================================

export {
  trackFormFields,
  stopTrackingForm,
  getFormMetrics,
  getTrackedForms,
  autoTrackForms,
} from './formAnalytics';
export type { FormFieldOptions, FieldMetrics, FormMetrics } from './formAnalytics';

// =============================================================================
// Re-exports - User Identity
// =============================================================================

export {
  identifyUser,
  isIdentified,
  getUserIdentity,
  getUserEmailHash,
  mergeIdentity,
  clearIdentity,
  trackAnonymousSession,
  pushUserDataForConversions,
  getUserJourney,
  initIdentityTracking,
} from './identity';
export type { UserIdentity, IdentifyParams } from './identity';

// =============================================================================
// Re-exports - Remarketing
// =============================================================================

export {
  initRemarketing,
  stopRemarketing,
  updateEngagement,
  trackPageView,
  trackNewSession,
  trackScrollDepth,
  trackTimeOnSite,
  getAudienceSegment,
  getEngagement,
  trackContentView,
  trackServiceView,
  trackCalculatorForRemarketing,
  getRemarketingData,
} from './remarketing';
export type { AudienceSegment, EngagementSignals, RemarketingContent } from './remarketing';

// =============================================================================
// High-Level API
// =============================================================================

import type { ConversionType, TrackConversionResult, TrackPhoneClickResult, SheetsPayload } from '../types';
import { hasMarketingConsent, onConsentChange, getConsentStateLabel } from './consent';
import { captureAttributionParams, getFirstTouch, getLastTouch, getGclid } from './params';
import { getOrCreateSessionId } from './session';
import { getSourceTypeLabel } from './source-type';
import { getDeviceType, pushQuoteRequest, pushCallbackRequest, pushContactForm, pushPhoneClick as pushPhoneClickEvent } from './dataLayer';
import { trackMetaLead, trackMetaContact } from './zaraz';
import { generateLeadId, generateIdempotencyKey, shouldFirePhoneClick } from './idempotency';
import { TRACKING_VERSION, getSiteCurrency, log } from './constants';

// =============================================================================
// trackConversion
// =============================================================================

export interface TrackConversionParams {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  value?: number;
  currency?: string;
}

export function trackConversion(
  type: ConversionType,
  params: TrackConversionParams
): TrackConversionResult {
  const leadId = generateLeadId();
  const gclid = getGclid();
  const hasConsent = hasMarketingConsent();

  if (!hasConsent) {
    log('No marketing consent - tracking limited');
  }

  const eventParams = {
    leadId,
    email: params.email,
    phone: params.phone,
    value: params.value,
    currency: params.currency,
  };

  // Push to GTM
  switch (type) {
    case 'quote_request':
      pushQuoteRequest(eventParams);
      break;
    case 'callback_request':
      pushCallbackRequest(eventParams);
      break;
    case 'contact_form':
      pushContactForm(eventParams);
      break;
  }

  // Track via Zaraz
  trackMetaLead({
    email: params.email,
    phone: params.phone,
    value: params.value,
    currency: params.currency,
    eventId: leadId,
  });

  return { success: true, leadId, gclid, consentBlocked: !hasConsent };
}

// =============================================================================
// trackPhoneClick
// =============================================================================

export interface TrackPhoneClickParams {
  phone?: string;
  value?: number;
  currency?: string;
}

export function trackPhoneClick(params: TrackPhoneClickParams = {}): TrackPhoneClickResult {
  const sessionId = getOrCreateSessionId();
  const eventId = `phone_${sessionId}`;

  if (!shouldFirePhoneClick(sessionId)) {
    log('Phone click already fired this session');
    return { success: false, duplicate: true, eventId };
  }

  pushPhoneClickEvent(params.value, params.currency);

  // Track via Zaraz (Meta CAPI) if phone provided
  if (params.phone) {
    trackMetaContact(params.phone, eventId);
  }

  return { success: true, duplicate: false, eventId };
}

// =============================================================================
// buildSheetsPayload
// =============================================================================

export interface SheetsPayloadInput {
  eventType: ConversionType;
  name?: string;
  email: string;
  phone?: string;
  value?: number;
  currency?: string;
  leadId?: string;
}

export function buildSheetsPayload(input: SheetsPayloadInput): SheetsPayload {
  const leadId = input.leadId || generateLeadId();
  const first = getFirstTouch();
  const last = getLastTouch();

  return {
    lead_id: leadId,
    event_type: input.eventType,
    submitted_at: new Date().toISOString(),
    tracking_version: TRACKING_VERSION,
    session_id: getOrCreateSessionId(),
    consent_state: getConsentStateLabel(),
    source_type: getSourceTypeLabel(),
    name: input.name || '',
    email: input.email.trim().toLowerCase(),
    phone: input.phone || '',
    value: input.value || 0,
    currency: input.currency || getSiteCurrency(),
    page_url: typeof window !== 'undefined' ? window.location.pathname : '',
    device: getDeviceType(),
    // First touch
    first_utm_source: first?.utm_source || '',
    first_utm_medium: first?.utm_medium || '',
    first_utm_campaign: first?.utm_campaign || '',
    first_utm_term: first?.utm_term || '',
    first_utm_content: first?.utm_content || '',
    first_gclid: first?.gclid || '',
    first_gbraid: first?.gbraid || '',
    first_wbraid: first?.wbraid || '',
    first_fbclid: first?.fbclid || '',
    first_referrer: first?.referrer || '',
    // Last touch
    last_utm_source: last?.utm_source || '',
    last_utm_medium: last?.utm_medium || '',
    last_utm_campaign: last?.utm_campaign || '',
    last_utm_term: last?.utm_term || '',
    last_utm_content: last?.utm_content || '',
    last_gclid: last?.gclid || '',
    last_gbraid: last?.gbraid || '',
    last_wbraid: last?.wbraid || '',
    last_fbclid: last?.fbclid || '',
    last_referrer: last?.referrer || '',
    idempotency_key: generateIdempotencyKey(input.email, input.eventType),
  };
}

// =============================================================================
// initTracking
// =============================================================================

export function initTracking(): void {
  if (typeof window === 'undefined') return;

  if (hasMarketingConsent()) {
    captureAttributionParams();
  }

  onConsentChange((state) => {
    if (state.marketing) {
      captureAttributionParams();
    }
  });

  log('Tracking initialized');
}

// Re-export types
export type { ConversionType, TrackConversionResult, TrackPhoneClickResult, SheetsPayload } from '../types';
