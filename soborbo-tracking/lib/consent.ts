/**
 * Consent Management — CookieYes
 *
 * ┌─────────────────────┬────────────────────────────────────────────┐
 * │ Consent state       │ What is allowed                           │
 * ├─────────────────────┼────────────────────────────────────────────┤
 * │ No consent          │ NOTHING. No storage, no events, no beacon │
 * │ Analytics           │ GA4 events (scroll, steps, abandon)       │
 * │ Marketing           │ Meta, Google Ads, localStorage, PII       │
 * └─────────────────────┴────────────────────────────────────────────┘
 *
 * Every tracking function checks consent before doing anything.
 * If no CMP is detected in production → deny all (safe default).
 * Dev mode → allow all for testing convenience.
 */

declare global {
  interface Window {
    getCkyConsent?: () => {
      // CookieYes' REAL category set is { necessary, functional, analytics,
      // performance, advertisement }. `advertisement` IS the marketing/ads
      // category (Consent Mode v2: ad_storage / ad_user_data /
      // ad_personalization). There is NO `marketing` key — reading it returns
      // undefined, so a naive `categories.marketing === true` check silently
      // denies EVERY conversion in production while dev (no CMP → allow-all
      // fallback) keeps passing. This exact bug shipped twice (beautyflow.pro,
      // lomtalan.hu) and cost weeks of zero Ads conversions each time.
      // `marketing` is kept optional only for CMP configs that alias it.
      categories: {
        analytics?: boolean;
        advertisement?: boolean;
        marketing?: boolean;
        performance?: boolean;
        functional?: boolean;
        necessary?: boolean;
      };
    };
  }
}

export type ConsentCategory = 'analytics' | 'marketing' | 'functional' | 'necessary';

function getCookieYesConsent(): Record<ConsentCategory, boolean> | null {
  if (typeof window === 'undefined') return null;
  if (typeof window.getCkyConsent !== 'function') return null;
  try {
    const cats = window.getCkyConsent().categories as Record<string, boolean | undefined>;
    return {
      analytics: cats.analytics === true,
      // CookieYes' "advertisement" category IS marketing consent; accept the
      // `marketing` alias too so custom CMP configs keep working.
      marketing: cats.advertisement === true || cats.marketing === true,
      functional: cats.functional === true,
      necessary: cats.necessary === true,
    };
  } catch { return null; }
}

function isDevMode(): boolean {
  try { return typeof import.meta !== 'undefined' && !!import.meta.env?.DEV; }
  catch { return false; }
}

export function hasMarketingConsent(): boolean {
  const c = getCookieYesConsent();
  if (!c) return isDevMode();
  return c.marketing === true;
}

export function hasAnalyticsConsent(): boolean {
  const c = getCookieYesConsent();
  if (!c) return isDevMode();
  return c.analytics === true;
}

/** Any non-essential tracking allowed? */
export function hasAnyConsent(): boolean {
  return hasAnalyticsConsent() || hasMarketingConsent();
}

export function onConsentChange(
  callback: (consent: Record<ConsentCategory, boolean>) => void,
): void {
  document.addEventListener('cookieyes_consent_update', () => {
    const c = getCookieYesConsent();
    if (c) callback(c);
  });
}

export function waitForConsent(
  category: ConsentCategory,
  timeoutMs = 5_000,
): Promise<boolean> {
  return new Promise((resolve) => {
    const c = getCookieYesConsent();
    if (c?.[category]) { resolve(true); return; }
    const handler = () => {
      if (getCookieYesConsent()?.[category]) {
        document.removeEventListener('cookieyes_consent_update', handler);
        resolve(true);
      }
    };
    document.addEventListener('cookieyes_consent_update', handler);
    setTimeout(() => {
      document.removeEventListener('cookieyes_consent_update', handler);
      resolve(false);
    }, timeoutMs);
  });
}
