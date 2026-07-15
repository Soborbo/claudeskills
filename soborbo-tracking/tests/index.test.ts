import { describe, it, expect, beforeEach, vi } from 'vitest';

// The gateway transport is mocked — these tests exercise index.ts' CONTROL FLOW:
// which functions dispatch to the gateway at all, and which are dataLayer-only.
vi.mock('../lib/gateway', () => ({
  sendToWorker: vi.fn(() => Promise.resolve(true)),
  collectAttribution: vi.fn(() => ({})),
}));

import {
  trackLeadSubmit, trackContactSubmit, trackServerEvent,
  trackPhoneConversion, trackCallbackConversion, trackEmailConversion, trackWhatsappConversion,
} from '../lib/index';
import { sendToWorker } from '../lib/gateway';
import { setCkyConsent, resetAll, lastEvent, getDataLayer } from './helpers';

const mockSend = sendToWorker as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  resetAll();
  mockSend.mockClear();
  setCkyConsent({ analytics: true, marketing: true });
});

describe('trackLeadSubmit — BROWSER LEG ONLY (server_ingress_only contract)', () => {
  it('pushes dataLayer quote_calculator_submitted and does NOT dispatch to the gateway', () => {
    const r = trackLeadSubmit({ email: 'a@b.com', phone: '07123456789', value: 380, currency: 'GBP' });
    expect(r.success).toBe(true);
    expect(r.consentBlocked).toBe(false);

    const dlEvent = lastEvent('quote_calculator_submitted')!;
    expect(dlEvent.event_id).toBe(r.eventId);
    // THE LOAD-BEARING ASSERTION: no browser gateway leg for a gated form event.
    // The gateway 403s it (TRK-400-017); the site BACKEND sends the server leg
    // reusing r.eventId (the hidden field). If this starts failing because someone
    // re-added a dispatch here, that is a regression to the pre-Run-6 silent-loss bug.
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('currency defaults from the market config (HU → HUF) on the dataLayer leg', () => {
    trackLeadSubmit({ email: 'a@b.com', value: 5000 }); // no currency → config default
    expect(lastEvent('quote_calculator_submitted')!.currency).toBe('HUF');
  });

  it('without marketing consent: no dataLayer push, no dispatch, consentBlocked', () => {
    setCkyConsent({ analytics: true, marketing: false });
    const r = trackLeadSubmit({ email: 'a@b.com' });
    expect(r.success).toBe(false);
    expect(r.consentBlocked).toBe(true);
    expect(mockSend).not.toHaveBeenCalled();
    expect(getDataLayer().some((e) => e.event === 'quote_calculator_submitted')).toBe(false);
  });

  it('still returns the eventId for the hidden field even when consent-blocked', () => {
    setCkyConsent({ analytics: false, marketing: false });
    const r = trackLeadSubmit({ email: 'a@b.com' });
    expect(r.eventId).toBeTruthy();
  });
});

describe('trackContactSubmit — BROWSER LEG ONLY', () => {
  it('pushes contact_form_submitted to the dataLayer and does NOT dispatch to the gateway', () => {
    const r = trackContactSubmit({ email: 'a@b.com', phone: '0620123456' });
    expect(lastEvent('contact_form_submitted')!.event_id).toBe(r.eventId);
    expect(mockSend).not.toHaveBeenCalled();
  });
});

describe('trackServerEvent — browser-path events', () => {
  it('dispatches a browser-path event with the returned event_id', () => {
    const id = trackServerEvent('phone_number_clicked');
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0].event_name).toBe('phone_number_clicked');
    expect(mockSend.mock.calls[0][0].event_id).toBe(id);
  });
  it('does not dispatch without marketing consent', () => {
    setCkyConsent({ marketing: false });
    trackServerEvent('phone_number_clicked');
    expect(mockSend).not.toHaveBeenCalled();
  });
});

