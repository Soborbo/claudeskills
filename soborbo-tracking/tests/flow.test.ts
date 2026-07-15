import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the gateway transport so we can inspect EXACTLY what the server would receive,
// and simulate slow/failed workers — events.ts runs for real (true end-to-end browser side).
vi.mock('../lib/gateway', () => ({
  sendToWorker: vi.fn(() => Promise.resolve(true)),
  collectAttribution: vi.fn(() => ({})),
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

describe('lead journey — browser leg + hidden-field handoff to the backend', () => {
  it('lead submit: side-channel PII + PII-free dataLayer + eventId for the backend, NO browser gateway leg', () => {
    const r = trackLeadSubmit({
      email: 'A@B.com', phone: '07123456789', firstName: 'Jo', lastName: 'Smith',
      value: 380, currency: 'GBP',
    });
    expect(r.success).toBe(true);

    // browser channel (dataLayer) — no PII, has the id/value/currency
    const dl = lastEvent('quote_calculator_submitted')!;
    expect(dl.event_id).toBe(r.eventId);
    expect(dl.value).toBe(380);
    expect(dl.currency).toBe('GBP');
    expect(JSON.stringify(dl)).not.toContain('A@B.com');

    // side-channel — normalized PII for Enhanced Conversions
    expect(sideChannel()).toMatchObject({ email: 'a@b.com', phone_number: '+447123456789' });

    // server channel: NOT from the browser. quote_calculator_submitted is
    // server-ingress-only — the backend dispatches it with r.eventId (the
    // event_id hidden field). A dispatch here would be 403'd by the gateway.
    expect(mockSend).not.toHaveBeenCalled();
    // …and the eventId the backend must reuse is a real UUID.
    expect(r.eventId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('calculator funnel runs start→step→option→complete in the dataLayer', () => {
    trackCalculatorStart('quote-calc');
    trackCalculatorStep('size', 1, 4);
    trackCalculatorOption('size', '3-bed');
    trackCalculatorComplete('quote-calc');
    for (const e of ['quote_calculator_opened', 'quote_calculator_step_completed', 'quote_calculator_option_selected', 'quote_calculator_submitted']) {
      expect(lastEvent(e)).toBeTruthy();
    }
    expect(mockSend).not.toHaveBeenCalled(); // funnel is browser-only
  });

  it('a browser-path click event still reaches the gateway with value/currency', () => {
    const id = trackServerEvent('video_play', { value: 1200, currency: 'GBP' });
    const p = mockSend.mock.calls.at(-1)![0];
    expect(p.event_name).toBe('video_play');
    expect(p.event_id).toBe(id);
    expect(p.value).toBe(1200);
    expect(Number.isInteger(p.event_time)).toBe(true); // unix SECONDS, not ms
    expect(p.event_time).toBeLessThan(100_000_000_000);
  });

  it('contact submit maps to contact_form_submitted in the dataLayer, backend owns the server leg', () => {
    const r = trackContactSubmit({ email: 'a@b.com', phone: '0620123456' });
    expect(lastEvent('contact_form_submitted')!.event_id).toBe(r.eventId);
    expect(mockSend).not.toHaveBeenCalled();
  });
});

describe('the lead never gets stuck', () => {
  it('a hanging worker does NOT block a click conversion (fire-and-forget)', () => {
    mockSend.mockImplementation(() => new Promise<boolean>(() => { /* never resolves */ }));
    const id = trackServerEvent('phone_number_clicked');
    expect(id).toBeTruthy(); // returns synchronously
  });

  it('a rejecting worker does NOT throw out of the conversion path', () => {
    mockSend.mockImplementation(() => Promise.reject(new Error('boom')));
    expect(() => trackServerEvent('phone_number_clicked')).not.toThrow();
    expect(() => trackLeadSubmit({ email: 'a@b.com', value: 100 })).not.toThrow();
    expect(lastEvent('quote_calculator_submitted')).toBeTruthy();
  });

  it('value 0 is omitted from the dataLayer (no Smart Bidding poisoning) but the event still fires', () => {
    const r = trackLeadSubmit({ email: 'a@b.com', value: 0, currency: 'GBP' });
    expect(r.success).toBe(true);
    expect(lastEvent('quote_calculator_submitted')!.value).toBeUndefined();
  });
});
