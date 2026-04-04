/**
 * @leadgen/utils
 *
 * Utility functions for lead generation websites.
 */

// UTM
export {
  getUtmFromUrl,
  getStoredUtm,
  storeUtm,
  captureUtmParams,
  clearUtm,
  getUtmForForm,
  buildUtmUrl,
  type UtmParams,
} from './utm';

// Analytics
export {
  trackEvent,
  trackFormSubmit,
  trackFormStart,
  trackPhoneClick,
  trackEmailClick,
  trackCtaClick,
  trackOutboundLink,
  trackScrollDepth,
  trackVideoEvent,
  trackPageView,
  initScrollDepthTracking,
  createTrackedClickHandler,
} from './analytics';

// Validation
export {
  validateEmail,
  validatePhone,
  validateName,
  validateTaxNumber,
  validatePostalCode,
  validateUrl,
  isEmpty,
  validateForm,
  commonValidators,
  type ValidationResult,
  type FieldValidator,
} from './validation';
