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

describe('GA cookie extraction → gateway payload ids', () => {
  async function dispatchAndReadBody(): Promise<Record<string, unknown>> {
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => false });
    const fetchMock = vi.fn((..._args: unknown[]) => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);
    await sendToWorker({ event_name: 'phone_number_clicked', event_id: 'E', event_time: 1 });
    return JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);
  }

  it('client_id from the _ga cookie (GA1.1.<a>.<b> → a.b)', async () => {
    setCookie('_ga', 'GA1.1.111111.222222');
    const body = await dispatchAndReadBody();
    expect(body.client_id).toBe('111111.222222');
  });

  it('session_id from a GS1-format stream cookie', async () => {
    setCookie('_ga_ABC123', 'GS1.1.1700000123.4.1.1700000999.60.0.0');
    const body = await dispatchAndReadBody();
    expect(body.session_id).toBe('1700000123');
  });

  it('session_id from the GS2 format (literal s prefix — the 2025-05+ default)', async () => {
    setCookie('_ga_ABC123', 'GS2.1.s1700000456$o1$g1$t1700000999$j60$l0$h0');
    const body = await dispatchAndReadBody();
    expect(body.session_id).toBe('1700000456');
  });

  it('malformed _ga cookie → no client_id, dispatch still succeeds', async () => {
    setCookie('_ga', 'GA1.1');
    const body = await dispatchAndReadBody();
    expect(body.client_id).toBeUndefined();
    expect(body.event_name).toBe('phone_number_clicked');
  });
});

describe('consent source precedence in the payload', () => {
  it('window.__trackingConsent override beats the CookieYes cookie', async () => {
    ckyCookie(false, false); // cookie says denied…
    (window as unknown as { __trackingConsent?: unknown }).__trackingConsent = {
      ad_storage: 'GRANTED', ad_user_data: 'GRANTED', ad_personalization: 'GRANTED', analytics_storage: 'GRANTED',
    };
    try {
      Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => false });
      const fetchMock = vi.fn((..._args: unknown[]) => Promise.resolve(new Response(null, { status: 204 })));
      vi.stubGlobal('fetch', fetchMock);
      await sendToWorker({ event_name: 'phone_number_clicked', event_id: 'E', event_time: 1 });
      const body = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);
      expect(body.consent.ad_storage).toBe('GRANTED'); // the override won
    } finally {
      delete (window as unknown as { __trackingConsent?: unknown }).__trackingConsent;
    }
  });

  it('no cookie, no override → consent omitted (the gateway decides via require_consent)', async () => {
    setCkyConsent({ analytics: true, marketing: true }); // JS API present, cookie absent
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => false });
    const fetchMock = vi.fn((..._args: unknown[]) => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);
    await sendToWorker({ event_name: 'phone_number_clicked', event_id: 'E', event_time: 1 });
    const body = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);
    expect(body.consent).toBeUndefined();
  });
});

describe('sendToWorker transports', () => {
  it('a queued beacon wins: true, transport=beacon, fetch never called', async () => {
    ckyCookie(true, true);
    const beacon = vi.fn(() => true);
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: beacon });
    const fetchMock = vi.fn((..._args: unknown[]) => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);
    const ok = await sendToWorker({ event_name: 'phone_number_clicked', event_id: 'E', event_time: 1 });
    expect(ok).toBe(true);
    expect(beacon).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
    const diag = getDiagnostics().find((d) => d.code === 'TRK-1000');
    expect(diag?.context?.transport).toBe('beacon');
  });

  it('a THROWING beacon falls back to fetch (TRK-1003 breadcrumb)', async () => {
    ckyCookie(true, true);
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => { throw new Error('blocked'); } });
    const fetchMock = vi.fn((..._args: unknown[]) => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);
    const ok = await sendToWorker({ event_name: 'phone_number_clicked', event_id: 'E', event_time: 1 });
    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getDiagnostics().some((d) => d.code === 'TRK-1003')).toBe(true);
  });

  it('a gateway 403 is NOT success: false + TRK-1006 with the status', async () => {
    ckyCookie(true, true);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => false });
    const fetchMock = vi.fn((..._args: unknown[]) => Promise.resolve(new Response(null, { status: 403 })));
    vi.stubGlobal('fetch', fetchMock);
    const ok = await sendToWorker({ event_name: 'phone_number_clicked', event_id: 'E', event_time: 1 });
    expect(ok).toBe(false);
    const diag = getDiagnostics().find((d) => d.code === 'TRK-1006');
    expect(diag?.context?.status).toBe(403);
  });

  it('a network error is NOT success: false + TRK-1002', async () => {
    ckyCookie(true, true);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => false });
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    const ok = await sendToWorker({ event_name: 'phone_number_clicked', event_id: 'E', event_time: 1 });
    expect(ok).toBe(false);
    expect(getDiagnostics().some((d) => d.code === 'TRK-1002')).toBe(true);
  });
});

