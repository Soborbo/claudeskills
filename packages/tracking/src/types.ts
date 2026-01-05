/**
 * @leadgen/tracking - Type Definitions
 *
 * Shared types for both server-side integration and client-side modules.
 */

// =============================================================================
// Integration Configuration
// =============================================================================

/**
 * Tracking integration configuration options
 */
export interface TrackingConfig {
  /**
   * Google Tag Manager container ID
   * @example 'GTM-XXXXXXX'
   */
  gtmId: string;

  /**
   * Days to persist GCLID/tracking params in localStorage
   * @default 90
   */
  gclidPersistDays?: number;

  /**
   * Enable debug logging to console
   * @default false
   */
  debug?: boolean;
}

/**
 * Resolved configuration with defaults applied
 */
export interface ResolvedTrackingConfig {
  gtmId: string;
  gclidPersistDays: number;
  debug: boolean;
}

// =============================================================================
// Consent Types
// =============================================================================

/**
 * CookieYes consent state
 */
export interface ConsentState {
  /** Analytics/statistics cookies */
  analytics: boolean;
  /** Marketing/advertising cookies */
  marketing: boolean;
  /** Functional cookies */
  functional: boolean;
  /** Strictly necessary cookies (always true) */
  necessary: boolean;
}

/**
 * Consent change callback
 */
export type ConsentChangeCallback = (consent: ConsentState) => void;

// =============================================================================
// Tracking Parameters
// =============================================================================

/**
 * Persisted tracking parameters from URL
 */
export interface TrackingParams {
  /** Google Click ID (from Google Ads) */
  gclid?: string;
  /** Google Ads app deep link click ID */
  gbraid?: string;
  /** Google Ads web-to-app click ID */
  wbraid?: string;
  /** Facebook Click ID */
  fbclid?: string;
  /** UTM Source */
  utm_source?: string;
  /** UTM Medium */
  utm_medium?: string;
  /** UTM Campaign */
  utm_campaign?: string;
  /** UTM Content */
  utm_content?: string;
  /** UTM Term */
  utm_term?: string;
  /** Timestamp when params were captured */
  timestamp: number;
  /** Landing page URL */
  landingPage: string;
}

// =============================================================================
// DataLayer Types
// =============================================================================

/**
 * User-provided data for Enhanced Conversions
 */
export interface UserProvidedData {
  /** Email address (will be normalized) */
  email: string;
  /** Phone number (will be normalized) */
  phone_number?: string;
  /** First name */
  first_name?: string;
  /** Last name */
  last_name?: string;
}

/**
 * Conversion event parameters for dataLayer
 */
export interface ConversionDataLayerEvent {
  event: 'conversion';
  /** REQUIRED: Unique transaction ID for deduplication */
  transaction_id: string;
  /** User data for Enhanced Conversions */
  user_provided_data: UserProvidedData;
  /** Conversion value */
  value?: number;
  /** Currency code (ISO 4217) */
  currency?: string;
  /** Form identifier */
  form_id?: string;
}

/**
 * Generic dataLayer event
 */
export interface DataLayerEvent {
  event: string;
  [key: string]: unknown;
}

// =============================================================================
// High-Level Event Types
// =============================================================================

/**
 * Conversion tracking parameters
 */
export interface ConversionParams {
  /** User email (required for Enhanced Conversions) */
  email: string;
  /** User phone number */
  phone?: string;
  /** User first name */
  firstName?: string;
  /** User last name */
  lastName?: string;
  /** Conversion value */
  value?: number;
  /** Currency code (default: GBP) */
  currency?: string;
  /** Form identifier */
  formId?: string;
  /** Transaction ID (auto-generated if not provided) */
  transactionId?: string;
}

/**
 * Result of tracking operation
 */
export interface TrackingResult {
  /** Whether tracking was successful */
  success: boolean;
  /** Unique event ID used for deduplication */
  eventId: string;
  /** GCLID if available */
  gclid: string | null;
  /** True if blocked due to missing consent */
  consentBlocked: boolean;
  /** True if blocked as duplicate */
  duplicate: boolean;
}

// =============================================================================
// Global Window Augmentation
// =============================================================================

declare global {
  interface Window {
    /** GTM dataLayer array */
    dataLayer: DataLayerEvent[];

    /** CookieYes consent function */
    getCkyConsent?: () => {
      categories: {
        analytics: boolean;
        advertisement: boolean;
        functional: boolean;
        necessary: boolean;
      };
    };

    /** Cloudflare Zaraz */
    zaraz?: {
      track: (eventName: string, properties?: Record<string, unknown>) => void;
      set: (key: string, value: unknown) => void;
    };
  }
}

export {};
