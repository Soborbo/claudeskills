import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { hasMarketingConsent, hasAnalyticsConsent, hasAnyConsent, onConsentChange, waitForConsent } from '../lib/consent';
import { setCkyConsent, setCkyConsentRaw, clearCkyConsent, resetAll } from './helpers';

beforeEach(() => resetAll());

describe('consent gating (CookieYes)', () => {
  it('marketing granted', () => {
    setCkyConsent({ marketing: true, analytics: false });
    expect(hasMarketingConsent()).toBe(true);
    expect(hasAnalyticsConsent()).toBe(false);
    expect(hasAnyConsent()).toBe(true);
  });

  it('analytics granted only', () => {
    setCkyConsent({ marketing: false, analytics: true });
    expect(hasMarketingConsent()).toBe(false);
    expect(hasAnalyticsConsent()).toBe(true);
    expect(hasAnyConsent()).toBe(true);
  });

  it('all denied', () => {
    setCkyConsent({ marketing: false, analytics: false });
    expect(hasMarketingConsent()).toBe(false);
    expect(hasAnalyticsConsent()).toBe(false);
    expect(hasAnyConsent()).toBe(false);
  });

  it('no CMP present → falls back to dev-mode flag (vitest DEV=true)', () => {
    clearCkyConsent();
    // import.meta.env.DEV igaz vitest alatt → dev fallback enged
    expect(typeof hasMarketingConsent()).toBe('boolean');
  });
});

// REGRESSZIÓ-ŐR (beautyflow 2026-06, lomtalan 2026-07): a CookieYes valódi
// kategóriakészlete {necessary, functional, analytics, performance,
// advertisement} — `marketing` kulcs NEM létezik. A hibás olvasó
// (`categories.marketing === true`) prod-ban MINDEN konverziót némán eldobott,
// miközben dev-ben (CMP nélkül, allow-all fallback) minden zöld volt.
describe('real CookieYes category shape — the full matrix', () => {
  const shape = (advertisement: boolean, analytics: boolean) => ({
    necessary: true, functional: true, performance: analytics, analytics, advertisement,
  });

  it.each([
    // [advertisement, analytics, expectMarketing, expectAnalytics]
    [true, true, true, true],
    [true, false, true, false],
    [false, true, false, true],
    [false, false, false, false],
  ])('advertisement=%s analytics=%s → marketing=%s analytics=%s', (adv, ana, expMkt, expAna) => {
    setCkyConsentRaw(shape(adv as boolean, ana as boolean));
    expect(hasMarketingConsent()).toBe(expMkt);
    expect(hasAnalyticsConsent()).toBe(expAna);
    expect(hasAnyConsent()).toBe((expMkt as boolean) || (expAna as boolean));
  });

  it('full accept (the exact live lomtalan.hu shape after banner accept) grants marketing', () => {
    // Ez a window.getCkyConsent().categories szó szerinti éles kimenete.
    setCkyConsentRaw({ necessary: true, functional: true, analytics: true, performance: true, advertisement: true });
    expect(hasMarketingConsent()).toBe(true);
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it('marketing alias (custom CMP config) still accepted', () => {
    setCkyConsentRaw({ necessary: true, analytics: false, marketing: true });
    expect(hasMarketingConsent()).toBe(true);
  });

  it('either key grants: advertisement OR the marketing alias', () => {
    setCkyConsentRaw({ advertisement: true, marketing: false, analytics: false });
    expect(hasMarketingConsent()).toBe(true);
    setCkyConsentRaw({ advertisement: false, marketing: true, analytics: false });
    expect(hasMarketingConsent()).toBe(true);
    setCkyConsentRaw({ advertisement: false, marketing: false, analytics: false });
    expect(hasMarketingConsent()).toBe(false);
  });

  it('performance/functional/necessary NEVER grant marketing or analytics', () => {
    setCkyConsentRaw({ necessary: true, functional: true, performance: true, analytics: false, advertisement: false });
    expect(hasMarketingConsent()).toBe(false);
    expect(hasAnalyticsConsent()).toBe(false);
    expect(hasAnyConsent()).toBe(false);
  });

  it('CMP present with empty categories → deny (NOT the dev fallback)', () => {
    setCkyConsentRaw({});
    expect(hasMarketingConsent()).toBe(false);
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('truthy-but-not-true values do not grant (strict === true)', () => {
    setCkyConsentRaw({ advertisement: 'yes' as unknown as boolean, analytics: 1 as unknown as boolean });
    expect(hasMarketingConsent()).toBe(false);
    expect(hasAnalyticsConsent()).toBe(false);
  });
});

describe('malformed CMP responses', () => {
  it('getCkyConsent throwing → dev fallback (never crashes the caller)', () => {
    (window as unknown as { getCkyConsent: () => unknown }).getCkyConsent = () => { throw new Error('cmp boot race'); };
    expect(typeof hasMarketingConsent()).toBe('boolean');
    expect(typeof hasAnalyticsConsent()).toBe('boolean');
  });

  it('getCkyConsent returning no categories object → dev fallback, no crash', () => {
    (window as unknown as { getCkyConsent: () => unknown }).getCkyConsent = () => ({});
    expect(typeof hasMarketingConsent()).toBe('boolean');
  });
});

describe('onConsentChange — the mapped record is what consumers receive', () => {
  it('callback gets marketing:true from a REAL-shape advertisement grant (initTracking contract)', () => {
    // initTracking (index.ts) a callback `c.marketing` mezőjére támaszkodik a
    // persistTrackingParams indításához — a mapping nélkül a valós CMP-alak
    // mellett SOSEM futna le (ez volt a gclid-perzisztencia fele a bugnak).
    setCkyConsentRaw({ necessary: true, functional: true, analytics: true, performance: true, advertisement: true });
    const seen: Array<Record<string, boolean>> = [];
    onConsentChange((c) => { seen.push(c); });
    document.dispatchEvent(new Event('cookieyes_consent_update'));
    expect(seen).toHaveLength(1);
    expect(seen[0].marketing).toBe(true);
    expect(seen[0].analytics).toBe(true);
  });

  it('denied-ads update maps to marketing:false', () => {
    setCkyConsentRaw({ necessary: true, analytics: true, advertisement: false });
    const seen: Array<Record<string, boolean>> = [];
    onConsentChange((c) => { seen.push(c); });
    document.dispatchEvent(new Event('cookieyes_consent_update'));
    expect(seen[0].marketing).toBe(false);
    expect(seen[0].analytics).toBe(true);
  });
});

describe('waitForConsent', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('resolves true immediately when the category is already granted (real shape)', async () => {
    setCkyConsentRaw({ necessary: true, analytics: false, advertisement: true });
    await expect(waitForConsent('marketing')).resolves.toBe(true);
  });

  it('resolves true when the grant arrives via cookieyes_consent_update', async () => {
    setCkyConsentRaw({ necessary: true, analytics: false, advertisement: false });
    const p = waitForConsent('marketing', 5000);
    setCkyConsentRaw({ necessary: true, analytics: false, advertisement: true });
    document.dispatchEvent(new Event('cookieyes_consent_update'));
    await expect(p).resolves.toBe(true);
  });

  it('resolves false on timeout when consent never arrives', async () => {
    vi.useFakeTimers();
    setCkyConsentRaw({ necessary: true, analytics: false, advertisement: false });
    const p = waitForConsent('marketing', 1000);
    vi.advanceTimersByTime(1001);
    await expect(p).resolves.toBe(false);
  });
});
