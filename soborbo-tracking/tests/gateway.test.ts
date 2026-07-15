import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { collectAttribution, sendToWorker, trackConversion } from '../lib/gateway';
import { getDiagnostics, clearDiagnostics } from '../lib/observability';
import { setCookie, setUrl, resetAll, getDataLayer, setCkyConsent } from './helpers';

// CookieYes consent cookie (ad = advertisement, an = analytics).
function ckyCookie(ad: boolean, an: boolean): void {
  setCookie(
    'cookieyes-consent',
    `consent:yes,necessary:yes,functional:yes,analytics:${an ? 'yes' : 'no'},advertisement:${ad ? 'yes' : 'no'},other:yes`,
  );
}

beforeEach(() => { resetAll(); clearDiagnostics(); });
afterEach(() => vi.unstubAllGlobals());

describe('collectAttribution — consent-gated click IDs', () => {
  it('with ad consent captures click ID + UTM from the URL', () => {
    ckyCookie(true, true);
    setUrl('/?gclid=G1&utm_source=google&utm_medium=cpc');
    const a = collectAttribution();
    expect(a.gclid).toBe('G1');
    expect(a.utm_source).toBe('google');
    expect(a.utm_medium).toBe('cpc');
    expect(a.landing_page).toContain('/');
  });

  it('WITHOUT ad consent: no click ID, but UTM stays', () => {
    ckyCookie(false, true);
    setUrl('/?gclid=G1&utm_source=newsletter');
    const a = collectAttribution();
    expect(a.gclid).toBeUndefined();
    expect(a.utm_source).toBe('newsletter');
  });

  it('_gcl_aw cookie fallback for gclid (with ad consent)', () => {
    ckyCookie(true, true);
    setCookie('_gcl_aw', 'GCL.1700000000.COOKIEGCLID');
    setUrl('/');
    expect(collectAttribution().gclid).toBe('COOKIEGCLID');
  });

  // Consent-source consistency: when the CookieYes COOKIE is absent, fall back to the
  // JS API (hasMarketingConsent) instead of stripping click IDs from the server payload.
  it('no consent cookie but JS-API grants marketing → click IDs are kept (fallback)', () => {
    setCkyConsent({ analytics: true, marketing: true }); // JS API granted, no cookie
    setUrl('/?gclid=GJSAPI');
    expect(collectAttribution().gclid).toBe('GJSAPI');
  });

  it('no consent cookie and JS-API denies marketing → click IDs are stripped', () => {
    setCkyConsent({ analytics: true, marketing: false }); // JS API denies, no cookie
    setUrl('/?gclid=GDENY');
    expect(collectAttribution().gclid).toBeUndefined();
  });
});

describe('trackConversion — consent-gated (footgun fix)', () => {
  it('consent denied → no dataLayer push and no network', async () => {
    setCkyConsent({ analytics: false, marketing: false });
    const fetchMock = vi.fn((..._args: unknown[]) => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);
    await trackConversion('phone_number_clicked', { user_data: { email: 'a@b.com' } });
    expect(getDataLayer()).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('sendToWorker — browser-path gateway payload (NO Turnstile anywhere)', () => {
  it('POSTs /api/event/conversion with consent + attribution and WITHOUT any turnstile_token', async () => {
    ckyCookie(true, true);
    setUrl('/?gclid=G9');
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => false });
    const fetchMock = vi.fn((..._args: unknown[]) => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);

    const ok = await sendToWorker({
      event_name: 'phone_number_clicked',
      event_id: 'E1',
      event_time: 1_700_000_000,
      user_data: { phone_number: '07123456789' },
    });
    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/event/conversion');
    const body = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);
    expect(body.event_name).toBe('phone_number_clicked');
    expect(body.event_id).toBe('E1');
    // The Turnstile gate is GONE — a token in the payload means someone re-added
    // the mechanism that silently dropped two weeks of click conversions.
    expect(body.turnstile_token).toBeUndefined();
    expect(body.user_data.phone_number).toBe('07123456789');
    expect(body.consent.ad_user_data).toBe('GRANTED');
    expect(body.attribution.gclid).toBe('G9');
  });

  it('BLOCKS a server-ingress-only event: no network, false, TRK-1005', async () => {
    ckyCookie(true, true);
    const beacon = vi.fn(() => true);
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: beacon });
    const fetchMock = vi.fn((..._args: unknown[]) => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const ok = await sendToWorker({
      event_name: 'contact_form_submitted',
      event_id: 'E1',
      event_time: 1_700_000_000,
      user_data: { email: 'a@b.com' },
    });
    expect(ok).toBe(false);
    expect(beacon).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    const diag = getDiagnostics().find((d) => d.code === 'TRK-1005');
    expect(diag).toBeTruthy();
    expect(diag!.severity).toBe('error');
    expect(diag!.context?.event_name).toBe('contact_form_submitted');
  });
});
