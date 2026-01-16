/**
 * @leadgen/tracking-v2 - Auto-initialization Script
 *
 * Runs on every page load + View Transitions.
 */

if (typeof window === 'undefined') {
  throw new Error('@leadgen/tracking-v2/init can only be used in browser');
}

import {
  initTracking,
  captureAttributionParams,
  hasMarketingConsent,
  initCrossDomain,
  initOfflineQueue,
  initDebugMode,
  initPlugins,
  notifyPageView,
  initIdentityTracking,
  initRemarketing,
  trackPageView,
  hasActiveSession,
  trackNewSession,
} from '../client/index';

// Get config from window
const config = window.__TRACKING_CONFIG__;

// Check if this is a new session BEFORE creating it
const isNewSession = !hasActiveSession();

// Initialize core tracking
initTracking();

// Track new session for remarketing
if (isNewSession) {
  trackNewSession();
}

// Initialize plugins
initPlugins();

// Initialize cross-domain tracking if configured
if (config?.linkedDomains && config.linkedDomains.length > 0) {
  initCrossDomain(config.linkedDomains);
}

// Initialize offline queue if enabled
if (config?.enableOfflineQueue !== false) {
  initOfflineQueue();
}

// Initialize debug mode if enabled
if (config?.debug) {
  initDebugMode();
}

// Initialize identity tracking (anonymous session tracking)
initIdentityTracking();

// Initialize remarketing (engagement tracking, audience segmentation)
initRemarketing();

// Notify plugins of initial page view
notifyPageView(window.location.pathname);

// Re-initialize on Astro View Transitions
document.addEventListener('astro:page-load', () => {
  // Re-capture params (URL may have new UTMs)
  if (hasMarketingConsent()) {
    captureAttributionParams();
  }
  // Track page view for remarketing
  trackPageView();
  // Notify plugins
  notifyPageView(window.location.pathname);
});

document.addEventListener('astro:after-swap', () => {
  if (hasMarketingConsent()) {
    captureAttributionParams();
  }
});

export { initTracking };