describe('click conversions — channels per the ingress contract', () => {
  it('trackPhoneConversion pushes phone_number_clicked AND dispatches with the SAME event_id', () => {
    const id = trackPhoneConversion({ phone: '07123456789' });
    expect(id).toBeTruthy();
    const dl = lastEvent('phone_number_clicked')!;
    expect(dl.event_id).toBe(id);
    expect(mockSend).toHaveBeenCalledTimes(1);
    const payload = mockSend.mock.calls[0][0];
    expect(payload.event_name).toBe('phone_number_clicked');
    expect(payload.event_id).toBe(id);
    expect(payload.user_data.phone_number).toBe('07123456789'); // raw → gateway hashes
  });

  it('email/whatsapp map to the canonical gateway event names', () => {
    trackEmailConversion({ email: 'a@b.com' });
    expect(mockSend.mock.calls[0][0].event_name).toBe('email_address_clicked');
    mockSend.mockClear();
    trackWhatsappConversion({ phone: '07123456789' });
    expect(mockSend.mock.calls[0][0].event_name).toBe('whatsapp_button_clicked');
  });

  it('trackCallbackConversion is dataLayer-ONLY: callback_request_submitted is server-ingress-only', () => {
    const id = trackCallbackConversion();
    expect(id).toBeTruthy();
    // dataLayer leg fires (Pixel/GA4 via GTM)…
    expect(getDataLayer().some((e) => e.event === 'callback_request_submitted')).toBe(true);
    // …but there is NO browser gateway leg — the gateway would 403 it (TRK-400-017).
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('phone dedup covers BOTH channels (second click → no dataLayer, no gateway)', () => {
    const id1 = trackPhoneConversion();
    expect(id1).toBeTruthy();
    const id2 = trackPhoneConversion();
    expect(id2).toBeNull();
    expect(getDataLayer().filter((e) => e.event === 'phone_number_clicked')).toHaveLength(1);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('callback/email/whatsapp dedup suppresses the second click in the same session', () => {
    const cases: Array<{ fn: () => string | null; dlEvent: string; gatewayCalls: number }> = [
      { fn: () => trackCallbackConversion(), dlEvent: 'callback_request_submitted', gatewayCalls: 0 },
      { fn: () => trackEmailConversion({ email: 'a@b.com' }), dlEvent: 'email_address_clicked', gatewayCalls: 1 },
      { fn: () => trackWhatsappConversion({ phone: '07123456789' }), dlEvent: 'whatsapp_button_clicked', gatewayCalls: 1 },
    ];
    for (const { fn, dlEvent, gatewayCalls } of cases) {
      mockSend.mockClear();
      expect(fn(), dlEvent).toBeTruthy();      // first click → fires
      expect(fn(), dlEvent).toBeNull();        // second click same session → suppressed
      expect(getDataLayer().filter((e) => e.event === dlEvent), dlEvent).toHaveLength(1);
      expect(mockSend, dlEvent).toHaveBeenCalledTimes(gatewayCalls);
    }
  });

  it('analytics-only consent → dataLayer fires, NO gateway dispatch', () => {
    setCkyConsent({ analytics: true, marketing: false });
    trackPhoneConversion();
    expect(getDataLayer().some((e) => e.event === 'phone_number_clicked')).toBe(true);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('marketing-only consent → server-side conversion STILL fires (decoupled from analytics)', () => {
    setCkyConsent({ analytics: false, marketing: true });
    const id = trackPhoneConversion({ phone: '07123456789' });
    expect(id).toBeTruthy();
    expect(getDataLayer().some((e) => e.event === 'phone_number_clicked')).toBe(false);
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0].event_name).toBe('phone_number_clicked');
    expect(mockSend.mock.calls[0][0].event_id).toBe(id);
  });

  it('no consent at all → nothing fires and dedup is not consumed', () => {
    setCkyConsent({ analytics: false, marketing: false });
    expect(trackPhoneConversion()).toBeNull();
    expect(mockSend).not.toHaveBeenCalled();
    expect(getDataLayer()).toHaveLength(0);
  });
});
