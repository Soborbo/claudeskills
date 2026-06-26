import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the gateway transport so we can inspect EXACTLY what the server would receive,
// and simulate slow/failed workers — events.ts runs for real (true end-to-end browser side).
vi.mock('../lib/gateway', () => ({
  sendToWorker: vi.fn(() => Promise.resolve(true)),
  getTurnstileToken: vi.fn(() => Promise.resolve('TOK')),
  collectAttribution: vi.fn(() => ({})),
  prewarmTurnstile: vi.fn(),
}));

import {
  trackLeadSubmit, trackContactSubmit, trackServerEvent,
  trackCalculatorStart, trackCalculatorStep, trackCalculatorOption, trackCalculatorComplete,
} from '../lib/index';
import { sendToWorker } from '../lib/gateway';
import { setCkyConsent, resetAll, lastEvent } from './helpers';

const mockSend = sendToWorker as unknown as ReturnType<typeof vi.fn>;

function sideChannel(): Record<string, string> | undefined {
  return (window as unknown as { __sbUserData?: Record<string, string> }).__sbUserData;
}

beforeEach(() => {
  resetAll();
  mockSend.mockReset();
  mockSend.mockImplementation(() => Promise.resolve(true));
  setCkyConsent({ analytics: true, marketing: true });
});

describe('lead journey — flows through both channels in the right shape', () => {
  it('lead submit: side-channel PII + PII-free dataLayer + gateway payload, one shared event_id', () => {
    const r = trackLeadSubmit({
      email: 'A@B.com', phone: '07123456789', firstName: 'Jo', lastName: 'Smith',
      value: 380, currency: 'GBP',
    });
    expect(r.success).toBe(true);

    // browser channel (dataLayer) — no PII, has the id/value/currency
    const dl = lastEvent('lead_submit')!;
    expect(dl.event_id).toBe(r.eventId);
    expect(dl.value).toBe(380);
    expect(dl.currency).toBe('GBP');
    expect(JSON.stringify(dl)).not.toContain('A@B.com');

    // side-channel — normalized PII for Enhanced Conversions
    expect(sideChannel()).toMatchObject({ email: 'a@b.com', phone_number: '+447123456789' });

    // server channel (gateway) — exact contract the worker consumes
    expect(mockSend).toHaveBeenCalledOnce();
    const p = mockSend.mock.calls[0][0];
    expect(p.event_name).toBe('contact_form_submit');
    expect(p.event_id).toBe(r.eventId);               // SAME id → Meta dedup
    expect(Number.isInteger(p.event_time)).toBe(true); // unix SECONDS, not ms
    expect(p.event_time).toBeGreaterThan(1_000_000_000);
    expect(p.event_time).toBeLessThan(100_000_000_000);
    expect(p.value).toBe(380);
    expect(p.currency).toBe('GBP');
    // raw PII for the gateway to hash server-side (Meta CAPI contract)
    expect(p.user_data).toEqual({
      email: 'A@B.com', phone_number: '07123456789', first_name: 'Jo', last_name: 'Smith',
    });
  });

  it('calculator funnel runs start→step→option→complete, then the conversion reaches the gateway', () => {
    trackCalculatorStart('quote-calc');
    trackCalculatorStep('size', 1, 4);
    trackCalculatorOption('size', '3-bed');
    trackCalculatorComplete('quote-calc');
    for (const e of ['calculator_start', 'calculator_step', 'calculator_option', 'calculator_complete']) {
      expect(lastEvent(e)).toBeTruthy();
    }
    const id = trackServerEvent('quote_calculator_conversion', { value: 1200, currency: 'GBP' });
    const p = mockSend.mock.calls.at(-1)![0];
    expect(p.event_name).toBe('quote_calculator_conversion');
    expect(p.event_id).toBe(id);
    expect(p.value).toBe(1200);
  });

  it('contact submit maps to contact_form_submit with the shared id', () => {
    const r = trackContactSubmit({ email: 'a@b.com', phone: '0620123456' });
    expect(lastEvent('contact_submit')!.event_id).toBe(r.eventId);
    expect(mockSend.mock.calls[0][0].event_name).toBe('contact_form_submit');
  });
});

describe('the lead never gets stuck', () => {
  it('a hanging worker does NOT block the conversion (fire-and-forget)', () => {
    // Worker promise never resolves — simulates a dead/slow gateway.
    mockSend.mockImplementation(() => new Promise<boolean>(() => { /* never resolves */ }));
    const r = trackLeadSubmit({ email: 'a@b.com', value: 100, currency: 'GBP' });
    // Returns synchronously with success; the browser event is already in the dataLayer.
    expect(r.success).toBe(true);
    expect(lastEvent('lead_submit')).toBeTruthy();
    expect(mockSend).toHaveBeenCalledOnce();
  });

  it('a rejecting worker does NOT throw out of the conversion path', () => {
    mockSend.mockImplementation(() => Promise.reject(new Error('boom')));
    expect(() => trackLeadSubmit({ email: 'a@b.com', value: 100 })).not.toThrow();
    expect(lastEvent('lead_submit')).toBeTruthy();
  });

  it('value 0 is omitted from the dataLayer (no Smart Bidding poisoning) but the event still fires', () => {
    const r = trackLeadSubmit({ email: 'a@b.com', value: 0, currency: 'GBP' });
    expect(r.success).toBe(true);
    expect(lastEvent('lead_submit')!.value).toBeUndefined();
  });
});
