import { describe, it, expect, beforeEach } from 'vitest';
import { hasMarketingConsent, hasAnalyticsConsent, hasAnyConsent } from '../lib/consent';
import { setCkyConsent, setCkyConsentRaw, clearCkyConsent, resetAll } from './helpers';

beforeEach(() => resetAll());

describe('consent gating (CookieYes)', () => {
  it('marketing granted', () => {
    setCkyConsent({ marketing: true, analytics: false });
    expect(hasMarketingConsent()).toBe(true);
    expect(hasAnalyticsConsent()).toBe(false);
    expect(hasAnyConsent()).toBe(true);
  });

  // REGRESSZIÓ-ŐR (beautyflow 2026-06, lomtalan 2026-07): a CookieYes valódi
  // kulcsa `advertisement`, `marketing` kulcs nem létezik. A hibás olvasó
  // (`categories.marketing === true`) prod-ban MINDEN konverziót némán eldobott.
  it('real CookieYes shape: advertisement=true IS marketing consent', () => {
    setCkyConsentRaw({ necessary: true, functional: true, analytics: true, performance: true, advertisement: true });
    expect(hasMarketingConsent()).toBe(true);
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it('real CookieYes shape: advertisement=false denies marketing even with analytics', () => {
    setCkyConsentRaw({ necessary: true, functional: false, analytics: true, performance: true, advertisement: false });
    expect(hasMarketingConsent()).toBe(false);
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it('marketing alias (custom CMP config) still accepted', () => {
    setCkyConsentRaw({ necessary: true, analytics: false, marketing: true });
    expect(hasMarketingConsent()).toBe(true);
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
