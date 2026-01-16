/**
 * @leadgen/conversion-tracking - Constants
 */

export const TRACKING_VERSION = 'v2.0';

export const STORAGE_KEYS = {
  FIRST_TOUCH: 'lg_first_touch',
  LAST_TOUCH: 'lg_last_touch',
  SESSION: 'lg_session',
  LEAD_QUEUE: 'lg_lead_queue',
} as const;

export const EVENT_NAMES = {
  PHONE_CLICK: 'phone_click',
  CALLBACK_REQUEST: 'callback_request',
  QUOTE_REQUEST: 'quote_request',
  CONTACT_FORM: 'contact_form',
  CALCULATOR_START: 'calculator_start',
  CALCULATOR_STEP: 'calculator_step',
  CALCULATOR_OPTION: 'calculator_option',
  FORM_ABANDON: 'form_abandon',
} as const;

export const TRACKING_PARAMS = [
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

export const DEVICE_BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
} as const;

export function getConfig() {
  if (typeof window !== 'undefined' && window.__TRACKING_CONFIG__) {
    return window.__TRACKING_CONFIG__;
  }
  return {
    gtmId: '',
    currency: 'GBP',
    sessionTimeoutMinutes: 30,
    debug: false,
  };
}

export function getSiteCurrency(): string {
  return getConfig().currency;
}

export function getSessionTimeoutMs(): number {
  return getConfig().sessionTimeoutMinutes * 60 * 1000;
}

export function isDebug(): boolean {
  return getConfig().debug;
}

export function log(...args: unknown[]): void {
  if (isDebug()) {
    console.log('[Tracking]', ...args);
  }
}
