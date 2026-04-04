/**
 * @leadgen/conversion-tracking - Zaraz (Meta CAPI)
 *
 * Access Token is in Zaraz dashboard - NEVER in code!
 */

import { getSiteCurrency, log } from './constants';
import { hasMarketingConsent } from './consent';

export function isZarazAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.zaraz?.track === 'function';
}

/**
 * Normalize phone for Meta CAPI
 * Meta requires E.164 format: +[country][number] with only digits
 */
function normalizePhone(phone: string): string {
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

export interface MetaLeadParams {
  email: string;
  phone?: string;
  value?: number;
  currency?: string;
  eventId?: string;
}

export function trackMetaLead(params: MetaLeadParams): boolean {
  // Enforce consent at the sending layer (GDPR)
  if (!hasMarketingConsent()) {
    log('No marketing consent - Meta Lead tracking blocked');
    return false;
  }

  if (!isZarazAvailable()) {
    log('Zaraz not available - skipping Meta track');
    return false;
  }

  try {
    window.zaraz!.track('Lead', {
      em: params.email.trim().toLowerCase(),
      ph: params.phone ? normalizePhone(params.phone) : undefined,
      value: params.value || 0,
      currency: params.currency || getSiteCurrency(),
      event_id: params.eventId,
    });
    log('Zaraz Lead tracked');
    return true;
  } catch (error) {
    console.error('[Tracking] Zaraz error:', error);
    return false;
  }
}

export function trackMetaContact(phone: string, eventId?: string): boolean {
  // Enforce consent at the sending layer (GDPR)
  if (!hasMarketingConsent()) {
    log('No marketing consent - Meta Contact tracking blocked');
    return false;
  }

  if (!isZarazAvailable()) return false;

  try {
    window.zaraz!.track('Contact', { ph: normalizePhone(phone), event_id: eventId });
    return true;
  } catch {
    return false;
  }
}

export function setZarazUserData(email?: string, phone?: string): void {
  if (!isZarazAvailable()) return;

  try {
    if (email) window.zaraz!.set('em', email.trim().toLowerCase());
    if (phone) window.zaraz!.set('ph', normalizePhone(phone));
  } catch {}
}
