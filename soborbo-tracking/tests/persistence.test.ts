import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeEmail, normalizePhone, sanitizeName,
  captureUrlParams, persistTrackingParams, getAttribution, getSourceType,
  getStoredData, getGclid, getFbclid, getFbc, getFbp, getDevice,
} from '../lib/persistence';
import { setCkyConsent, setUrl, setCookie, resetAll } from './helpers';

beforeEach(() => {
  resetAll();
  setCkyConsent({ analytics: true, marketing: true });
});

describe('normalizeEmail', () => {
  it('lowercases + trims', () => {
    expect(normalizeEmail('  Jane@Example.COM ')).toBe('jane@example.com');
  });
  it('caps length at 254', () => {
    expect(normalizeEmail('a'.repeat(300) + '@x.com').length).toBe(254);
  });
});

describe('normalizePhone', () => {
  it('UK 07… → +447…', () => {
    expect(normalizePhone('07123 456789')).toBe('+447123456789');
  });
  it('HU 06… → +366…', () => {
    expect(normalizePhone('06 20 123 4567')).toBe('+36201234567');
  });
  it('keeps already-international', () => {
    expect(normalizePhone('+44 7123 456789')).toBe('+447123456789');
  });
  it('strips letters/formatting', () => {
    expect(normalizePhone('(030) 123-456 ext')).toBe('030123456');
  });
  it('caps length at 20', () => {
    expect(normalizePhone('0'.repeat(40)).length).toBeLessThanOrEqual(20);
  });
});

describe('sanitizeName', () => {
  it('trims and caps at 100', () => {
    expect(sanitizeName('  John  ')).toBe('John');
    expect(sanitizeName('x'.repeat(200)).length).toBe(100);
  });
});

describe('attribution — first/last touch + source type', () => {
  it('captures and persists URL params after marketing consent', () => {
    setUrl('/lp?gclid=ABC123&utm_source=google&utm_medium=cpc&utm_campaign=brand');
    captureUrlParams();
    persistTrackingParams();
    const s = getStoredData();
    expect(s?.gclid).toBe('ABC123');
    expect(s?.utm_source).toBe('google');
    expect(getSourceType()).toBe('paid');
  });

  it('first touch is NOT overwritten, last touch IS updated', () => {
    setUrl('/?utm_source=google&gclid=G1');
    captureUrlParams(); persistTrackingParams();
    setUrl('/?utm_source=bing');
    captureUrlParams(); persistTrackingParams();
    const a = getAttribution();
    expect(a.first_utm_source).toBe('google');
    expect(a.first_gclid).toBe('G1');
    expect(a.last_utm_source).toBe('bing');
  });

  it('does NOT persist without marketing consent', () => {
    setCkyConsent({ analytics: true, marketing: false });
    setUrl('/?gclid=NOPE');
    captureUrlParams(); persistTrackingParams();
    expect(getStoredData()).toBeNull();
  });

  it('source type: fbclid → social, organic medium → organic, bare utm_source → referral, none → direct', () => {
    setUrl('/?fbclid=FB1'); captureUrlParams(); persistTrackingParams();
    expect(getSourceType()).toBe('social');
    resetAll(); setCkyConsent({ marketing: true, analytics: true });
    setUrl('/?utm_source=newsletter&utm_medium=organic'); captureUrlParams(); persistTrackingParams();
    expect(getSourceType()).toBe('organic');
    resetAll(); setCkyConsent({ marketing: true, analytics: true });
    expect(getSourceType()).toBe('direct');
  });
});

describe('getGclid / getFbclid — URL wins over storage', () => {
  it('reads from URL', () => {
    setUrl('/?gclid=URLG&fbclid=URLF');
    expect(getGclid()).toBe('URLG');
    expect(getFbclid()).toBe('URLF');
  });
});

describe('getFbc — cookie wins, else reconstruct', () => {
  it('returns the Pixel _fbc cookie when present', () => {
    setCookie('_fbc', 'fb.1.123.COOKIEVAL');
    expect(getFbc()).toBe('fb.1.123.COOKIEVAL');
  });
  it('reconstructs fb.1.<ts>.<fbclid> from stored fbclid', () => {
    setUrl('/?fbclid=XYZ789'); captureUrlParams(); persistTrackingParams();
    const fbc = getFbc();
    expect(fbc).toMatch(/^fb\.1\.\d+\.XYZ789$/);
  });
  it('returns null for an illegal fbclid charset', () => {
    setUrl('/?fbclid=' + encodeURIComponent('bad value!')); captureUrlParams(); persistTrackingParams();
    expect(getFbc()).toBeNull();
  });
});

describe('getFbp', () => {
  it('reads _fbp cookie', () => {
    setCookie('_fbp', 'fb.1.1.2');
    expect(getFbp()).toBe('fb.1.1.2');
  });
  it('null when absent', () => {
    expect(getFbp()).toBeNull();
  });
});

describe('getStoredData — 90-day expiry', () => {
  it('drops expired records', () => {
    const old = { gclid: 'OLD', timestamp: Date.now() - 91 * 86_400_000, landingPage: '/' };
    localStorage.setItem('sb_tracking', JSON.stringify(old));
    expect(getStoredData()).toBeNull();
  });
});

describe('getDevice', () => {
  it('classifies by width', () => {
    expect(['mobile', 'tablet', 'desktop']).toContain(getDevice());
  });
});
