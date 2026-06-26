import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { collectAttribution, sendToWorker, getTurnstileToken, trackConversion } from '../lib/gateway';
import { setCookie, setUrl, resetAll, getDataLayer, setCkyConsent } from './helpers';

// CookieYes consent cookie összeállítása (ad = advertisement, an = analytics).
function ckyCookie(ad: boolean, an: boolean): void {
  setCookie(
    'cookieyes-consent',
    `consent:yes,necessary:yes,functional:yes,analytics:${an ? 'yes' : 'no'},advertisement:${ad ? 'yes' : 'no'},other:yes`,
  );
}

// Turnstile stub: a render azonnal visszahívja a callbacket egy tokennel.
function stubTurnstile(token = 'TT'): void {
  const div = document.createElement('div');
  div.id = 'cf-turnstile-invisible';
  document.body.appendChild(div);
  (window as unknown as { turnstile: unknown }).turnstile = {
    render: (_c: unknown, opts: { callback?: (t: string) => void }) => { opts.callback?.(token); return 'wid'; },
    reset: () => {},
    execute: () => {},
    getResponse: () => token,
  };
}

beforeEach(() => resetAll());
afterEach(() => vi.unstubAllGlobals());

describe('collectAttribution — consent-gated click IDs', () => {
  it('ad-consent mellett elkapja a click ID-t + UTM-et az URL-ből', () => {
    ckyCookie(true, true);
    setUrl('/?gclid=G1&utm_source=google&utm_medium=cpc');
    const a = collectAttribution();
    expect(a.gclid).toBe('G1');
    expect(a.utm_source).toBe('google');
    expect(a.utm_medium).toBe('cpc');
    expect(a.landing_page).toContain('/');
  });

  it('ad-consent NÉLKÜL nincs click ID, de UTM marad', () => {
    ckyCookie(false, true);
    setUrl('/?gclid=G1&utm_source=newsletter');
    const a = collectAttribution();
    expect(a.gclid).toBeUndefined();
    expect(a.utm_source).toBe('newsletter');
  });

  it('_gcl_aw cookie fallback gclid-hez (ad-consent mellett)', () => {
    ckyCookie(true, true);
    setCookie('_gcl_aw', 'GCL.1700000000.COOKIEGCLID');
    setUrl('/');
    expect(collectAttribution().gclid).toBe('COOKIEGCLID');
  });
});

describe('trackConversion — consent-gated (footgun fix)', () => {
  it('consent denied → no dataLayer push and no network', async () => {
    setCkyConsent({ analytics: false, marketing: false });
    const fetchMock = vi.fn((..._args: unknown[]) => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);
    await trackConversion('phone_conversion', { value: 0, user_data: { email: 'a@b.com' } });
    expect(getDataLayer()).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('getTurnstileToken', () => {
  it('a stubolt widgetből visszaadja a tokent', async () => {
    stubTurnstile('ABC');
    expect(await getTurnstileToken()).toBe('ABC');
  });
});

describe('sendToWorker — gateway payload', () => {
  it('POST /api/event/conversion turnstile_token + consent + attribution mezőkkel', async () => {
    ckyCookie(true, true);
    setUrl('/?gclid=G9');
    stubTurnstile('TT');
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => false });
    const fetchMock = vi.fn((..._args: unknown[]) => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);

    const ok = await sendToWorker({
      event_name: 'contact_form_submit',
      event_id: 'E1',
      event_time: 1_700_000_000,
      user_data: { email: 'a@b.com' },
    });
    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/event/conversion');
    const body = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);
    expect(body.event_name).toBe('contact_form_submit');
    expect(body.event_id).toBe('E1');
    // a token jelen van (a pontos érték a modul-szintű cache miatt sorrend-függő)
    expect(typeof body.turnstile_token).toBe('string');
    expect(body.turnstile_token.length).toBeGreaterThan(0);
    expect(body.user_data.email).toBe('a@b.com');
    expect(body.consent.ad_user_data).toBe('GRANTED');
    expect(body.attribution.gclid).toBe('G9');
  });
});
