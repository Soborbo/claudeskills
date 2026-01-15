/**
 * Zero-Cost Tracking v2 - DataLayer
 *
 * GTM dataLayer event pushing with proper typing.
 */

import { TRACKING_VERSION, EVENT_NAMES, getSiteCurrency, DEVICE_BREAKPOINTS } from './constants';
import { getOrCreateSessionId } from './session';
import { buildAttributionForDataLayer } from './params';

// =============================================================================
// Types
// =============================================================================

export interface DataLayerEvent {
  event: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    dataLayer: DataLayerEvent[];
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Ensure dataLayer exists
 */
function ensureDataLayer(): DataLayerEvent[] {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
  }
  return window.dataLayer;
}

/**
 * Get device type based on viewport width
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  if (width < DEVICE_BREAKPOINTS.MOBILE) return 'mobile';
  if (width < DEVICE_BREAKPOINTS.TABLET) return 'tablet';
  return 'desktop';
}

/**
 * Get current page URL (pathname + search)
 */
function getPageUrl(): string {
  if (typeof window === 'undefined') return '';
  return window.location.pathname + window.location.search;
}

/**
 * Normalize email (lowercase, trim)
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Normalize phone (keep + and digits only)
 */
function normalizePhone(phone: string): string {
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

// =============================================================================
// Base Event Push
// =============================================================================

/**
 * Push event to dataLayer with common fields
 */
function pushEvent(eventName: string, params: Record<string, unknown> = {}): void {
  const dataLayer = ensureDataLayer();

  dataLayer.push({
    event: eventName,
    tracking_version: TRACKING_VERSION,
    session_id: getOrCreateSessionId(),
    page_url: getPageUrl(),
    device: getDeviceType(),
    ...params,
  });
}

// =============================================================================
// Phone Click (minimal - no attribution)
// =============================================================================

/**
 * Push phone click event
 *
 * @param value - Optional quote value (0 if not from calculator)
 * @param currency - Optional currency (defaults to site currency)
 */
export function pushPhoneClick(value?: number, currency?: string): void {
  pushEvent(EVENT_NAMES.PHONE_CLICK, {
    value: value || 0,
    currency: currency || getSiteCurrency(),
  });
}

// =============================================================================
// Conversion Events (full attribution)
// =============================================================================

export interface ConversionEventParams {
  leadId: string;
  email: string;
  phone?: string;
  value?: number;
  currency?: string;
}

/**
 * Push conversion event with full attribution
 */
function pushConversionEvent(
  eventName: string,
  params: ConversionEventParams
): void {
  const attribution = buildAttributionForDataLayer();

  pushEvent(eventName, {
    lead_id: params.leadId,
    user_email: normalizeEmail(params.email),
    user_phone: params.phone ? normalizePhone(params.phone) : undefined,
    value: params.value || 0,
    currency: params.currency || getSiteCurrency(),
    ...attribution,
  });
}

/**
 * Push quote request conversion
 */
export function pushQuoteRequest(params: ConversionEventParams): void {
  pushConversionEvent(EVENT_NAMES.QUOTE_REQUEST, params);
}

/**
 * Push callback request conversion
 */
export function pushCallbackRequest(params: ConversionEventParams): void {
  pushConversionEvent(EVENT_NAMES.CALLBACK_REQUEST, params);
}

/**
 * Push contact form conversion
 */
export function pushContactForm(params: ConversionEventParams): void {
  pushConversionEvent(EVENT_NAMES.CONTACT_FORM, params);
}

// =============================================================================
// Calculator Events (minimal - no attribution)
// =============================================================================

/**
 * Push calculator start event
 */
export function pushCalculatorStart(): void {
  pushEvent(EVENT_NAMES.CALCULATOR_START);
}

/**
 * Push calculator step event
 */
export function pushCalculatorStep(step: number): void {
  pushEvent(EVENT_NAMES.CALCULATOR_STEP, { step });
}

/**
 * Push calculator option selection event
 */
export function pushCalculatorOption(field: string, value: string): void {
  pushEvent(EVENT_NAMES.CALCULATOR_OPTION, {
    field,
    value, // Note: 'value' here is the option value (string), not monetary
  });
}

// =============================================================================
// Form Abandonment (minimal)
// =============================================================================

/**
 * Push form abandonment event
 */
export function pushFormAbandon(formId: string, lastField: string): void {
  pushEvent(EVENT_NAMES.FORM_ABANDON, {
    form_id: formId,
    last_field: lastField,
  });
}

// =============================================================================
// Debug
// =============================================================================

/**
 * Get current dataLayer contents (for debugging)
 */
export function getDataLayer(): DataLayerEvent[] {
  if (typeof window === 'undefined') return [];
  return window.dataLayer || [];
}
