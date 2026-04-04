/**
 * @leadgen/tracking/client
 *
 * Client-side tracking API for lead generation websites.
 * CLIENT-ONLY - Do not import in server context.
 */

// =============================================================================
// Browser Guard
// =============================================================================

if (typeof window === 'undefined') {
  throw new Error('@leadgen/tracking/client can only be used in browser');
}

// =============================================================================
// Re-exports
// =============================================================================

// Consent
export {
  getConsentState,
  hasMarketingConsent,
  hasAnalyticsConsent,
  hasFunctionalConsent,
  onConsentChange,
  waitForConsent,
} from './consent';

// GCLID/UTM Persistence
export {
  persistTrackingParams,
  getTrackingParams,
  getGclid,
  getFbclid,
  getUtmParams,
  clearTrackingParams,
  hasTrackingParams,
} from './gclid';

// DataLayer (low-level)
export {
  pushEvent,
  pushPageView,
  pushConversion,
  pushFormStart,
  pushFormSubmit,
  pushPhoneClick,
  pushEmailClick,
  pushCtaClick,
  pushScrollDepth,
  pushVideoEvent,
  pushOutboundClick,
  getDataLayer,
} from './dataLayer';

// High-level Events (recommended API)
export {
  generateEventId,
  trackConversion,
  trackFormStart,
  trackFormSubmit,
  trackPhoneClick,
  trackCtaClick,
  trackEvent,
  getFormTrackingData,
  isConversionTracked,
  clearTrackedConversions,
} from './events';

// =============================================================================
// Types Re-export
// =============================================================================

export type {
  ConsentState,
  ConsentChangeCallback,
  TrackingParams,
  UserProvidedData,
  ConversionParams,
  TrackingResult,
} from '../types';
