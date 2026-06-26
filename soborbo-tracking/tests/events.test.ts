import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateEventId, trackCalculatorStart, trackCalculatorStep, trackCalculatorComplete,
  trackPhoneClick, trackCallbackClick, pushLeadConversion, pushContactConversion,
} from '../lib/events';
import { setCkyConsent, resetAll, getDataLayer, lastEvent } from './helpers';

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
  it('lead_submit carries event_id + value (when >0) + currency', () => {
    pushLeadConversion({ email: 'a@b.com', phone: '07123456789', value: 380, currency: 'GBP', eventId: 'E1' });
    const e = lastEvent('lead_submit')!;
    expect(e.event_id).toBe('E1');
    expect(e.value).toBe(380);
    expect(e.currency).toBe('GBP');
    // PII a user_provided_data alatt (GTM Enhanced Conversions), nem sima kulcson
    const upd = e.user_provided_data as Record<string, string>;
    expect(upd.email).toBe('a@b.com');
    expect(upd.phone_number).toBe('+447123456789');
    expect(e.email).toBeUndefined();
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
