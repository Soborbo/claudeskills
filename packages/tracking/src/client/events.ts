/**
 * @leadgen/tracking - Events Module
 *
 * High-level consent-aware, deduplicated event API.
 * CLIENT-ONLY - Do not import in server context.
 */

import type { ConversionParams, TrackingResult } from '../types';
import { hasMarketingConsent, hasAnalyticsConsent } from './consent';
import { getGclid, getTrackingParams } from './gclid';
import {
  pushConversion,
  pushFormStart,
  pushFormSubmit,
  pushPhoneClick,
  pushCtaClick,
  pushEvent,
} from './dataLayer';

// =============================================================================
// Browser Guard
// =============================================================================

const IS_BROWSER = typeof window !== 'undefined';
const DEBUG = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

if (!IS_BROWSER) {
  console.warn('[Tracking] @leadgen/tracking/client/events should only be imported in browser context');
}

// =============================================================================
// Deduplication State
// =============================================================================

/**
 * Set of fired conversion event IDs (in-memory, per session)
 * Prevents duplicate conversion tracking
 */
const firedConversions: Set<string> = new Set();

/**
 * Set of tracked form interactions (prevents duplicate form_start)
 */
const trackedFormStarts: Set<string> = new Set();

// =============================================================================
// Event ID Generation
// =============================================================================

/**
 * Generate unique event ID for deduplication
 *
 * Uses crypto.randomUUID() when available, falls back to timestamp + random
 */
export function generateEventId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: timestamp + random string
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// =============================================================================
// Conversion Tracking
// =============================================================================

/**
 * Track a conversion event with deduplication and consent check
 *
 * This is the main function for lead form submissions.
 * Handles: GTM dataLayer + Zaraz Meta (if available)
 *
 * @param params - Conversion parameters
 * @returns Tracking result with event ID and status
 *
 * @example
 * const result = trackConversion({
 *   email: 'user@example.com',
 *   phone: '+441234567890',
 *   value: 150,
 *   currency: 'GBP',
 *   formId: 'removal-calculator'
 * });
 *
 * if (result.success) {
 *   console.log('Conversion tracked:', result.eventId);
 * } else if (result.duplicate) {
 *   console.warn('Duplicate conversion blocked');
 * } else if (result.consentBlocked) {
 *   console.log('Conversion blocked - no consent');
 * }
 */
export function trackConversion(params: ConversionParams): TrackingResult {
  // Generate or use provided event ID
  const eventId = params.transactionId || generateEventId();
  const gclid = getGclid();

  // Check for duplicate
  if (firedConversions.has(eventId)) {
    if (DEBUG) console.warn('[Tracking] Duplicate conversion blocked:', eventId);
    return {
      success: false,
      eventId,
      gclid,
      consentBlocked: false,
      duplicate: true,
    };
  }

  // Check consent
  if (!hasMarketingConsent()) {
    if (DEBUG) console.log('[Tracking] Conversion blocked - no marketing consent');
    return {
      success: false,
      eventId,
      gclid,
      consentBlocked: true,
      duplicate: false,
    };
  }

  // Mark as fired BEFORE pushing (prevents race conditions)
  firedConversions.add(eventId);

  // Push to GTM dataLayer
  pushConversion({
    email: params.email,
    phone: params.phone,
    firstName: params.firstName,
    lastName: params.lastName,
    value: params.value,
    currency: params.currency || 'GBP',
    transactionId: eventId,
    formId: params.formId,
  });

  // Push to Zaraz (Meta CAPI) if available
  if (window.zaraz?.track) {
    try {
      window.zaraz.track('Lead', {
        email: params.email.trim().toLowerCase(),
        phone: params.phone,
        value: params.value,
        currency: params.currency || 'GBP',
        event_id: eventId,
      });
    } catch (error) {
      console.error('[Tracking] Zaraz track error:', error);
    }
  }

  return {
    success: true,
    eventId,
    gclid,
    consentBlocked: false,
    duplicate: false,
  };
}

// =============================================================================
// Form Tracking
// =============================================================================

