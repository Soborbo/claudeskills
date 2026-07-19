import { describe, it, expect, beforeEach, vi } from 'vitest';

// A lomtalan.hu 2026-07-es incidens teljes visszajátszása a PUBLIKUS API-n át,
// KIZÁRÓLAG a CookieYes VALÓDI kategória-alakjával (setCkyConsentRaw — semmi
// teszt-cukor). A bug: az olvasó a nemlétező `categories.marketing` kulcsot
// nézte → éles CMP mellett hasMarketingConsent() mindig false → 2 hétig NULLA
// Ads/GA4/Meta konverzió, miközben a formok (és a dev-környezet) hibátlanul
// működtek. Ezek a tesztek azt őrzik, hogy a valós CMP-kimenet vezérelte
// KONVERZIÓS ÚT működjön — nem csak a consent-olvasó önmagában.

vi.mock('../lib/gateway', () => ({
  sendToWorker: vi.fn(() => Promise.resolve(true)),
  collectAttribution: vi.fn(() => ({})),
}));

import {
  initTracking, trackLeadSubmit, trackContactSubmit, trackPhoneConversion,
} from '../lib/index';
import { trackCalculatorStart } from '../lib/events';
import { sendToWorker } from '../lib/gateway';
import { setCkyConsentRaw, resetAll, setUrl, lastEvent, getDataLayer } from './helpers';

const mockSend = sendToWorker as unknown as ReturnType<typeof vi.fn>;

// A window.getCkyConsent().categories szó szerinti éles kimenetei (lomtalan.hu,
// 2026-07-19-i runtime-dump):
const REAL_FULL_ACCEPT = { necessary: true, functional: true, analytics: true, performance: true, advertisement: true };
const REAL_ALL_DENIED = { necessary: false, functional: false, analytics: false, performance: false, advertisement: false };
const REAL_ADS_DENIED = { necessary: true, functional: true, analytics: true, performance: true, advertisement: false };
const REAL_ADS_ONLY = { necessary: true, functional: false, analytics: false, performance: false, advertisement: true };

beforeEach(() => { resetAll(); mockSend.mockClear(); });

describe('incident replay: quote submit with the real full-accept shape', () => {
  it('trackLeadSubmit fires the dataLayer conversion with event_id + gclid + value', () => {
    setUrl('/arkalkulator/?gclid=TEST123');
    setCkyConsentRaw(REAL_FULL_ACCEPT);

    const r = trackLeadSubmit({ email: 'Teszt.Elek@Example.com', phone: '06301234567', value: 200000, currency: 'HUF' });

    // A bug alatt itt success:false / consentBlocked:true jött, és SEMMI nem
    // került a dataLayerbe — pontosan ezt fogja meg ez a teszt.
    expect(r.success).toBe(true);
    expect(r.consentBlocked).toBe(false);
    expect(r.gclid).toBe('TEST123');

    const dl = lastEvent('quote_calculator_submitted')!;
    expect(dl).toBeDefined();
    expect(dl.event_id).toBe(r.eventId);
    expect(dl.gclid).toBe('TEST123');
    expect(dl.value).toBe(200000);
    expect(dl.currency).toBe('HUF');
  });

  it('writes the Enhanced Conversions side-channel (normalized email + E.164 phone), PII stays out of the dataLayer', () => {
    setCkyConsentRaw(REAL_FULL_ACCEPT);
    trackLeadSubmit({ email: 'Teszt.Elek@Example.com', phone: '06301234567', value: 1000 });

    const ud = (window as unknown as { __sbUserData?: Record<string, string> }).__sbUserData;
    expect(ud).toBeDefined();
    expect(ud!.email).toBe('teszt.elek@example.com');
    expect(ud!.phone_number).toBe('+36301234567');

    const dl = lastEvent('quote_calculator_submitted')!;
    expect(dl.email).toBeUndefined();
    expect(dl.phone).toBeUndefined();
    expect(dl.phone_number).toBeUndefined();
  });

  it('trackContactSubmit fires contact_form_submitted the same way', () => {
    setUrl('/kapcsolat/?gclid=TESTKAPCS');
    setCkyConsentRaw(REAL_FULL_ACCEPT);
    const r = trackContactSubmit({ email: 'a@b.hu', phone: '06301112233' });
    expect(r.success).toBe(true);
    expect(lastEvent('contact_form_submitted')!.event_id).toBe(r.eventId);
    expect(lastEvent('contact_form_submitted')!.gclid).toBe('TESTKAPCS');
  });
});

