/**
 * Consent Management
 * CookieYes / más CMP integrációhoz
 * 
 * Ez a modul biztosítja, hogy tracking CSAK consent után történjen.
 */

declare global {
  interface Window {
    // CookieYes
    getCkyConsent?: () => {
      categories: {
        analytics: boolean;
        marketing: boolean;
        functional: boolean;
        necessary: boolean;
      };
    };
    
    // Google Consent Mode
    gtag?: (...args: unknown[]) => void;
  }
}

export type ConsentCategory = 'analytics' | 'marketing' | 'functional' | 'necessary';

/**
 * Consent státusz lekérése CookieYes-ből
 */
function getCookieYesConsent(): Record<ConsentCategory, boolean> | null {
  if (typeof window.getCkyConsent !== 'function') {
    return null;
  }
  
  try {
    const consent = window.getCkyConsent();
    return consent.categories;
  } catch {
    return null;
  }
}

/**
 * Marketing consent ellenőrzése
 * 
 * Ha nincs CMP betöltve, VISSZAUTASÍT (safe default)
 */
export function hasMarketingConsent(): boolean {
  const consent = getCookieYesConsent();
  
  // Ha nincs CMP → safe default: no consent
  if (!consent) {
    // Development mode-ban engedélyezhetjük teszteléshez
    if (import.meta.env.DEV) {
      console.warn('[Consent] No CMP found, allowing in dev mode');
      return true;
    }
    return false;
  }
  
  return consent.marketing === true;
}

/**
 * Analytics consent ellenőrzése
 */
export function hasAnalyticsConsent(): boolean {
  const consent = getCookieYesConsent();
  
  if (!consent) {
    if (import.meta.env.DEV) {
      return true;
    }
    return false;
  }
  
  return consent.analytics === true;
}

/**
 * Bármilyen tracking consent ellenőrzése
 * (marketing VAGY analytics)
 */
export function canTrack(): boolean {
  return hasMarketingConsent() || hasAnalyticsConsent();
}

/**
 * Consent change listener
 * CookieYes "consent_updated" event-re figyel
 */
export function onConsentChange(callback: (consent: Record<ConsentCategory, boolean>) => void): void {
  // CookieYes custom event
  document.addEventListener('cookieyes_consent_update', () => {
    const consent = getCookieYesConsent();
    if (consent) {
      callback(consent);
    }
  });
}

/**
 * Várakozás consent-re (Promise-based)
 * Hasznos ha a tracking-et consent után akarod futtatni
 */
export function waitForConsent(category: ConsentCategory, timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    // Már megvan?
    const consent = getCookieYesConsent();
    if (consent && consent[category]) {
      resolve(true);
      return;
    }
    
    // Listener
    const handler = () => {
      const newConsent = getCookieYesConsent();
      if (newConsent && newConsent[category]) {
        document.removeEventListener('cookieyes_consent_update', handler);
        resolve(true);
      }
    };
    
    document.addEventListener('cookieyes_consent_update', handler);
    
    // Timeout
    setTimeout(() => {
      document.removeEventListener('cookieyes_consent_update', handler);
      resolve(false);
    }, timeoutMs);
  });
}
