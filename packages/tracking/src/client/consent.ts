/**
 * @leadgen/tracking - Consent Module
 *
 * CookieYes consent management integration.
 * CLIENT-ONLY - Do not import in server context.
 */

import type { ConsentState, ConsentChangeCallback } from '../types';

// =============================================================================
// Browser Guard
// =============================================================================

const IS_BROWSER = typeof window !== 'undefined';

if (!IS_BROWSER) {
  console.warn('[Tracking] @leadgen/tracking/client/consent should only be imported in browser context');
}

// =============================================================================
// Internal State
// =============================================================================

/** Registered consent change callbacks */
const consentCallbacks: Set<ConsentChangeCallback> = new Set();

/** Whether consent listener has been initialized */
let listenerInitialized = false;

// =============================================================================
// Consent Reading
// =============================================================================

/**
 * Get current consent state from CookieYes
 *
 * @returns Current consent state
 */
export function getConsentState(): ConsentState {
  // Development mode fallback - allow tracking for testing
  if (import.meta.env?.DEV) {
    if (!window.getCkyConsent) {
      console.warn('[Tracking] CookieYes not loaded - DEV mode: allowing all consent');
      return {
        analytics: true,
        marketing: true,
        functional: true,
        necessary: true,
      };
    }
  }

  // Production: if CMP not loaded, safe default is deny
  if (!window.getCkyConsent) {
    return {
      analytics: false,
      marketing: false,
      functional: false,
      necessary: true,
    };
  }

  try {
    const ckyConsent = window.getCkyConsent();
    return {
      analytics: ckyConsent.categories.analytics ?? false,
      marketing: ckyConsent.categories.advertisement ?? false,
      functional: ckyConsent.categories.functional ?? false,
      necessary: ckyConsent.categories.necessary ?? true,
    };
  } catch (error) {
    console.error('[Tracking] Error reading CookieYes consent:', error);
    return {
      analytics: false,
      marketing: false,
      functional: false,
      necessary: true,
    };
  }
}

/**
 * Check if user has granted marketing/advertising consent
 *
 * Required for: Google Ads conversions, remarketing, Meta CAPI
 */
export function hasMarketingConsent(): boolean {
  return getConsentState().marketing;
}

/**
 * Check if user has granted analytics consent
 *
 * Required for: GA4 page views and events
 */
export function hasAnalyticsConsent(): boolean {
  return getConsentState().analytics;
}

/**
 * Check if user has granted functional consent
 *
 * Required for: Enhanced features, preferences
 */
export function hasFunctionalConsent(): boolean {
  return getConsentState().functional;
}

// =============================================================================
// Consent Change Listener
// =============================================================================

/**
 * Initialize consent change listener
 */
function initConsentListener(): void {
  if (listenerInitialized) return;
  listenerInitialized = true;

  // CookieYes fires this event when consent changes
  document.addEventListener('cookieyes_consent_update', () => {
    const consent = getConsentState();

    // Notify all registered callbacks
    consentCallbacks.forEach((callback) => {
      try {
        callback(consent);
      } catch (error) {
        console.error('[Tracking] Error in consent callback:', error);
      }
    });
  });
}

/**
 * Register callback for consent changes
 *
 * @param callback - Function to call when consent changes
 * @returns Cleanup function to unregister callback
 *
 * @example
 * const cleanup = onConsentChange((consent) => {
 *   if (consent.marketing) {
 *     // Enable marketing tracking
 *   }
 * });
 *
 * // Later: cleanup();
 */
export function onConsentChange(callback: ConsentChangeCallback): () => void {
  initConsentListener();

  consentCallbacks.add(callback);

  // Return cleanup function
  return () => {
    consentCallbacks.delete(callback);
  };
}

/**
 * Wait for consent to be granted
 *
 * @param type - Type of consent to wait for
 * @param timeoutMs - Timeout in milliseconds (0 = no timeout)
 * @returns Promise that resolves when consent is granted
 *
 * @example
 * await waitForConsent('marketing');
 * // Now safe to track conversions
 */
export function waitForConsent(
  type: 'marketing' | 'analytics' | 'functional',
  timeoutMs = 0
): Promise<boolean> {
  return new Promise((resolve) => {
    // Check if already granted
    const current = getConsentState();
    if (current[type]) {
      resolve(true);
      return;
    }

    // Set up timeout if specified
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeoutMs);
    }

    // Listen for changes
    const cleanup = onConsentChange((consent) => {
      if (consent[type]) {
        if (timeoutId) clearTimeout(timeoutId);
        cleanup();
        resolve(true);
      }
    });
  });
}
