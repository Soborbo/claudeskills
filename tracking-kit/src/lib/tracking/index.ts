/**
 * Public surface for the tracking system. Components and pages should
 * import from `@/lib/tracking` (or wherever you mount this folder)
 * rather than reaching into individual modules — that keeps the
 * upgrade-state contract centralized.
 */

export {
  trackEvent,
  setUserDataOnDOM,
  clearUserDataOnDOM,
  readUserDataFromDOM,
  restoreUserDataFromStorage,
  normalizePhoneE164,
  normalizeUserData,
  getConsentSnapshot,
  hasAdStorageConsent,
  hasFullAdsConsent,
  type UserData,
  type CountryCode,
  type TrackingParams,
  type ConsentSnapshot,
  type ConsentValue,
} from './tracking';

export {
  resetConversionState,
  getActiveConversionState,
  markConversionUpgraded,
  hasViewContentFired,
  markViewContentFired,
  resumeConversionTimer,
  type ConversionState,
} from './conversion-state';

export {
  trackFormStart,
  trackFormFieldFocus,
  trackFormStep,
  trackFormSubmitted,
} from './form-tracking';

export { initGlobalListeners } from './global-listeners';

export { mirrorMetaCapi } from './meta-mirror';

export { generateUUID } from './uuid';

export { DEFAULT_CURRENCY, DEFAULT_COUNTRY, COUNTRY_DIAL_CODES } from './config';
