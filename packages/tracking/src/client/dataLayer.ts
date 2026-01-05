/**
 * @leadgen/tracking - DataLayer Module
 *
 * GTM dataLayer event pushing with Enhanced Conversions support.
 * CLIENT-ONLY - Do not import in server context.
 */

import type { UserProvidedData, ConversionDataLayerEvent, DataLayerEvent } from '../types';

// =============================================================================
// Browser Guard
// =============================================================================

if (typeof window === 'undefined') {
  throw new Error('@leadgen/tracking/client/dataLayer can only be used in browser');
}

// =============================================================================
// DataLayer Initialization
// =============================================================================

/**
 * Ensure dataLayer exists
 */
function ensureDataLayer(): DataLayerEvent[] {
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

// =============================================================================
// Data Normalization
// =============================================================================

/**
 * Normalize email for Enhanced Conversions
 * - Trim whitespace
 * - Convert to lowercase
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Normalize phone number for Enhanced Conversions
 * - Keep only digits and leading +
 * - Remove spaces, dashes, parentheses
 */
function normalizePhone(phone: string): string {
  // Keep + at start if present, then only digits
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Normalize name (trim, capitalize first letter)
 */
function normalizeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

// =============================================================================
// Event Pushing
// =============================================================================

/**
 * Push a generic event to dataLayer
 *
 * @param eventName - Event name (e.g., 'page_view', 'cta_click')
 * @param params - Additional event parameters
 *
 * @example
 * pushEvent('cta_click', {
 *   cta_id: 'hero-cta',
 *   cta_text: 'Get Free Quote'
 * });
 */
export function pushEvent(eventName: string, params?: Record<string, unknown>): void {
  const dataLayer = ensureDataLayer();

  dataLayer.push({
    event: eventName,
    ...params,
  });
}

/**
 * Push page view event
 *
 * @param pagePath - Page path (defaults to current path)
 * @param pageTitle - Page title (defaults to document.title)
 *
 * @example
 * pushPageView();
 * pushPageView('/services/removals', 'Removal Services');
 */
export function pushPageView(pagePath?: string, pageTitle?: string): void {
  pushEvent('page_view', {
    page_path: pagePath || window.location.pathname,
    page_title: pageTitle || document.title,
    page_location: window.location.href,
  });
}

/**
 * Push conversion event with Enhanced Conversions data
 *
 * @param params - Conversion parameters including user data
 *
 * @example
 * pushConversion({
 *   email: 'user@example.com',
 *   phone: '+441234567890',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   value: 150,
 *   currency: 'GBP',
 *   transactionId: 'uuid-here'
 * });
 */
export function pushConversion(params: {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  value?: number;
  currency?: string;
  transactionId: string;
  formId?: string;
}): void {
  const dataLayer = ensureDataLayer();

  // Build user provided data (Enhanced Conversions)
  const userProvidedData: UserProvidedData = {
    email: normalizeEmail(params.email),
  };

  if (params.phone) {
    userProvidedData.phone_number = normalizePhone(params.phone);
  }

  if (params.firstName) {
    userProvidedData.first_name = normalizeName(params.firstName);
  }

  if (params.lastName) {
    userProvidedData.last_name = normalizeName(params.lastName);
  }

  // Build conversion event
  const conversionEvent: ConversionDataLayerEvent = {
    event: 'conversion',
    transaction_id: params.transactionId,
    user_provided_data: userProvidedData,
  };

  if (params.value !== undefined) {
    conversionEvent.value = params.value;
  }

  if (params.currency) {
    conversionEvent.currency = params.currency;
  }

  if (params.formId) {
    conversionEvent.form_id = params.formId;
  }

  dataLayer.push(conversionEvent as unknown as DataLayerEvent);
}

/**
 * Push form start event (first interaction)
 *
 * @param formId - Form identifier
 */
export function pushFormStart(formId: string): void {
  pushEvent('form_start', {
    form_id: formId,
  });
}

/**
 * Push form submit event (without conversion data)
 *
 * @param formId - Form identifier
 */
export function pushFormSubmit(formId: string): void {
  pushEvent('form_submit', {
    form_id: formId,
  });
}

/**
 * Push phone click event
 *
 * @param phoneNumber - Phone number clicked
 */
export function pushPhoneClick(phoneNumber: string): void {
  pushEvent('phone_click', {
    phone_number: normalizePhone(phoneNumber),
    link_url: `tel:${normalizePhone(phoneNumber)}`,
  });
}

/**
 * Push email click event
 *
 * @param email - Email address clicked
 */
export function pushEmailClick(email: string): void {
  pushEvent('email_click', {
    email_address: normalizeEmail(email),
    link_url: `mailto:${normalizeEmail(email)}`,
  });
}

/**
 * Push CTA click event
 *
 * @param ctaId - CTA identifier
 * @param ctaText - CTA button text
 * @param ctaUrl - CTA destination URL (optional)
 */
export function pushCtaClick(ctaId: string, ctaText: string, ctaUrl?: string): void {
  pushEvent('cta_click', {
    cta_id: ctaId,
    cta_text: ctaText,
    ...(ctaUrl && { link_url: ctaUrl }),
  });
}

/**
 * Push scroll depth event
 *
 * @param percent - Scroll depth percentage (25, 50, 75, 100)
 */
export function pushScrollDepth(percent: number): void {
  pushEvent('scroll_depth', {
    percent_scrolled: percent,
  });
}

/**
 * Push video event
 *
 * @param action - Video action (play, pause, complete, progress)
 * @param videoTitle - Video title
 * @param videoPercent - Video progress percentage (for progress events)
 */
export function pushVideoEvent(
  action: 'play' | 'pause' | 'complete' | 'progress',
  videoTitle: string,
  videoPercent?: number
): void {
  pushEvent(`video_${action}`, {
    video_title: videoTitle,
    ...(videoPercent !== undefined && { video_percent: videoPercent }),
  });
}

/**
 * Push outbound link click event
 *
 * @param url - Destination URL
 * @param linkText - Link text
 */
export function pushOutboundClick(url: string, linkText?: string): void {
  pushEvent('outbound_click', {
    link_url: url,
    link_text: linkText,
    outbound: true,
  });
}

/**
 * Get current dataLayer contents (for debugging)
 */
export function getDataLayer(): DataLayerEvent[] {
  return window.dataLayer || [];
}
