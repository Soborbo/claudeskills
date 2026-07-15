import { describe, it, expect, beforeEach } from 'vitest';
import {
  trackCalculatorStart, trackCalculatorStep, trackCalculatorOption, trackCalculatorComplete,
  trackPhoneClick, trackCallbackClick, trackEmailClick, trackWhatsappClick,
  pushLeadConversion, pushContactConversion,
} from '../lib/events';
import { CLICK_GATEWAY_EVENT } from '../lib/index';
import { BROWSER_GATEWAY_EVENTS } from '../lib/event-contract';
import { setCkyConsent, resetAll, getDataLayer } from './helpers';

// The authoritative browser dataLayer vocabulary (CANONICAL-EVENTS.md) — if the
// code drifts, this test fails.
const BROWSER_EVENTS = [
  'quote_calculator_opened', 'quote_calculator_step_completed', 'quote_calculator_option_selected', 'quote_calculator_submitted',
  'contact_form_submitted', 'phone_number_clicked', 'callback_request_submitted',
  'email_address_clicked', 'whatsapp_button_clicked', 'form_abandoned', 'scroll_depth',
];

beforeEach(() => {
  resetAll();
  setCkyConsent({ analytics: true, marketing: true });
});

describe('contract — browser dataLayer event names', () => {
  it('every tracker emits the documented name', () => {
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
    for (const name of ['quote_calculator_opened', 'quote_calculator_step_completed', 'quote_calculator_option_selected', 'quote_calculator_submitted',
      'contact_form_submitted', 'phone_number_clicked', 'callback_request_submitted', 'email_address_clicked', 'whatsapp_button_clicked']) {
      expect(emitted.has(name)).toBe(true);
    }
    // no emitted name falls outside the documented list
    for (const name of emitted) expect(BROWSER_EVENTS).toContain(name);
  });
});

describe('contract — gateway event names the code actually dispatches', () => {
  it('every REAL browser gateway name is in the browser-path allow-list (from events.json)', () => {
    // Assert against the REAL map the code dispatches with (imported from index.ts),
    // not a local copy — so a code change to a non-allowed name fails this test.
    // The allow-list itself is derived from events.json (see event-contract.test.ts),
    // closing the chain: engine events.json → event-contract.ts → CLICK_GATEWAY_EVENT.
    const used: string[] = Object.values(CLICK_GATEWAY_EVENT).filter((n) => n !== null);
    for (const n of used) {
      expect(BROWSER_GATEWAY_EVENTS.has(n), n).toBe(true);
    }
    // sanity: phone/email/whatsapp dispatch, callback is dataLayer-only (server-ingress-only)
    expect(used.sort()).toEqual(['email_address_clicked', 'phone_number_clicked', 'whatsapp_button_clicked']);
    expect(CLICK_GATEWAY_EVENT.callback).toBeNull();
  });
});
