/**
 * Zero-Cost Tracking v2
 *
 * Unified exports for tracking system.
 * Import everything from '@/lib/tracking'
 */

// =============================================================================
// Re-exports
// =============================================================================

// Constants
export {
  TRACKING_VERSION,
  STORAGE_KEYS,
  EVENT_NAMES,
  TIMING,
  getSiteCurrency,
} from './constants';

// Storage
export { safeGetItem, safeSetItem, safeRemoveItem } from './storage';

// Session
export {
  getOrCreateSessionId,
  getCurrentSessionId,
  hasActiveSession,
} from './session';

// Attribution Params
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
  type AttributionParams,
  type AttributionData,
} from './params';

// Source Type
export { classifySourceType, getSourceTypeLabel, type SourceType } from './source-type';

// Consent
export {
  getConsentState,
  hasMarketingConsent,
  hasAnalyticsConsent,
  getConsentStateLabel,
  onConsentChange,
  waitForConsent,
  type ConsentState,
} from './consent';

// DataLayer
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
  type ConversionEventParams,
} from './dataLayer';

// Zaraz (Meta CAPI)
export {
  isZarazAvailable,
  trackMetaLead,
  trackMetaContact,
  setZarazUserData,
  type MetaLeadParams,
} from './zaraz';

// Idempotency
export {
  generateLeadId,
  generateIdempotencyKey,
  shouldFirePhoneClick,
} from './idempotency';

// =============================================================================
// High-Level API
// =============================================================================

import { hasMarketingConsent } from './consent';
import { captureAttributionParams, getFirstTouch, getLastTouch } from './params';
import { getOrCreateSessionId } from './session';
import { getSourceTypeLabel } from './source-type';
import { getConsentStateLabel } from './consent';
import { getDeviceType } from './dataLayer';
import {
  pushQuoteRequest,
  pushCallbackRequest,
  pushContactForm,
  pushPhoneClick as pushPhoneClickEvent,
} from './dataLayer';
import { trackMetaLead, trackMetaContact } from './zaraz';
import { generateLeadId, generateIdempotencyKey, shouldFirePhoneClick } from './idempotency';
import { STORAGE_KEYS, TIMING, getSiteCurrency } from './constants';
import { getStoredJson, setStoredJson } from './storage';

// =============================================================================
// Track Conversion (High-Level)
// =============================================================================

export type ConversionType = 'quote_request' | 'callback_request' | 'contact_form';

export interface TrackConversionParams {
  email: string;
  phone?: string;
  value?: number;
  currency?: string;
}

export interface TrackConversionResult {
  success: boolean;
  leadId: string;
  consentBlocked: boolean;
}

/**
 * Track a conversion event (GTM + Zaraz)
 *
 * Handles:
 * - Lead ID generation
 * - DataLayer push (GTM → GA4 + GAds)
 * - Zaraz track (Meta CAPI)
 *
 * @param type - Conversion type
 * @param params - Conversion parameters
 */
export function trackConversion(
  type: ConversionType,
  params: TrackConversionParams
): TrackConversionResult {
  const leadId = generateLeadId();

  // Check consent for localStorage (GTM handles its own consent)
  const hasConsent = hasMarketingConsent();

  if (!hasConsent) {
    console.debug('[Tracking] No marketing consent - tracking limited');
  }

  const eventParams = {
    leadId,
    email: params.email,
    phone: params.phone,
    value: params.value,
    currency: params.currency,
  };

  // Push to GTM dataLayer
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

  // Track via Zaraz (Meta CAPI)
  trackMetaLead({
    email: params.email,
    phone: params.phone,
    value: params.value,
    currency: params.currency,
    eventId: leadId,
  });

  return {
    success: true,
    leadId,
    consentBlocked: !hasConsent,
  };
}

// =============================================================================
// Track Phone Click (High-Level)
// =============================================================================

export interface TrackPhoneClickResult {
  success: boolean;
  duplicate: boolean;
}

/**
 * Track phone click with deduplication
 *
 * Only fires once per session. Page reload allows new fire.
 */
export function trackPhoneClick(value?: number, currency?: string): TrackPhoneClickResult {
  const sessionId = getOrCreateSessionId();

  // Check deduplication
  if (!shouldFirePhoneClick(sessionId)) {
    return { success: false, duplicate: true };
  }

  // Push to GTM
  pushPhoneClickEvent(value, currency);

  // Track via Zaraz
  trackMetaContact('+phone', sessionId); // eventId for dedup

  return { success: true, duplicate: false };
}

