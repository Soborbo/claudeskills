import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateEventId, trackCalculatorStart, trackCalculatorStep, trackCalculatorComplete,
  trackPhoneClick, trackCallbackClick, trackEmailClick, trackWhatsappClick,
  pushLeadConversion, pushContactConversion,
  setUserDataForEC, clearUserDataForEC, USER_DATA_ELEMENT_ID,
} from '../lib/events';
import { setCkyConsent, resetAll, getDataLayer, lastEvent } from './helpers';

function readSideChannel(): Record<string, string> | undefined {
  return (window as unknown as { __sbUserData?: Record<string, string> }).__sbUserData;
}

beforeEach(() => {
  resetAll();
  setCkyConsent({ analytics: true, marketing: true });
});

describe('generateEventId', () => {
  it('produces a non-empty unique-ish id', () => {
    const a = generateEventId(), b = generateEventId();
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
  });
});

describe('calculator events → dataLayer', () => {
  it('pushes calculator_start / step / complete', () => {
    trackCalculatorStart('quote-calc');
    expect(lastEvent('calculator_start')?.calculator_name).toBe('quote-calc');
    trackCalculatorStep('size', 2, 8);
    const step = lastEvent('calculator_step');
    expect(step?.step_id).toBe('size');
    expect(step?.step_index).toBe(2);
    expect(step?.total_steps).toBe(8);
    trackCalculatorComplete('quote-calc');
    expect(lastEvent('calculator_complete')).toBeTruthy();
  });

  it('does NOTHING without analytics consent', () => {
    setCkyConsent({ analytics: false, marketing: false });
    trackCalculatorStart('x');
    expect(getDataLayer()).toHaveLength(0);
  });
});

describe('click events — dedup + consent', () => {
  it('phone_click fires once per session (dedup)', () => {
    trackPhoneClick();
    trackPhoneClick();
    const count = getDataLayer().filter((e) => e.event === 'phone_click').length;
    expect(count).toBe(1);
  });
  it('callback_click is NOT deduped (asymmetric by design)', () => {
    trackCallbackClick();
    trackCallbackClick();
    const count = getDataLayer().filter((e) => e.event === 'callback_click').length;
    expect(count).toBe(2);
  });
  it('phone_click blocked without analytics consent', () => {
    setCkyConsent({ analytics: false, marketing: false });
    trackPhoneClick();
    expect(getDataLayer()).toHaveLength(0);
  });
});

describe('conversion events → dataLayer', () => {
  it('lead_submit carries event_id + value (when >0) + currency, NO PII', () => {
    pushLeadConversion({ email: 'a@b.com', phone: '07123456789', value: 380, currency: 'GBP', eventId: 'E1' });
    const e = lastEvent('lead_submit')!;
    expect(e.event_id).toBe('E1');
    expect(e.value).toBe(380);
    expect(e.currency).toBe('GBP');
    // GDPR: NO raw PII anywhere in the dataLayer payload.
    expect(e.user_provided_data).toBeUndefined();
    expect(e.email).toBeUndefined();
    expect(e.phone_number).toBeUndefined();
    expect(JSON.stringify(e)).not.toContain('a@b.com');
    expect(JSON.stringify(e)).not.toContain('+447123456789');
  });

  it('writes normalized PII to the hidden side-channel (not the dataLayer)', () => {
    pushLeadConversion({ email: 'A@B.com', phone: '07123456789', firstName: 'Jo', eventId: 'E1b' });
    const ud = readSideChannel()!;
    expect(ud.email).toBe('a@b.com');
    expect(ud.phone_number).toBe('+447123456789');
    expect(ud.first_name).toBe('Jo');
    // Also mirrored to the hidden DOM element for the GTM Custom JS variable.
    const el = document.getElementById(USER_DATA_ELEMENT_ID)!;
    expect(el.hidden).toBe(true);
    expect(JSON.parse(el.textContent!).email).toBe('a@b.com');
  });

  it('omits value when 0 (no Smart Bidding poisoning)', () => {
    pushLeadConversion({ email: 'a@b.com', value: 0, currency: 'GBP', eventId: 'E2' });
    expect(lastEvent('lead_submit')!.value).toBeUndefined();
  });

  it('contact_submit event name', () => {
    pushContactConversion({ email: 'a@b.com', eventId: 'E3' });
    expect(lastEvent('contact_submit')!.event_id).toBe('E3');
  });
});

describe('setUserDataForEC — marketing-consent gated side-channel', () => {
  it('writes nothing without marketing consent', () => {
    setCkyConsent({ analytics: true, marketing: false });
    setUserDataForEC({ email: 'a@b.com' });
    expect(readSideChannel()).toBeUndefined();
    expect(document.getElementById(USER_DATA_ELEMENT_ID)).toBeNull();
  });

  it('the conversion path writes nothing to the side-channel without marketing consent', () => {
    setCkyConsent({ analytics: true, marketing: false });
    // pushLeadConversion is reachable directly; without marketing consent the
    // EC side-channel must stay empty even though the dataLayer (analytics) push runs.
    pushLeadConversion({ email: 'a@b.com', phone: '07123456789', eventId: 'E4' });
    expect(readSideChannel()).toBeUndefined();
  });

  it('clearUserDataForEC wipes the window object and the hidden element', () => {
    setUserDataForEC({ email: 'a@b.com' });
    expect(readSideChannel()).toBeTruthy();
    clearUserDataForEC();
    expect(readSideChannel()).toBeUndefined();
    expect(document.getElementById(USER_DATA_ELEMENT_ID)).toBeNull();
  });
});

describe('click events carry the shared event_id', () => {
  it('phone/callback/email/whatsapp push event_id into the dataLayer', () => {
    expect(trackPhoneClick('P1')).toBe(true);
    expect(lastEvent('phone_click')!.event_id).toBe('P1');
    expect(trackCallbackClick('C1')).toBe(true);
    expect(lastEvent('callback_click')!.event_id).toBe('C1');
    expect(trackEmailClick('M1')).toBe(true);
    expect(lastEvent('email_click')!.event_id).toBe('M1');
    expect(trackWhatsappClick('W1')).toBe(true);
    expect(lastEvent('whatsapp_click')!.event_id).toBe('W1');
  });

  it('phone_click returns false on the deduped second call', () => {
    expect(trackPhoneClick('P1')).toBe(true);
    expect(trackPhoneClick('P2')).toBe(false);
  });

  it('click trackers return false without analytics consent', () => {
    setCkyConsent({ analytics: false, marketing: false });
    expect(trackEmailClick('M1')).toBe(false);
    expect(trackWhatsappClick('W1')).toBe(false);
  });
});
