import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  USER_DATA_ELEMENT_ID,
  USER_DATA_STORAGE_KEY,
  USER_DATA_TTL_MS,
} from '../../src/lib/tracking/config';
import {
  clearUserDataOnDOM,
  getConsentSnapshot,
  hasAdStorageConsent,
  hasFullAdsConsent,
  normalizePhoneE164,
  normalizeUserData,
  readUserDataFromDOM,
  restoreUserDataFromStorage,
  setUserDataOnDOM,
  trackEvent,
} from '../../src/lib/tracking/tracking';
import { denyConsent, grantConsent, partialConsent } from '../setup/vitest.setup';

describe('trackEvent', () => {
  it('returns a fresh event_id when none is provided', () => {
    const id = trackEvent('test_event', { foo: 'bar' });
    expect(id).toMatch(/^[a-f0-9-]{36}$/);
    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer![0]).toMatchObject({
      event: 'test_event',
      event_id: id,
      foo: 'bar',
    });
  });

  it('preserves a caller-provided event_id', () => {
    const id = trackEvent('test_event', { event_id: 'caller-supplied-id-123' });
    expect(id).toBe('caller-supplied-id-123');
    expect(window.dataLayer![0]).toMatchObject({ event_id: 'caller-supplied-id-123' });
  });

  it.each([
    'email',
    'phone',
    'phone_number',
    'first_name',
    'last_name',
    'name',
    'street',
    'city',
    'postal_code',
    'postcode',
    'em',
    'ph',
    'fn',
    'ln',
    'user_data',
    'user_email',
    'user_phone',
  ])('silently strips PII key "%s" from dataLayer push', (key) => {
    trackEvent('test_event', { [key]: 'sensitive-value' });
    const pushed = window.dataLayer![0];
    expect(pushed).not.toHaveProperty(key);
    expect(JSON.stringify(pushed)).not.toContain('sensitive-value');
  });

  it('keeps non-PII params on the push', () => {
    trackEvent('test_event', {
      value: 100,
      currency: 'EUR',
      service: 'translation',
      content_name: 'spanish lesson',
    });
    expect(window.dataLayer![0]).toMatchObject({
      value: 100,
      currency: 'EUR',
      service: 'translation',
      content_name: 'spanish lesson',
    });
  });

  it('warns in dev when PII is stripped', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    trackEvent('test_event', { email: 'who@example.com' });
    expect(warn).toHaveBeenCalled();
    process.env.NODE_ENV = originalEnv;
  });

  it('returns empty string and no-ops when window is undefined (SSR)', () => {
    const originalWindow = global.window;
    // @ts-expect-error simulate SSR
    delete global.window;
    expect(trackEvent('ssr_test')).toBe('');
    global.window = originalWindow;
  });
});

describe('setUserDataOnDOM / readUserDataFromDOM', () => {
  it('writes user data to a hidden DOM element', () => {
    setUserDataOnDOM({
      email: 'alice@example.com',
      phone_number: '+447700900123',
      first_name: 'Alice',
      last_name: 'Smith',
      city: 'London',
      postal_code: 'SW1A 1AA',
      country: 'GB',
    });
    const el = document.getElementById(USER_DATA_ELEMENT_ID);
    expect(el).not.toBeNull();
    expect(el!.dataset.email).toBe('alice@example.com');
    expect(el!.dataset.phone).toBe('+447700900123');
    expect(el!.dataset.firstName).toBe('Alice');
    expect(el!.dataset.lastName).toBe('Smith');
    expect(el!.style.display).toBe('none');
  });

  it('round-trips through readUserDataFromDOM', () => {
    setUserDataOnDOM({ email: 'bob@example.com', phone_number: '+36301234567' });
    const out = readUserDataFromDOM();
    expect(out).toMatchObject({ email: 'bob@example.com', phone_number: '+36301234567' });
  });

  it('does NOT write to localStorage without ad_storage consent', () => {
    denyConsent();
    setUserDataOnDOM({ email: 'noconsent@example.com' });
    expect(localStorage.getItem(USER_DATA_STORAGE_KEY)).toBeNull();
  });

  it('writes to localStorage when ad_storage consent is granted', () => {
    grantConsent();
    setUserDataOnDOM({ email: 'consent@example.com' });
    const raw = localStorage.getItem(USER_DATA_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.v).toBe(1);
    expect(parsed.savedAt).toBeTypeOf('number');
    expect(parsed.data.email).toBe('consent@example.com');
  });

  it('only requires ad_storage (not full ads consent) to persist', () => {
    partialConsent({ ad_storage: 'granted' });
    setUserDataOnDOM({ email: 'partial@example.com' });
    expect(localStorage.getItem(USER_DATA_STORAGE_KEY)).not.toBeNull();
  });

  it('merges new data with previously-stored fields', () => {
    grantConsent();
    setUserDataOnDOM({ email: 'a@b.com' });
    setUserDataOnDOM({ phone_number: '+447700900123' });
    const parsed = JSON.parse(localStorage.getItem(USER_DATA_STORAGE_KEY)!);
    expect(parsed.data.email).toBe('a@b.com');
    expect(parsed.data.phone_number).toBe('+447700900123');
  });
});

