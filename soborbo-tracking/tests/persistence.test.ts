import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeEmail, normalizePhone, sanitizeName,
  captureUrlParams, persistTrackingParams, getAttribution, getSourceType,
  getStoredData, getGclid, getFbclid, getFbc, getFbp, getDevice,
  getAllTrackingData, getSessionId, getPageUrl, clearTrackingData,
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

describe('normalizePhone — bilingual UK + HU', () => {
  it('UK 07… → +447… (auto-detect, regardless of config)', () => {
    expect(normalizePhone('07123 456789')).toBe('+447123456789');
  });
  it('HU 06… → +36… (auto-detect, regardless of config)', () => {
    expect(normalizePhone('06 20 123 4567')).toBe('+36201234567');
  });
  it('keeps already-international (+)', () => {
    expect(normalizePhone('+44 7123 456789')).toBe('+447123456789');
    expect(normalizePhone('+36 20 123 4567')).toBe('+36201234567');
  });
  it('ambiguous bare number uses the configured country', () => {
    // HU site
    expect(normalizePhone('20 123 4567', 'HU')).toBe('+36201234567');
    // UK site
    expect(normalizePhone('7123 456789', 'GB')).toBe('+447123456789');
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

describe('normalizePhone — remaining market branches', () => {
  it('HU: bare 36-prefixed and single-0 trunk numbers', () => {
    expect(normalizePhone('36 20 123 4567', 'HU')).toBe('+36201234567');
    expect(normalizePhone('0201234567', 'HU')).toBe('+36201234567');
  });
  it('GB: bare 44-prefixed and 0-trunk numbers', () => {
    expect(normalizePhone('44 7123 456789', 'GB')).toBe('+447123456789');
    expect(normalizePhone('0123 456 789', 'GB')).toBe('+44123456789');
  });
  it('strips punctuation: parentheses, dots, dashes', () => {
    expect(normalizePhone('(07123) 456-789.', 'GB')).toBe('+447123456789');
  });
});

describe('getAllTrackingData — URL wins per field, storage fills the gaps', () => {
  it('merges URL and stored values field-by-field', () => {
    setUrl('/lp?gclid=STOREDG&utm_source=google&utm_campaign=brand');
    captureUrlParams(); persistTrackingParams();
    setUrl('/inner?utm_source=retarget&gbraid=GB9');
    const t = getAllTrackingData();
    expect(t.utm_source).toBe('retarget');   // URL wins
    expect(t.gbraid).toBe('GB9');            // URL-only field
    expect(t.gclid).toBe('STOREDG');         // storage fills
    expect(t.utm_campaign).toBe('brand');    // storage fills
  });
});

describe('sessions', () => {
  it('stable id within the 30-minute window (sessionStorage, analytics consent)', () => {
    const a = getSessionId();
    expect(getSessionId()).toBe(a);
    expect(a).toMatch(/^sess_/);
  });

  it('a stale session (>30 min inactivity) rotates the id', () => {
    const a = getSessionId();
    const raw = JSON.parse(sessionStorage.getItem('sb_session')!);
    raw.lastActivity = Date.now() - 31 * 60 * 1000;
    sessionStorage.setItem('sb_session', JSON.stringify(raw));
    expect(getSessionId()).not.toBe(a);
  });

  it('corrupted session JSON → fresh session instead of a crash', () => {
    sessionStorage.setItem('sb_session', '{not-json');
    expect(getSessionId()).toMatch(/^sess_/);
  });

  it('without any consent: memory-only session, stable across calls, nothing in sessionStorage', () => {
    setCkyConsent({ analytics: false, marketing: false });
    const a = getSessionId();
    expect(getSessionId()).toBe(a);
    expect(sessionStorage.getItem('sb_session')).toBeNull();
  });
});

describe('stored-data hygiene', () => {
  it('corrupted sb_tracking JSON → null AND the key is removed', () => {
    localStorage.setItem('sb_tracking', '{broken');
    expect(getStoredData()).toBeNull();
    expect(localStorage.getItem('sb_tracking')).toBeNull();
  });

  it('fbclidAt is NOT re-stamped when the same fbclid persists again (fbc timestamp must not drift)', () => {
    setUrl('/?fbclid=SAME'); captureUrlParams(); persistTrackingParams();
    const first = getStoredData()!.fbclidAt!;
    expect(first).toBeGreaterThan(0);
    setUrl('/?fbclid=SAME&utm_source=meta'); captureUrlParams(); persistTrackingParams();
    expect(getStoredData()!.fbclidAt).toBe(first);
  });

  it('a NEW fbclid re-stamps the capture time and replaces the id', () => {
    setUrl('/?fbclid=ONE'); captureUrlParams(); persistTrackingParams();
    const first = getStoredData()!.fbclidAt!;
    setUrl('/?fbclid=TWO'); captureUrlParams(); persistTrackingParams();
    expect(getStoredData()!.fbclid).toBe('TWO');
    expect(getStoredData()!.fbclidAt).toBeGreaterThanOrEqual(first);
  });

  it('landingPage is first-touch: kept from the first persist', () => {
    setUrl('/landing?gclid=G1'); captureUrlParams(); persistTrackingParams();
    setUrl('/deeper?utm_source=x'); captureUrlParams(); persistTrackingParams();
    expect(getStoredData()!.landingPage).toBe('/landing');
  });

  it('corrupted first-touch JSON is ignored by getAttribution', () => {
    localStorage.setItem('sb_first_touch', '{broken');
    setUrl('/?utm_source=last'); captureUrlParams(); persistTrackingParams();
    const a = getAttribution();
    expect(a.first_utm_source).toBeUndefined();
    expect(a.last_utm_source).toBe('last');
  });

  it('clearTrackingData wipes tracking, first-touch and the session', () => {
    setUrl('/?gclid=G'); captureUrlParams(); persistTrackingParams();
    const sid = getSessionId();
    clearTrackingData();
    expect(getStoredData()).toBeNull();
    expect(localStorage.getItem('sb_first_touch')).toBeNull();
    expect(getSessionId()).not.toBe(sid);
  });
});

describe('getDevice / getPageUrl — exact breakpoints', () => {
  const setWidth = (w: number) => Object.defineProperty(window, 'innerWidth', { configurable: true, value: w, writable: true });

  it('mobile <768, tablet <1024, desktop otherwise', () => {
    setWidth(500); expect(getDevice()).toBe('mobile');
    setWidth(767); expect(getDevice()).toBe('mobile');
    setWidth(768); expect(getDevice()).toBe('tablet');
    setWidth(1023); expect(getDevice()).toBe('tablet');
    setWidth(1024); expect(getDevice()).toBe('desktop');
  });

  it('getPageUrl is origin+pathname WITHOUT the query (no click IDs leak into page_url)', () => {
    setUrl('/arkalkulator/?gclid=SECRET');
    expect(getPageUrl()).not.toContain('SECRET');
    expect(getPageUrl()).toContain('/arkalkulator/');
  });
});

describe('getSourceType — remaining branches', () => {
  it('gbraid → paid; cpc → paid; social → social; referral medium / bare source → referral', () => {
    setUrl('/?gbraid=GB'); captureUrlParams(); persistTrackingParams();
    expect(getSourceType()).toBe('paid');
    resetAll(); setCkyConsent({ marketing: true, analytics: true });
    setUrl('/?utm_source=g&utm_medium=cpc'); captureUrlParams(); persistTrackingParams();
    expect(getSourceType()).toBe('paid');
    resetAll(); setCkyConsent({ marketing: true, analytics: true });
    setUrl('/?utm_source=fb&utm_medium=social'); captureUrlParams(); persistTrackingParams();
    expect(getSourceType()).toBe('social');
    resetAll(); setCkyConsent({ marketing: true, analytics: true });
    setUrl('/?utm_source=partner&utm_medium=referral'); captureUrlParams(); persistTrackingParams();
    expect(getSourceType()).toBe('referral');
    resetAll(); setCkyConsent({ marketing: true, analytics: true });
    setUrl('/?utm_source=partner'); captureUrlParams(); persistTrackingParams();
    expect(getSourceType()).toBe('referral');
  });
});

describe('session id fallback without crypto', () => {
  it('still mints a sess_ id', async () => {
    const { vi } = await import('vitest');
    vi.stubGlobal('crypto', undefined);
    try {
      sessionStorage.removeItem('sb_session');
      expect(getSessionId()).toMatch(/^sess_/);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
