/**
 * @leadgen/conversion-tracking - Type Definitions
 */

// =============================================================================
// Integration Configuration
// =============================================================================

export interface TrackingConfig {
  /** Google Tag Manager container ID (e.g., 'GTM-XXXXXXX') */
  gtmId: string;
  /** Site currency (default: 'GBP') */
  currency?: string;
  /** Session timeout in minutes (default: 30) */
  sessionTimeoutMinutes?: number;
  /** Enable debug logging and overlay (default: false) */
  debug?: boolean;
  /** Domains to share tracking data with (cross-domain tracking) */
  linkedDomains?: string[];
  /** Enable offline queue for failed requests (default: true) */
  enableOfflineQueue?: boolean;
}

export interface ResolvedTrackingConfig {
  gtmId: string;
  currency: string;
  sessionTimeoutMinutes: number;
  debug: boolean;
  linkedDomains: string[];
  enableOfflineQueue: boolean;
}

// =============================================================================
// Consent
// =============================================================================

export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  necessary: boolean;
}

export type ConsentCategory = 'analytics' | 'marketing' | 'functional';
export type ConsentChangeCallback = (state: ConsentState) => void;

// =============================================================================
// Attribution
// =============================================================================

export interface AttributionParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  fbclid?: string;
  referrer?: string;
  timestamp: number;
  landingPage: string;
}

export interface AttributionData {
  first: AttributionParams | null;
  last: AttributionParams | null;
}

// =============================================================================
// Session
// =============================================================================

export interface SessionData {
  id: string;
  lastActivity: number;
}

// =============================================================================
// Source Type
// =============================================================================

export type SourceType = 'paid' | 'organic' | 'owned' | 'direct';

// =============================================================================
// Events
// =============================================================================

export type ConversionType = 'quote_request' | 'callback_request' | 'contact_form';

export interface ConversionParams {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  value?: number;
  currency?: string;
  formId?: string;
}

export interface TrackConversionResult {
  success: boolean;
  leadId: string;
  gclid: string | null;
  consentBlocked: boolean;
}

export interface TrackPhoneClickResult {
  success: boolean;
  duplicate: boolean;
  eventId: string;
}

// =============================================================================
// DataLayer
// =============================================================================

export interface DataLayerEvent {
  event: string;
  [key: string]: unknown;
}

export interface UserProvidedData {
  email: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
}

export interface ConversionDataLayerEvent {
  event: string;
  lead_id: string;
  tracking_version: string;
  session_id: string;
  page_url: string;
  device: string;
  user_email: string;
  user_phone?: string;
  value?: number;
  currency?: string;
  // Attribution - first touch
  first_utm_source?: string;
  first_utm_medium?: string;
  first_utm_campaign?: string;
  first_utm_term?: string;
  first_utm_content?: string;
  first_gclid?: string;
  first_gbraid?: string;
  first_wbraid?: string;
  first_fbclid?: string;
  first_referrer?: string;
  // Attribution - last touch
  last_utm_source?: string;
  last_utm_medium?: string;
  last_utm_campaign?: string;
  last_utm_term?: string;
  last_utm_content?: string;
  last_gclid?: string;
  last_gbraid?: string;
  last_wbraid?: string;
  last_fbclid?: string;
  last_referrer?: string;
}

// =============================================================================
// Sheets Payload
// =============================================================================

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
  referrer: string;
  device: string;
  // First touch attribution
  first_utm_source: string;
  first_utm_medium: string;
  first_utm_campaign: string;
  first_utm_term: string;
  first_utm_content: string;
  first_gclid: string;
  first_gbraid: string;
  first_wbraid: string;
  first_fbclid: string;
  first_referrer: string;
  // Last touch attribution
  last_utm_source: string;
  last_utm_medium: string;
  last_utm_campaign: string;
  last_utm_term: string;
  last_utm_content: string;
  last_gclid: string;
  last_gbraid: string;
  last_wbraid: string;
  last_fbclid: string;
  last_referrer: string;
  idempotency_key: string;
}

// =============================================================================
// Global Window Augmentation
// =============================================================================

declare global {
  interface Window {
    dataLayer: DataLayerEvent[];
    __TRACKING_CONFIG__?: ResolvedTrackingConfig;

    getCkyConsent?: () => {
      categories: {
        analytics: boolean;
        advertisement: boolean;
        functional: boolean;
        necessary: boolean;
      };
    };

    zaraz?: {
      track: (eventName: string, properties?: Record<string, unknown>) => void;
      set: (key: string, value: unknown) => void;
    };
  }
}

export {};
