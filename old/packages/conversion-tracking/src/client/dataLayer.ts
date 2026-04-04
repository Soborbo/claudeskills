/**
 * @leadgen/conversion-tracking - DataLayer Events
 */

import type { DataLayerEvent } from '../types';
import { TRACKING_VERSION, EVENT_NAMES, DEVICE_BREAKPOINTS, getSiteCurrency, log } from './constants';
import { getOrCreateSessionId } from './session';
import { buildAttributionForDataLayer } from './params';

function ensureDataLayer(): DataLayerEvent[] {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
  }
  return window.dataLayer;
}

export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < DEVICE_BREAKPOINTS.MOBILE) return 'mobile';
  if (width < DEVICE_BREAKPOINTS.TABLET) return 'tablet';
  return 'desktop';
}

function getPageUrl(): string {
  if (typeof window === 'undefined') return '';
  return window.location.pathname + window.location.search;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

function pushEvent(eventName: string, params: Record<string, unknown> = {}): void {
  const dataLayer = ensureDataLayer();
  const event = {
    event: eventName,
    tracking_version: TRACKING_VERSION,
    session_id: getOrCreateSessionId(),
    page_url: getPageUrl(),
    device: getDeviceType(),
    ...params,
  };
  dataLayer.push(event);
  log('Event pushed:', eventName, event);
}

// =============================================================================
// Phone Click
// =============================================================================

export function pushPhoneClick(value?: number, currency?: string): void {
  pushEvent(EVENT_NAMES.PHONE_CLICK, {
    value: value || 0,
    currency: currency || getSiteCurrency(),
  });
}

// =============================================================================
// Conversion Events (with attribution)
// =============================================================================

export interface ConversionEventParams {
  leadId: string;
  email: string;
  phone?: string;
  value?: number;
  currency?: string;
}

function pushConversionEvent(eventName: string, params: ConversionEventParams): void {
  const attribution = buildAttributionForDataLayer();

  pushEvent(eventName, {
    lead_id: params.leadId,
    user_email: normalizeEmail(params.email),
    user_phone: params.phone ? normalizePhone(params.phone) : undefined,
    value: params.value || 0,
    currency: params.currency || getSiteCurrency(),
    ...attribution,
  });
}

export function pushQuoteRequest(params: ConversionEventParams): void {
  pushConversionEvent(EVENT_NAMES.QUOTE_REQUEST, params);
}

export function pushCallbackRequest(params: ConversionEventParams): void {
  pushConversionEvent(EVENT_NAMES.CALLBACK_REQUEST, params);
}

export function pushContactForm(params: ConversionEventParams): void {
  pushConversionEvent(EVENT_NAMES.CONTACT_FORM, params);
}

// =============================================================================
// Calculator Events
// =============================================================================

export function pushCalculatorStart(): void {
  pushEvent(EVENT_NAMES.CALCULATOR_START);
}

export function pushCalculatorStep(step: number): void {
  pushEvent(EVENT_NAMES.CALCULATOR_STEP, { step });
}

export function pushCalculatorOption(field: string, value: string): void {
  pushEvent(EVENT_NAMES.CALCULATOR_OPTION, { field, value });
}

// =============================================================================
// Form Abandonment
// =============================================================================

export function pushFormAbandon(formId: string, lastField: string): void {
  pushEvent(EVENT_NAMES.FORM_ABANDON, { form_id: formId, last_field: lastField });
}

// =============================================================================
// Debug
// =============================================================================

export function getDataLayer(): DataLayerEvent[] {
  if (typeof window === 'undefined') return [];
  return window.dataLayer || [];
}