describe('restoreUserDataFromStorage', () => {
  it('repopulates the DOM element from a fresh stored blob', () => {
    grantConsent();
    localStorage.setItem(
      USER_DATA_STORAGE_KEY,
      JSON.stringify({
        v: 1,
        savedAt: Date.now(),
        data: { email: 'restored@example.com', phone_number: '+447700900123' },
      }),
    );
    restoreUserDataFromStorage();
    const el = document.getElementById(USER_DATA_ELEMENT_ID);
    expect(el?.dataset.email).toBe('restored@example.com');
    expect(el?.dataset.phone).toBe('+447700900123');
  });

  it('purges and ignores a blob older than USER_DATA_TTL_MS', () => {
    grantConsent();
    localStorage.setItem(
      USER_DATA_STORAGE_KEY,
      JSON.stringify({
        v: 1,
        savedAt: Date.now() - (USER_DATA_TTL_MS + 1000),
        data: { email: 'stale@example.com' },
      }),
    );
    restoreUserDataFromStorage();
    expect(localStorage.getItem(USER_DATA_STORAGE_KEY)).toBeNull();
    expect(document.getElementById(USER_DATA_ELEMENT_ID)).toBeNull();
  });

  it('drops a legacy/hand-edited blob safely', () => {
    grantConsent();
    localStorage.setItem(USER_DATA_STORAGE_KEY, '{"some": "junk"}');
    expect(() => restoreUserDataFromStorage()).not.toThrow();
    expect(localStorage.getItem(USER_DATA_STORAGE_KEY)).toBeNull();
  });

  it('handles broken JSON without throwing', () => {
    localStorage.setItem(USER_DATA_STORAGE_KEY, '{{not json');
    expect(() => restoreUserDataFromStorage()).not.toThrow();
  });
});

describe('clearUserDataOnDOM', () => {
  it('removes both the DOM element and the localStorage blob', () => {
    grantConsent();
    setUserDataOnDOM({ email: 'clearme@example.com' });
    expect(document.getElementById(USER_DATA_ELEMENT_ID)).not.toBeNull();
    expect(localStorage.getItem(USER_DATA_STORAGE_KEY)).not.toBeNull();
    clearUserDataOnDOM();
    expect(document.getElementById(USER_DATA_ELEMENT_ID)).toBeNull();
    expect(localStorage.getItem(USER_DATA_STORAGE_KEY)).toBeNull();
  });

  it('is safe to call when nothing has been stored', () => {
    expect(() => clearUserDataOnDOM()).not.toThrow();
  });
});

