import { describe, it, expect, beforeEach } from 'vitest';
import {
  trackCalculatorStart, trackCalculatorStep, trackCalculatorOption, trackCalculatorComplete,
  trackPhoneClick, trackCallbackClick, trackEmailClick, trackWhatsappClick,
  pushLeadConversion, pushContactConversion,
} from '../lib/events';
import { CLICK_GATEWAY_EVENT, DEFAULT_GATEWAY_EVENT } from '../lib/index';
import { setCkyConsent, resetAll, getDataLayer } from './helpers';

// A CANONICAL-EVENTS.md mérvadó listái — ha a kód eltér, ez a teszt elbukik.
const BROWSER_EVENTS = [
  'calculator_start', 'calculator_step', 'calculator_option', 'calculator_complete',
  'lead_submit', 'contact_submit', 'phone_click', 'callback_click',
  'email_click', 'whatsapp_click', 'form_abandon', 'scroll_depth',
];
const GATEWAY_ALLOWED = [
  'quote_calculator_conversion', 'callback_conversion', 'contact_form_submit',
  'phone_conversion', 'email_conversion', 'whatsapp_conversion',
  'quote_calculator_first_view', 'video_play',
];

beforeEach(() => {
  resetAll();
  setCkyConsent({ analytics: true, marketing: true });
});

describe('contract — böngésző dataLayer event-nevek', () => {
  it('minden tracker a dokumentált nevet emittálja', () => {
    trackCalculatorStart('c');
    trackCalculatorStep('s', 1);
    trackCalculatorOption('s', 'v');
    trackCalculatorComplete('c');
    pushLeadConversion({ email: 'a@b.com', eventId: 'E1' });
    pushContactConversion({ email: 'a@b.com', eventId: 'E2' });
    trackPhoneClick();
    trackCallbackClick();
    trackEmailClick();
    trackWhatsappClick();

    const emitted = new Set(getDataLayer().map((e) => e.event as string));
    for (const name of ['calculator_start', 'calculator_step', 'calculator_option', 'calculator_complete',
      'lead_submit', 'contact_submit', 'phone_click', 'callback_click', 'email_click', 'whatsapp_click']) {
      expect(emitted.has(name)).toBe(true);
    }
    // egyik emittált név sincs a dokumentált listán kívül
    for (const name of emitted) expect(BROWSER_EVENTS).toContain(name);
  });
});

describe('contract — gateway allowed event-nevek', () => {
  it('a kód VALÓDI gateway-nevei mind az engedélyezett halmazban vannak', () => {
    // Assert against the REAL maps the code dispatches with (imported from index.ts),
    // not a local copy — so a code change to a non-allowed name fails this test.
    const used = [DEFAULT_GATEWAY_EVENT, ...Object.values(CLICK_GATEWAY_EVENT)];
    for (const n of used) {
      expect(GATEWAY_ALLOWED).toContain(n);
    }
    // sanity: the click map covers all four click conversions
    expect(Object.values(CLICK_GATEWAY_EVENT).sort()).toEqual(
      ['callback_conversion', 'email_conversion', 'phone_conversion', 'whatsapp_conversion'],
    );
  });
});