describe('real ads-denied shape (analytics still granted)', () => {
  it('lead conversion is consent-blocked: no push, no EC side-channel, but the eventId is still minted for the hidden field', () => {
    setCkyConsentRaw(REAL_ADS_DENIED);
    const r = trackLeadSubmit({ email: 'a@b.hu', value: 5000 });
    expect(r.success).toBe(false);
    expect(r.consentBlocked).toBe(true);
    expect(r.eventId).toBeTruthy();
    expect(getDataLayer().some((e) => e.event === 'quote_calculator_submitted')).toBe(false);
    expect((window as unknown as { __sbUserData?: unknown }).__sbUserData).toBeUndefined();
    expect(mockSend).not.toHaveBeenCalled();
  });
});

describe('production consent-update replay (the LIVEPROOF check as a test)', () => {
  it('denied at load → nothing persisted; CookieYes grant event → gclid/gbraid land in localStorage', () => {
    setUrl('/?gclid=LIVEPROOF1&gbraid=LIVEGB1');
    setCkyConsentRaw(REAL_ALL_DENIED);
    initTracking();
    expect(localStorage.getItem('sb_tracking')).toBeNull();

    // A banner-elfogadás: a CMP átvált advertisement:true-ra és kilövi az updatet.
    setCkyConsentRaw(REAL_FULL_ACCEPT);
    document.dispatchEvent(new Event('cookieyes_consent_update'));

    const stored = JSON.parse(localStorage.getItem('sb_tracking') || 'null');
    expect(stored).not.toBeNull();
    expect(stored.gclid).toBe('LIVEPROOF1');
    expect(stored.gbraid).toBe('LIVEGB1');
    const firstTouch = JSON.parse(localStorage.getItem('sb_first_touch') || 'null');
    expect(firstTouch?.gclid).toBe('LIVEPROOF1');
  });
});

describe('marketing-only real shape (advertisement granted, analytics declined)', () => {
  // Model 2: a Google Ads website-konverzió KIZÁRÓLAG a böngésző dataLayer-lábon
  // él (a gateway Ads-t csak offline küld). A korábbi analytics-only kapu ezért
  // némán eldobta a marketing-consentes (de analytics-t elutasító) látogató
  // telefonhívás-konverzióját.
  it('phone click fires BOTH legs with a shared event_id', () => {
    setCkyConsentRaw(REAL_ADS_ONLY);
    const id = trackPhoneConversion({ phone: '06301234567' });
    expect(id).toBeTruthy();
    const dl = lastEvent('phone_number_clicked')!;
    expect(dl).toBeDefined();
    expect(dl.event_id).toBe(id);
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0].event_id).toBe(id);
  });

  it('lead form conversion fires (marketing gate) — the money path never depended on analytics', () => {
    setCkyConsentRaw(REAL_ADS_ONLY);
    const r = trackLeadSubmit({ email: 'a@b.hu', value: 900 });
    expect(r.success).toBe(true);
    expect(lastEvent('quote_calculator_submitted')).toBeDefined();
  });

  it('analytics milestones stay analytics-gated (deliberate asymmetry)', () => {
    setCkyConsentRaw(REAL_ADS_ONLY);
    trackCalculatorStart('kalkulator');
    expect(getDataLayer().some((e) => e.event === 'quote_calculator_opened')).toBe(false);
  });
});

describe('real all-denied shape', () => {
  it('phone click is a no-op AND the session dedup is not consumed — granting later lets the next click fire', () => {
    setCkyConsentRaw(REAL_ALL_DENIED);
    expect(trackPhoneConversion()).toBeNull();
    expect(getDataLayer()).toHaveLength(0);
    expect(mockSend).not.toHaveBeenCalled();

    setCkyConsentRaw(REAL_FULL_ACCEPT);
    expect(trackPhoneConversion()).toBeTruthy();
    expect(getDataLayer().filter((e) => e.event === 'phone_number_clicked')).toHaveLength(1);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});
