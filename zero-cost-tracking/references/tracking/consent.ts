/**
 * Zero-Cost Tracking v2 - Consent Helper
 *
 * READ-ONLY helper for CookieYes consent state.
 * GTM/Zaraz are the AUTHORITY for firing tags.
 * This module is for localStorage/UI decisions only.
 */

// =============================================================================
// Types
// =============================================================================

export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  necessary: boolean;
}

export type ConsentCategory = 'analytics' | 'marketing' | 'functional';

// =============================================================================
// Window Augmentation
// =============================================================================

declare global {
  interface Window {
    getCkyConsent?: () => {
      categories: {
        analytics: boolean;
        advertisement: boolean;
        functional: boolean;
        necessary: boolean;
      };
    };
  }
}

// =============================================================================
// Consent Reading
// =============================================================================

/**
 * Get current consent state from CookieYes
 *
 * Returns safe defaults if CMP not loaded:
 * - DEV mode: all consent granted (for testing)
 * - PROD mode: all consent denied (safe default)
 */
export function getConsentState(): ConsentState {
  if (typeof window === 'undefined') {
    return {
      analytics: false,
      marketing: false,
      functional: false,
      necessary: true,
    };
  }

  // DEV mode fallback
  if (import.meta.env?.DEV && !window.getCkyConsent) {
    console.debug('[Tracking] CookieYes not loaded - DEV mode: granting all consent');
    return {
      analytics: true,
      marketing: true,
      functional: true,
      necessary: true,
    };
  }

  // CMP not loaded = deny (safe default)
  if (!window.getCkyConsent) {
    return {
      analytics: false,
      marketing: false,
      functional: false,
      necessary: true,
    };
  }

  try {
    const cky = window.getCkyConsent();
    return {
      analytics: cky.categories.analytics ?? false,
      marketing: cky.categories.advertisement ?? false,
      functional: cky.categories.functional ?? false,
      necessary: cky.categories.necessary ?? true,
    };
  } catch (error) {
    console.error('[Tracking] Error reading consent:', error);
    return {
      analytics: false,
      marketing: false,
      functional: false,
      necessary: true,
    };
  }
}

/**
 * Check if marketing consent is granted
 * Required for: localStorage persistence, attribution capture
 */
export function hasMarketingConsent(): boolean {
  return getConsentState().marketing;
}

/**
 * Check if analytics consent is granted
 * Required for: session ID generation
 */
export function hasAnalyticsConsent(): boolean {
  return getConsentState().analytics;
}

/**
 * Get consent state as string for Sheets
 * Format: 'none' | 'analytics' | 'marketing' | 'analytics+marketing'
 */
export function getConsentStateLabel(): string {
  const state = getConsentState();

  if (state.analytics && state.marketing) return 'analytics+marketing';
  if (state.analytics) return 'analytics';
  if (state.marketing) return 'marketing';
  return 'none';
}

// =============================================================================
// Consent Change Listener
// =============================================================================

type ConsentCallback = (state: ConsentState) => void;
const callbacks = new Set<ConsentCallback>();
let listenerInitialized = false;

/**
 * Initialize CookieYes event listener
 */
function initListener(): void {
  if (listenerInitialized || typeof document === 'undefined') return;
  listenerInitialized = true;

  document.addEventListener('cookieyes_consent_update', () => {
    const state = getConsentState();
    callbacks.forEach((cb) => {
      try {
        cb(state);
      } catch (error) {
        console.error('[Tracking] Consent callback error:', error);
      }
    });
  });
}

/**
 * Register callback for consent changes
 * @returns Cleanup function
 */
export function onConsentChange(callback: ConsentCallback): () => void {
  initListener();
  callbacks.add(callback);

  return () => {
    callbacks.delete(callback);
  };
}

/**
 * Wait for specific consent to be granted
 * @param category - Consent category to wait for
 * @param timeoutMs - Timeout (0 = no timeout)
 */
export function waitForConsent(
  category: ConsentCategory,
  timeoutMs = 0
): Promise<boolean> {
  return new Promise((resolve) => {
    // Already granted?
    const current = getConsentState();
    if (current[category]) {
      resolve(true);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = onConsentChange((state) => {
      if (state[category]) {
        if (timeoutId) clearTimeout(timeoutId);
        cleanup();
        resolve(true);
      }
    });

    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeoutMs);
    }
  });
}
