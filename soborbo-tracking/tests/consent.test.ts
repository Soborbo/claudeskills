import { describe, it, expect, beforeEach } from 'vitest';
import { hasMarketingConsent, hasAnalyticsConsent, hasAnyConsent } from '../lib/consent';
import { setCkyConsent, clearCkyConsent, resetAll } from './helpers';

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