describe('getConsentSnapshot / hasAdStorageConsent / hasFullAdsConsent', () => {
  it('defaults to denied when google_tag_data is missing', () => {
    delete (window as { google_tag_data?: unknown }).google_tag_data;
    expect(getConsentSnapshot()).toEqual({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    });
    expect(hasAdStorageConsent()).toBe(false);
    expect(hasFullAdsConsent()).toBe(false);
  });

  it('reads granted state from ics.entries.update', () => {
    grantConsent();
    expect(getConsentSnapshot()).toEqual({
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
    });
    expect(hasAdStorageConsent()).toBe(true);
    expect(hasFullAdsConsent()).toBe(true);
  });

  it('hasFullAdsConsent requires both ad_storage AND ad_user_data', () => {
    partialConsent({ ad_storage: 'granted' });
    expect(hasFullAdsConsent()).toBe(false);
    partialConsent({ ad_user_data: 'granted' });
    expect(hasFullAdsConsent()).toBe(false);
    partialConsent({ ad_storage: 'granted', ad_user_data: 'granted' });
    expect(hasFullAdsConsent()).toBe(true);
  });

  it('falls back to ics.entries.default when no update is set', () => {
    Object.defineProperty(window, 'google_tag_data', {
      value: { ics: { entries: { ad_storage: { default: 'granted' } } } },
      writable: true,
      configurable: true,
    });
    expect(getConsentSnapshot().ad_storage).toBe('granted');
  });

  it('treats any non-"granted" value as denied', () => {
    Object.defineProperty(window, 'google_tag_data', {
      value: { ics: { entries: { ad_storage: { update: 'unknown' } } } },
      writable: true,
      configurable: true,
    });
    expect(getConsentSnapshot().ad_storage).toBe('denied');
  });
});

describe('normalizePhoneE164', () => {
  it.each([
    ['07700 900123', 'GB', '+447700900123'],
    ['07700-900-123', 'GB', '+447700900123'],
    ['+44 7700 900123', 'GB', '+447700900123'],
    ['447700900123', 'GB', '+447700900123'],
    ['06 30 123 4567', 'HU', '+36301234567'],
    ['+36 30 123 4567', 'HU', '+36301234567'],
    ['(030) 12345678', 'DE', '+493012345678'],
    ['(415) 555-2671', 'US', '+14155552671'],
    ['', 'GB', ''],
  ] as const)('normalizes %s (%s) → %s', (input, country, expected) => {
    expect(normalizePhoneE164(input, country)).toBe(expected);
  });
});

describe('normalizeUserData', () => {
  it('lowercases + trims string fields', () => {
    expect(
      normalizeUserData({
        email: '  Alice@Example.COM ',
        first_name: ' Alice ',
        last_name: 'Smith',
        city: 'LONDON',
      }),
    ).toMatchObject({
      email: 'alice@example.com',
      first_name: 'alice',
      last_name: 'smith',
      city: 'london',
    });
  });

  it('uppercases postal_code and strips whitespace', () => {
    expect(normalizeUserData({ postal_code: 'sw1a 1aa' }).postal_code).toBe('SW1A1AA');
  });

  it('E.164-normalises the phone using the country code', () => {
    expect(
      normalizeUserData({ phone_number: '07700 900123' }, 'GB').phone_number,
    ).toBe('+447700900123');
    expect(
      normalizeUserData({ phone_number: '06 30 123 4567' }, 'HU').phone_number,
    ).toBe('+36301234567');
  });

  it('always stamps the country', () => {
    expect(normalizeUserData({}, 'HU').country).toBe('HU');
  });
});

describe('SSR safety', () => {
  it('setUserDataOnDOM returns silently when document is undefined', () => {
    const originalDoc = global.document;
    // @ts-expect-error simulate SSR
    delete global.document;
    expect(() => setUserDataOnDOM({ email: 'ssr@example.com' })).not.toThrow();
    global.document = originalDoc;
  });

  it('restoreUserDataFromStorage returns silently when document is undefined', () => {
    const originalDoc = global.document;
    // @ts-expect-error simulate SSR
    delete global.document;
    expect(() => restoreUserDataFromStorage()).not.toThrow();
    global.document = originalDoc;
  });
});
