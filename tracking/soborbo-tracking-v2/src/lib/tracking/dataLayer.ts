/**
 * GTM DataLayer Events
 * Google Ads Enhanced Conversions + GA4
 * 
 * FONTOS: Csak consent után hívd a pushConversion()-t!
 */

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

export interface UserData {
  email: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
}

export interface ConversionParams {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  value?: number;
  currency?: string;
  transactionId?: string;
  gclid?: string;
}

/**
 * Email normalizálás
 * GTM hash-eli, de tisztán és kisbetűsen kell küldeni
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Telefon normalizálás - CSAK alapvető tisztítás
 * 
 * Nem próbálunk E.164-et csinálni client-side-on,
 * mert túl sok edge case van. A backend csinálja rendesen.
 */
function normalizePhone(phone: string): string {
  // Csak számok, + jel és kötőjel megtartása
  // A backend (vagy Google/Meta) majd normalizálja E.164-re
  return phone.replace(/[^\d+\-]/g, '').trim();
}

/**
 * Conversion event küldése GTM-nek
 * 
 * ⚠️ CONSENT REQUIRED: Csak marketing consent után hívd!
 */
export function pushConversion(params: ConversionParams): void {
  window.dataLayer = window.dataLayer || [];
  
  const userData: UserData = {
    email: normalizeEmail(params.email),
  };
  
  if (params.phone && params.phone.length >= 8) {
    userData.phone_number = normalizePhone(params.phone);
  }
  
  if (params.firstName) {
    userData.first_name = params.firstName.trim();
  }
  
  if (params.lastName) {
    userData.last_name = params.lastName.trim();
  }
  
  const eventData: Record<string, unknown> = {
    event: 'calculator_conversion',
    user_provided_data: userData,
  };
  
  if (params.value && params.value > 0) {
    eventData.value = params.value;
    eventData.currency = params.currency || 'GBP';
  }
  
  if (params.transactionId) {
    eventData.transaction_id = params.transactionId;
  }
  
  if (params.gclid) {
    eventData.gclid = params.gclid;
  }
  
  window.dataLayer.push(eventData);
}

/**
 * Calculator step event (analytics only, no PII)
 */
export function pushStepEvent(stepId: string, stepIndex: number): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'calculator_step',
    step: stepId,
    stepIndex: stepIndex,
  });
}

/**
 * Option selected event (analytics only, no PII)
 */
export function pushOptionEvent(stepId: string, value: string | string[]): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'calculator_option',
    step: stepId,
    value: Array.isArray(value) ? value.join(',') : value,
  });
}
