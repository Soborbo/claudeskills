/**
 * Soborbo Unified Tracking
 * 
 * Clean ESM exports - NO require()!
 */

// Re-exports
export { 
  persistTrackingParams, 
  getGclid, 
  getFbclid, 
  getAllTrackingData,
  getStoredData,
  clearTrackingData,
  type TrackingData
} from './gclid';

export { 
  pushConversion, 
  pushStepEvent, 
  pushOptionEvent,
  type UserData,
  type ConversionParams
} from './dataLayer';

export { 
  trackMetaLead, 
  trackMetaPageView, 
  trackMetaViewContent,
  type MetaEventParams
} from './zaraz';

export {
  hasMarketingConsent,
  hasAnalyticsConsent,
  canTrack,
  onConsentChange,
  waitForConsent,
  type ConsentCategory
} from './consent';

// Import for trackFullConversion - clean ESM
import { getGclid, getFbclid } from './gclid';
import { pushConversion } from './dataLayer';
import { trackMetaLead } from './zaraz';
import { hasMarketingConsent } from './consent';

export interface FullConversionParams {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  value?: number;
  currency?: string;
  transactionId?: string;
  contentName?: string;
}

export interface FullConversionResult {
  success: boolean;
  gclid: string | null;
  fbclid: string | null;
  consentBlocked: boolean;
}

/**
 * Teljes conversion tracking (GTM + Zaraz egyben)
 * 
 * Automatikusan ellenőrzi a consent-et!
 * Ha nincs marketing consent → visszatér success: false, consentBlocked: true
 */
export function trackFullConversion(params: FullConversionParams): FullConversionResult {
  const gclid = getGclid();
  const fbclid = getFbclid();
  
  // Consent check
  if (!hasMarketingConsent()) {
    console.info('[Tracking] Marketing consent not granted, skipping conversion tracking');
    return {
      success: false,
      gclid,
      fbclid,
      consentBlocked: true,
    };
  }
  
  // Google Ads Enhanced Conversions
  pushConversion({
    email: params.email,
    phone: params.phone,
    firstName: params.firstName,
    lastName: params.lastName,
    value: params.value,
    currency: params.currency,
    transactionId: params.transactionId,
    gclid: gclid || undefined,
  });
  
  // Meta CAPI
  trackMetaLead({
    email: params.email,
    phone: params.phone,
    value: params.value,
    currency: params.currency,
    contentName: params.contentName,
  });
  
  return {
    success: true,
    gclid,
    fbclid,
    consentBlocked: false,
  };
}
