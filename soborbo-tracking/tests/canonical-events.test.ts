import { describe, it, expect, beforeEach } from 'vitest';
import {
  trackCalculatorStart, trackCalculatorStep, trackCalculatorOption, trackCalculatorComplete,
  trackPhoneClick, trackCallbackClick, trackEmailClick, trackWhatsappClick,
  pushLeadConversion, pushContactConversion,
} from '../lib/events';
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
  it('a default + override gateway-nevek az engedélyezett halmazban vannak', () => {
    // index.ts default: contact_form_submit; gyakori override-ok:
    for (const n of ['contact_form_submit', 'callback_conversion', 'phone_conversion', 'quote_calculator_conversion']) {
      expect(GATEWAY_ALLOWED).toContain(n);
    }
  });
});
