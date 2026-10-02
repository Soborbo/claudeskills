/**
 * Consent management via CookieYes
 *
 * Reads the official CookieYes JS API: `window.getCkyConsent().categories`
 * (https://www.cookieyes.com/documentation/retrieving-consent-data-using-api-getckyconsent/).
 * There is NO `marketing` category: the ads/marketing category is
 * `advertisement`. Reading `marketing` returns `undefined` and silently kills
 * every ad conversion (this happened on live sites in 2026). Do not rename it
 * back. Same key set as Serverside/soborbo-tracking `lib/consent.ts`.
 *
 * Fail-closed: no CMP loaded or the API throws → no consent.
 */

declare global {
  interface Window {
    getCkyConsent?: () => {
      categories: Partial<Record<ConsentCategory, boolean>>;
    };
  }
}

export type ConsentCategory = 'necessary' | 'functional' | 'analytics' | 'performance' | 'advertisement';

function getConsent(): Partial<Record<ConsentCategory, boolean>> {
  if (typeof window === 'undefined') return {};
  if (typeof window.getCkyConsent !== 'function') return {};
  try {
    return window.getCkyConsent().categories ?? {};
  } catch {
    return {};
  }
}

export function hasAnalyticsConsent(): boolean {
  return getConsent().analytics === true;
}

/** Ad-tracking consent = CookieYes `advertisement` category. */
export function hasMarketingConsent(): boolean {
  return getConsent().advertisement === true;
}

export function onConsentChange(callback: (consent: Partial<Record<ConsentCategory, boolean>>) => void): void {
  if (typeof window === 'undefined') return;
  document.addEventListener('cookieyes_consent_update', () => {
    callback(getConsent());
  });
}

export function waitForConsent(category: ConsentCategory, timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    if (getConsent()[category] === true) {
      resolve(true);
      return;
    }

    const timer = setTimeout(() => resolve(false), timeoutMs);

    document.addEventListener('cookieyes_consent_update', () => {
      if (getConsent()[category] === true) {
        clearTimeout(timer);
        resolve(true);
      }
    }, { once: true });
  });
}
