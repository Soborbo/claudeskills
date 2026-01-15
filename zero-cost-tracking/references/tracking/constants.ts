/**
 * Zero-Cost Tracking v2 - Constants
 *
 * Centralized configuration for tracking system.
 */

// =============================================================================
// Version
// =============================================================================

export const TRACKING_VERSION = 'v2.0';

// =============================================================================
// Storage Keys
// =============================================================================

export const STORAGE_KEYS = {
  /** First touch attribution data */
  FIRST_TOUCH: 'sb_first_touch',
  /** Last touch attribution data */
  LAST_TOUCH: 'sb_last_touch',
  /** Session data (id + lastActivity) */
  SESSION: 'sb_session',
  /** Failed lead submissions queue */
  LEAD_QUEUE: 'sb_lead_queue',
} as const;

// =============================================================================
// Event Names
// =============================================================================

export const EVENT_NAMES = {
  // Conversion events (full attribution)
  PHONE_CLICK: 'phone_click',
  CALLBACK_REQUEST: 'callback_request',
  QUOTE_REQUEST: 'quote_request',
  CONTACT_FORM: 'contact_form',

  // Calculator events (minimal)
  CALCULATOR_START: 'calculator_start',
  CALCULATOR_STEP: 'calculator_step',
  CALCULATOR_OPTION: 'calculator_option',

  // Engagement events
  FORM_ABANDON: 'form_abandon',
} as const;

export type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];

// =============================================================================
// Conversion Events (require full attribution)
// =============================================================================

export const CONVERSION_EVENTS: EventName[] = [
  EVENT_NAMES.CALLBACK_REQUEST,
  EVENT_NAMES.QUOTE_REQUEST,
  EVENT_NAMES.CONTACT_FORM,
];

// =============================================================================
// Timing
// =============================================================================

export const TIMING = {
  /** Session timeout in milliseconds (30 minutes) */
  SESSION_TIMEOUT_MS: 30 * 60 * 1000,
  /** Lead submission timeout in milliseconds (5 seconds) */
  LEAD_SUBMIT_TIMEOUT_MS: 5000,
  /** Max queued leads to store */
  MAX_QUEUED_LEADS: 10,
  /** Form abandonment timeout in milliseconds (60 seconds) */
  FORM_ABANDON_TIMEOUT_MS: 60 * 1000,
} as const;

// =============================================================================
// URL Parameters to Capture
// =============================================================================

export const TRACKING_PARAMS = [
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

export type TrackingParam = (typeof TRACKING_PARAMS)[number];

// =============================================================================
// Device Detection
// =============================================================================

export const DEVICE_BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
} as const;

// =============================================================================
// Default Currency
// =============================================================================

export function getSiteCurrency(): string {
  if (typeof window !== 'undefined' && 'PUBLIC_SITE_CURRENCY' in import.meta.env) {
    return import.meta.env.PUBLIC_SITE_CURRENCY;
  }
  return 'GBP';
}