/**
 * Track form interaction start (first focus/input)
 *
 * Only fires once per form per session.
 *
 * @param formId - Form identifier
 *
 * @example
 * // On first input focus
 * input.addEventListener('focus', () => trackFormStart('contact-form'), { once: true });
 */
export function trackFormStart(formId: string): void {
  // Deduplicate per session
  if (trackedFormStarts.has(formId)) return;

  // Check analytics consent (not marketing - this is just engagement tracking)
  if (!hasAnalyticsConsent()) return;

  trackedFormStarts.add(formId);
  pushFormStart(formId);
}

/**
 * Track form submission (without conversion data)
 *
 * Use this for non-lead forms or when conversion tracking is separate.
 *
 * @param formId - Form identifier
 */
export function trackFormSubmit(formId: string): void {
  if (!hasAnalyticsConsent()) return;
  pushFormSubmit(formId);
}

// =============================================================================
// Click Tracking
// =============================================================================

/**
 * Track phone number click
 *
 * Fires as conversion event (phone call = lead)
 *
 * @param phoneNumber - Phone number clicked
 * @returns Tracking result
 */
export function trackPhoneClick(phoneNumber: string): TrackingResult {
  const eventId = generateEventId();
  const gclid = getGclid();

  // Deduplicate
  if (firedConversions.has(`phone:${phoneNumber}`)) {
    return {
      success: false,
      eventId,
      gclid,
      consentBlocked: false,
      duplicate: true,
    };
  }

  if (!hasMarketingConsent()) {
    return {
      success: false,
      eventId,
      gclid,
      consentBlocked: true,
      duplicate: false,
    };
  }

  firedConversions.add(`phone:${phoneNumber}`);
  pushPhoneClick(phoneNumber);

  // Zaraz for Meta
  if (window.zaraz?.track) {
    try {
      window.zaraz.track('Contact', {
        phone: phoneNumber,
        event_id: eventId,
      });
    } catch (error) {
      console.error('[Tracking] Zaraz track error:', error);
    }
  }

  return {
    success: true,
    eventId,
    gclid,
    consentBlocked: false,
    duplicate: false,
  };
}

/**
 * Track CTA button click
 *
 * @param ctaId - CTA identifier
 * @param ctaText - CTA button text
 * @param ctaUrl - Optional destination URL
 */
export function trackCtaClick(ctaId: string, ctaText: string, ctaUrl?: string): void {
  if (!hasAnalyticsConsent()) return;
  pushCtaClick(ctaId, ctaText, ctaUrl);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get all tracking parameters for form hidden fields
 *
 * @returns Object with all tracking params including event ID
 */
export function getFormTrackingData(): Record<string, string> {
  const params = getTrackingParams();

  return {
    gclid: params?.gclid || '',
    gbraid: params?.gbraid || '',
    wbraid: params?.wbraid || '',
    fbclid: params?.fbclid || '',
    utm_source: params?.utm_source || '',
    utm_medium: params?.utm_medium || '',
    utm_campaign: params?.utm_campaign || '',
    utm_content: params?.utm_content || '',
    utm_term: params?.utm_term || '',
    landing_page: params?.landingPage || '',
  };
}

/**
 * Track custom event (consent-aware)
 *
 * @param eventName - Event name
 * @param params - Event parameters
 * @param requireMarketing - Require marketing consent (default: false = analytics only)
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>,
  requireMarketing = false
): void {
  const hasConsent = requireMarketing ? hasMarketingConsent() : hasAnalyticsConsent();
  if (!hasConsent) return;

  pushEvent(eventName, params);
}

/**
 * Check if a conversion has already been tracked
 *
 * @param eventId - Event ID to check
 */
export function isConversionTracked(eventId: string): boolean {
  return firedConversions.has(eventId);
}

/**
 * Clear tracked conversions (for testing)
 * WARNING: Only use in development/testing
 */
export function clearTrackedConversions(): void {
  if (import.meta.env?.DEV) {
    firedConversions.clear();
    trackedFormStarts.clear();
    console.log('[Tracking] Cleared tracked conversions (DEV only)');
  } else {
    console.warn('[Tracking] clearTrackedConversions() only available in DEV mode');
  }
}