describe('collectAttribution — three-state stored click-ID handling', () => {
  it('explicit cookie DENIED purges click IDs from storage too (revocation honored at rest)', () => {
    localStorage.setItem('__sb_attribution', JSON.stringify({ gclid: 'OLD', utm_source: 'google' }));
    ckyCookie(false, true);
    const a = collectAttribution();
    expect(a.gclid).toBeUndefined();
    expect(a.utm_source).toBe('google');
    const stored = JSON.parse(localStorage.getItem('__sb_attribution')!);
    expect(stored.gclid).toBeUndefined(); // purged at rest
  });

  it('UNKNOWN consent (no cookie, JS API denies) strips the wire copy but KEEPS storage', () => {
    localStorage.setItem('__sb_attribution', JSON.stringify({ gclid: 'KEEPME', utm_source: 'google' }));
    setCkyConsent({ analytics: true, marketing: false }); // CMP present, no cookie → not the dev fallback
    const a = collectAttribution();
    expect(a.gclid).toBeUndefined(); // fail-closed on the wire
    const stored = JSON.parse(localStorage.getItem('__sb_attribution')!);
    expect(stored.gclid).toBe('KEEPME'); // a prior grant's id survives the boot race
  });

  it('landing_page / referrer are first-touch: not overwritten on later pages', () => {
    ckyCookie(true, true);
    setUrl('/landing?gclid=G1');
    collectAttribution();
    setUrl('/checkout');
    const a = collectAttribution();
    expect(String(a.landing_page)).toContain('/landing');
  });
});

describe('trackConversion (deprecated wrapper) — remaining paths', () => {
  it('analytics-only: dataLayer push with auto-minted event_id, NO network', async () => {
    setCkyConsent({ analytics: true, marketing: false });
    const fetchMock = vi.fn((..._args: unknown[]) => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);
    await trackConversion('phone_number_clicked', { value: 5, currency: 'HUF', source: 'cta', service: 'lomtalanitas' });
    const e = getDataLayer().find((x) => x.event === 'phone_number_clicked')!;
    expect(e.event_id).toBeTruthy();
    expect(e.value).toBe(5);
    expect(e.currency).toBe('HUF');
    expect(e.source).toBe('cta');
    expect(e.service).toBe('lomtalanitas');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('marketing consent adds the gateway leg with the SAME event_id', async () => {
    ckyCookie(true, true);
    setCkyConsent({ analytics: true, marketing: true });
    Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: () => false });
    const fetchMock = vi.fn((..._args: unknown[]) => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);
    await trackConversion('phone_number_clicked', { event_id: 'FIXED-ID' });
    expect(getDataLayer().find((x) => x.event === 'phone_number_clicked')!.event_id).toBe('FIXED-ID');
    const body = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);
    expect(body.event_id).toBe('FIXED-ID');
  });
});

describe('storage resilience (privacy mode / quota errors)', () => {
  it('collectAttribution survives a THROWING localStorage (read + write)', () => {
    ckyCookie(true, true);
    setUrl('/?gclid=GSTORM');
    const getSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    try {
      const a = collectAttribution();
      expect(a.gclid).toBe('GSTORM'); // still collected from the URL
    } finally {
      getSpy.mockRestore();
      setSpy.mockRestore();
    }
  });
});
