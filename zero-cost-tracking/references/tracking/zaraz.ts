/**
 * Zero-Cost Tracking v2 - Zaraz (Meta CAPI)
 *
 * Cloudflare Zaraz integration for server-side Meta tracking.
 * Access Token is configured in Zaraz dashboard - NEVER in code!
 */

import { getSiteCurrency } from './constants';

// =============================================================================
// Types
// =============================================================================

declare global {
  interface Window {
    zaraz?: {
      track: (eventName: string, properties?: Record<string, unknown>) => void;
      set: (key: string, value: unknown) => void;
    };
  }
}

// =============================================================================
// Zaraz Availability
// =============================================================================

/**
 * Check if Zaraz is available
 */
export function isZarazAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.zaraz?.track === 'function';
}

// =============================================================================
// Meta Events
// =============================================================================

export interface MetaLeadParams {
  email: string;
  phone?: string;
  value?: number;
  currency?: string;
  eventId?: string;
}

/**
 * Track Lead event via Zaraz → Meta CAPI
 *
 * Maps to Meta's standard 'Lead' event.
 * Used for: quote_request, callback_request, contact_form, phone_click
 */
export function trackMetaLead(params: MetaLeadParams): boolean {
  if (!isZarazAvailable()) {
    console.debug('[Tracking] Zaraz not available - skipping Meta track');
    return false;
  }

  try {
    window.zaraz!.track('Lead', {
      // Meta standard params
      em: params.email.trim().toLowerCase(), // email (hashed by Zaraz)
      ph: params.phone || undefined, // phone (hashed by Zaraz)
      value: params.value || 0,
      currency: params.currency || getSiteCurrency(),

      // Deduplication
      event_id: params.eventId,
    });

    return true;
  } catch (error) {
    console.error('[Tracking] Zaraz track error:', error);
    return false;
  }
}

/**
 * Track Contact event (for phone clicks)
 */
export function trackMetaContact(phone: string, eventId?: string): boolean {
  if (!isZarazAvailable()) return false;

  try {
    window.zaraz!.track('Contact', {
      ph: phone,
      event_id: eventId,
    });
    return true;
  } catch (error) {
    console.error('[Tracking] Zaraz track error:', error);
    return false;
  }
}

/**
 * Set user data in Zaraz for enhanced matching
 * Call this when user provides email/phone (even before conversion)
 */
export function setZarazUserData(email?: string, phone?: string): void {
  if (!isZarazAvailable()) return;

  try {
    if (email) {
      window.zaraz!.set('em', email.trim().toLowerCase());
    }
    if (phone) {
      window.zaraz!.set('ph', phone);
    }
  } catch (error) {
    console.error('[Tracking] Zaraz set error:', error);
  }
}