// =============================================================================
// Build Sheets Payload
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

export interface SheetsPayload {
  lead_id: string;
  event_type: string;
  submitted_at: string;
  tracking_version: string;
  session_id: string;
  consent_state: string;
  source_type: string;
  name: string;
  email: string;
  phone: string;
  value: number;
  currency: string;
  page_url: string;
  device: string;
  // Attribution
  first_utm_source: string;
  first_utm_medium: string;
  first_utm_campaign: string;
  first_utm_term: string;
  first_utm_content: string;
  first_gclid: string;
  first_fbclid: string;
  first_referrer: string;
  last_utm_source: string;
  last_utm_medium: string;
  last_utm_campaign: string;
  last_utm_term: string;
  last_utm_content: string;
  last_gclid: string;
  last_fbclid: string;
  idempotency_key: string;
}

/**
 * Build payload for Sheets API
 */
export function buildSheetsPayload(input: SheetsPayloadInput): SheetsPayload {
  const leadId = input.leadId || generateLeadId();
  const first = getFirstTouch();
  const last = getLastTouch();

  return {
    lead_id: leadId,
    event_type: input.eventType,
    submitted_at: new Date().toISOString(),
    tracking_version: 'v2.0',
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
    first_fbclid: first?.fbclid || '',
    first_referrer: first?.referrer || '',
    // Last touch
    last_utm_source: last?.utm_source || '',
    last_utm_medium: last?.utm_medium || '',
    last_utm_campaign: last?.utm_campaign || '',
    last_utm_term: last?.utm_term || '',
    last_utm_content: last?.utm_content || '',
    last_gclid: last?.gclid || '',
    last_fbclid: last?.fbclid || '',
    // Idempotency
    idempotency_key: generateIdempotencyKey(input.email, input.eventType),
  };
}

// =============================================================================
// Submit Lead (with retry queue)
// =============================================================================

interface QueuedLead {
  payload: SheetsPayload;
  timestamp: number;
}

/**
 * Submit lead to Sheets API with retry queue
 *
 * 1. Try fetch with 5s timeout
 * 2. On failure: queue to localStorage
 * 3. Always: sendBeacon as backup
 */
export async function submitLead(input: SheetsPayloadInput): Promise<boolean> {
  const payload = buildSheetsPayload(input);

  // 1. Try fetch
  try {
    const response = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMING.LEAD_SUBMIT_TIMEOUT_MS),
    });

    if (response.ok) {
      return true;
    }
  } catch (error) {
    console.error('[Tracking] Lead submission failed:', error);
  }

  // 2. Queue for retry
  queueFailedLead(payload);

  // 3. sendBeacon backup
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon('/api/lead', JSON.stringify(payload));
  }

  return false;
}

/**
 * Queue failed lead for retry
 */
function queueFailedLead(payload: SheetsPayload): void {
  try {
    const queue = getStoredJson<QueuedLead[]>(STORAGE_KEYS.LEAD_QUEUE) || [];
    queue.push({ payload, timestamp: Date.now() });

    // Keep only last N items
    const trimmed = queue.slice(-TIMING.MAX_QUEUED_LEADS);
    setStoredJson(STORAGE_KEYS.LEAD_QUEUE, trimmed);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Retry queued leads (call on page load)
 */
export function retryQueuedLeads(): void {
  try {
    const queue = getStoredJson<QueuedLead[]>(STORAGE_KEYS.LEAD_QUEUE);
    if (!queue || queue.length === 0) return;

    console.debug('[Tracking] Retrying', queue.length, 'queued leads');

    queue.forEach(({ payload }) => {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/lead', JSON.stringify(payload));
      }
    });

    // Clear queue
    localStorage.removeItem(STORAGE_KEYS.LEAD_QUEUE);
  } catch {
    // Ignore
  }
}

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize tracking on page load
 * Call this from TrackingInit.astro
 */
export function initTracking(): void {
  if (typeof window === 'undefined') return;

  // 1. Capture attribution params (if consent)
  if (hasMarketingConsent()) {
    captureAttributionParams();
  }

  // 2. Retry any queued leads
  retryQueuedLeads();

  // 3. Listen for consent changes
  onConsentChange((state) => {
    if (state.marketing) {
      captureAttributionParams();
    }
  });

  console.debug('[Tracking] Initialized');
}
