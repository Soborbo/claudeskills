/**
 * Consent management via CookieYes
 */

declare global {
  interface Window {
    CookieYes?: {
      getConsent: () => Record<string, boolean>;
    };
  }
}

type ConsentCategory = 'analytics' | 'marketing' | 'functional' | 'necessary';

function getConsent(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  return window.CookieYes?.getConsent?.() || {};
}

export function hasAnalyticsConsent(): boolean {
  const consent = getConsent();
  return consent.analytics === true;
}

export function hasMarketingConsent(): boolean {
  const consent = getConsent();
  return consent.marketing === true;
}

export function onConsentChange(callback: (consent: Record<string, boolean>) => void): void {
  if (typeof window === 'undefined') return;
  document.addEventListener('cookieyes_consent_update', () => {
    callback(getConsent());
  });
}

export function waitForConsent(category: ConsentCategory, timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const consent = getConsent();
    if (consent[category] === true) {
      resolve(true);
      return;
    }

    const timer = setTimeout(() => resolve(false), timeoutMs);

    document.addEventListener('cookieyes_consent_update', () => {
      const updated = getConsent();
      if (updated[category] === true) {
        clearTimeout(timer);
        resolve(true);
      }
    }, { once: true });
  });
}
