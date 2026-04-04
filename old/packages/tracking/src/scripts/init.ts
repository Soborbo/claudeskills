/**
 * @leadgen/tracking - Initialization Script
 *
 * Auto-injected on every page to set up tracking.
 * CLIENT-ONLY - Runs in browser context only.
 */

// =============================================================================
// Browser Guard
// =============================================================================

if (typeof window === 'undefined') {
  // This should never happen as this script is browser-only
  throw new Error('@leadgen/tracking/init can only be used in browser');
}

// =============================================================================
// Imports (tree-shaken in production)
// =============================================================================

import {
  hasMarketingConsent,
  hasAnalyticsConsent,
  onConsentChange,
} from '../client/consent';

import { persistTrackingParams } from '../client/gclid';

import { pushPageView } from '../client/dataLayer';

// =============================================================================
// Configuration Interface
// =============================================================================

interface TrackingInitConfig {
  debug: boolean;
  gclidPersistDays: number;
}

// =============================================================================
// Initialization
// =============================================================================

/**
 * Initialize tracking on page load
 *
 * @param config - Configuration from Astro integration
 */
export function initTracking(config: TrackingInitConfig): void {
  // Guard: browser only
  if (typeof window === 'undefined') return;

  const log = config.debug
    ? (...args: unknown[]) => console.log('[Tracking]', ...args)
    : () => {};

  log('Initializing...', { config });

  // 1. dataLayer is already initialized by inline script (before GTM)

  // 2. Set up consent change listener
  onConsentChange((consent) => {
    log('Consent changed:', consent);

    // Persist tracking params when marketing consent is granted
    if (consent.marketing) {
      const persisted = persistTrackingParams(config.gclidPersistDays);
      if (persisted) {
        log('Tracking params persisted to localStorage');
      }
    }

    // Push page view when analytics consent is granted (if not already sent)
    if (consent.analytics) {
      log('Analytics consent granted - page view eligible');
    }
  });

  // 3. Initial consent check - persist params if consent exists
  if (hasMarketingConsent()) {
    const persisted = persistTrackingParams(config.gclidPersistDays);
    log('Initial marketing consent check: granted', { persisted });
  } else {
    log('Initial marketing consent check: denied or pending');
  }

  // 4. Initial page view (if analytics consent exists)
  if (hasAnalyticsConsent()) {
    pushPageView();
    log('Initial page view pushed');
  } else {
    log('Page view deferred - awaiting analytics consent');
  }

  // 5. Astro View Transitions support
  // Re-track page views on client-side navigation
  document.addEventListener('astro:page-load', () => {
    log('Astro page load event');

    // Re-check consent on each navigation
    if (hasAnalyticsConsent()) {
      pushPageView();
      log('Page view pushed (View Transition)');
    }

    // Re-persist tracking params (URL may have changed with new UTMs)
    if (hasMarketingConsent()) {
      persistTrackingParams(config.gclidPersistDays);
    }
  });

  // 6. Also support astro:after-swap for View Transitions
  document.addEventListener('astro:after-swap', () => {
    log('Astro after-swap event');
    // Similar handling but page-load is the main event
  });

  log('Initialization complete');
}

// =============================================================================
// Auto-initialization
// =============================================================================

// This will be called when the script is loaded
// Config is injected via virtual module by the Astro integration

// Check for config in window (set by inline script)
declare global {
  interface Window {
    __LEADGEN_TRACKING_CONFIG__?: TrackingInitConfig;
  }
}

// Auto-init if config is available
if (window.__LEADGEN_TRACKING_CONFIG__) {
  initTracking(window.__LEADGEN_TRACKING_CONFIG__);
}

export default initTracking;
