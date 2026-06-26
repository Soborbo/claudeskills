import { describe, it, expect, beforeEach, vi } from 'vitest';

// A gateway-dispatch mockolva — itt az index.ts vezérlését teszteljük.
vi.mock('../lib/gateway', () => ({
  sendToWorker: vi.fn(() => Promise.resolve(true)),
  getTurnstileToken: vi.fn(() => Promise.resolve('TOK')),
  collectAttribution: vi.fn(() => ({})),
}));

import { trackLeadSubmit, trackContactSubmit, trackServerEvent } from '../lib/index';
import { sendToWorker } from '../lib/gateway';
import { setCkyConsent, resetAll, lastEvent, getDataLayer } from './helpers';

const mockSend = sendToWorker as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  resetAll();
  mockSend.mockClear();
  setCkyConsent({ analytics: true, marketing: true });
});

describe('trackLeadSubmit', () => {
  it('pushes dataLayer lead_submit AND dispatches to gateway with the SAME event_id', () => {
    const r = trackLeadSubmit({ email: 'a@b.com', phone: '07123456789', value: 380, currency: 'GBP' });
    expect(r.success).toBe(true);
    expect(r.consentBlocked).toBe(false);

    const dlEvent = lastEvent('lead_submit')!;
    expect(mockSend).toHaveBeenCalledTimes(1);
    const payload = mockSend.mock.calls[0][0];
    // megosztott event_id → Meta Pixel↔CAPI dedup
    expect(payload.event_id).toBe(dlEvent.event_id);
    expect(payload.event_id).toBe(r.eventId);
    // kanonikus gateway event-név
    expect(payload.event_name).toBe('contact_form_submit');
    // user_data nyersen (a gateway hashel)
    expect(payload.user_data.email).toBe('a@b.com');
    expect(payload.value).toBe(380);
    expect(payload.currency).toBe('GBP');
  });

  it('event-név felülírható', () => {
    trackLeadSubmit({ email: 'a@b.com', value: 1000, currency: 'HUF', eventName: 'quote_calculator_conversion' });
    expect(mockSend.mock.calls[0][0].event_name).toBe('quote_calculator_conversion');
  });

  it('deviza a market-configból jön default-ban (HU → HUF), de hívásonként felülírható', () => {
    trackLeadSubmit({ email: 'a@b.com', value: 5000 }); // nincs currency → config default
    expect(mockSend.mock.calls[0][0].currency).toBe('HUF');
    mockSend.mockClear();
    trackLeadSubmit({ email: 'a@b.com', value: 100, currency: 'GBP' }); // explicit UK
    expect(mockSend.mock.calls[0][0].currency).toBe('GBP');
  });

  it('consent nélkül: NINCS dispatch, NINCS dataLayer push', () => {
    setCkyConsent({ analytics: true, marketing: false });
    const r = trackLeadSubmit({ email: 'a@b.com' });
    expect(r.success).toBe(false);
    expect(r.consentBlocked).toBe(true);
    expect(mockSend).not.toHaveBeenCalled();
    expect(getDataLayer().some((e) => e.event === 'lead_submit')).toBe(false);
  });
});

describe('trackContactSubmit', () => {
  it('contact_form_submit-ra dispatchol, contact_submit dataLayer-rel', () => {
    const r = trackContactSubmit({ email: 'a@b.com', phone: '0620123456' });
    expect(lastEvent('contact_submit')!.event_id).toBe(r.eventId);
    expect(mockSend.mock.calls[0][0].event_name).toBe('contact_form_submit');
    expect(mockSend.mock.calls[0][0].event_id).toBe(r.eventId);
  });
});

describe('trackServerEvent', () => {
  it('tetszőleges gateway eseményt küld, consent mellett', () => {
    const id = trackServerEvent('phone_conversion', { value: 0 });
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0].event_name).toBe('phone_conversion');
    expect(mockSend.mock.calls[0][0].event_id).toBe(id);
  });
  it('consent nélkül nem küld', () => {
    setCkyConsent({ marketing: false });
    trackServerEvent('phone_conversion');
    expect(mockSend).not.toHaveBeenCalled();
  });
});
