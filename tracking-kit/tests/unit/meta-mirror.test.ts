import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { META_CAPI_ENDPOINT } from '../../src/lib/tracking/config';
import { mirrorMetaCapi } from '../../src/lib/tracking/meta-mirror';
import { setUserDataOnDOM } from '../../src/lib/tracking/tracking';
import { denyConsent, grantConsent } from '../setup/vitest.setup';
import { readBlobJSON } from '../setup/blob-helper';

beforeEach(() => {
  // every test starts with a fresh fetch mock
  global.fetch = vi.fn(() =>
    Promise.resolve(new Response(null, { status: 204 })),
  ) as unknown as typeof fetch;
});

describe('mirrorMetaCapi', () => {
  it('no-ops in SSR (window undefined)', async () => {
    const originalWindow = global.window;
    // @ts-expect-error simulate SSR
    delete global.window;
    await mirrorMetaCapi('primary_conversion', 'evt-1', {});
    expect(global.fetch).not.toHaveBeenCalled();
    global.window = originalWindow;
  });

  it('no-ops on an unknown internal event name', async () => {
    grantConsent();
    await mirrorMetaCapi('not_in_map', 'evt-1', {});
    expect(global.fetch).not.toHaveBeenCalled();
    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it('no-ops when full ads consent is denied', async () => {
    denyConsent();
    await mirrorMetaCapi('primary_conversion', 'evt-1', { value: 1, currency: 'EUR' });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(navigator.sendBeacon).not.toHaveBeenCalled();
  });

  it('sends via sendBeacon when consent is granted', async () => {
    grantConsent();
    await mirrorMetaCapi('primary_conversion', 'evt-1', { value: 1, currency: 'EUR' });
    expect(navigator.sendBeacon).toHaveBeenCalledTimes(1);
    const [url, blob] = (navigator.sendBeacon as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(META_CAPI_ENDPOINT);
    expect(blob).toBeInstanceOf(Blob);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('falls back to fetch when sendBeacon returns false', async () => {
    grantConsent();
    (navigator.sendBeacon as ReturnType<typeof vi.fn>).mockReturnValue(false);
    await mirrorMetaCapi('primary_conversion', 'evt-1', { value: 1 });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(META_CAPI_ENDPOINT);
    expect(init).toMatchObject({ method: 'POST', keepalive: true });
  });

  it('swallows fetch errors without throwing', async () => {
    grantConsent();
    (navigator.sendBeacon as ReturnType<typeof vi.fn>).mockReturnValue(false);
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network down'));
    await expect(mirrorMetaCapi('primary_conversion', 'evt-1', {})).resolves.toBeUndefined();
  });

  it('includes user_data, custom_data, consent_state, event_source_url in the payload', async () => {
    grantConsent();
    setUserDataOnDOM({ email: 'alice@example.com', phone_number: '+447700900123' });
    document.title = 'Test Page';
    Object.defineProperty(window, 'location', {
      value: { href: 'https://example.com/test', pathname: '/test' },
      writable: true,
      configurable: true,
    });

    await mirrorMetaCapi('primary_conversion', 'evt-1', { value: 99, currency: 'EUR' });

    const [, blob] = (navigator.sendBeacon as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = await readBlobJSON<Record<string, unknown>>(blob);
    expect(body).toMatchObject({
      event_name: 'Lead',
      event_id: 'evt-1',
      event_source_url: 'https://example.com/test',
      user_data: {
        email: 'alice@example.com',
        phone_number: '+447700900123',
        client_user_agent: expect.any(String),
      },
      custom_data: { value: 99, currency: 'EUR' },
      consent_state: { ad_storage: 'granted', ad_user_data: 'granted' },
    });
    expect(body.event_time).toBeTypeOf('number');
  });

  it('passes through a valid _fbp cookie and drops malformed ones', async () => {
    grantConsent();
    document.cookie = '_fbp=fb.1.1700000000000.1234567890';
    await mirrorMetaCapi('primary_conversion', 'evt-fbp-ok', {});
    let body = await readBlobJSON<{ user_data: { fbp?: string } }>(
      (navigator.sendBeacon as ReturnType<typeof vi.fn>).mock.calls[0][1],
    );
    expect(body.user_data.fbp).toBe('fb.1.1700000000000.1234567890');

    // Clear both the cookie and the mock for a clean second leg.
    document.cookie = '_fbp=; Max-Age=0; path=/';
    (navigator.sendBeacon as ReturnType<typeof vi.fn>).mockClear();
    document.cookie = '_fbp=garbage';
    await mirrorMetaCapi('primary_conversion', 'evt-fbp-bad', {});
    body = await readBlobJSON<{ user_data: { fbp?: string } }>(
      (navigator.sendBeacon as ReturnType<typeof vi.fn>).mock.calls[0][1],
    );
    expect(body.user_data.fbp).toBeUndefined();
  });

  it('passes through a valid _fbc cookie and drops malformed ones', async () => {
    grantConsent();
    document.cookie = '_fbc=fb.1.1700000000000.fbcl1d_value';
    await mirrorMetaCapi('primary_conversion', 'evt-fbc-ok', {});
    const body = await readBlobJSON<{ user_data: { fbc?: string } }>(
      (navigator.sendBeacon as ReturnType<typeof vi.fn>).mock.calls[0][1],
    );
    expect(body.user_data.fbc).toBe('fb.1.1700000000000.fbcl1d_value');
  });

  it('PII raw payload reaches the server (where it will be hashed), but dataLayer remains untouched', async () => {
    grantConsent();
    setUserDataOnDOM({ email: 'alice@example.com' });
    await mirrorMetaCapi('primary_conversion', 'evt-1', {});
    expect((window.dataLayer || []).some((e) => JSON.stringify(e).includes('alice@example.com'))).toBe(
      false,
    );
  });
});
