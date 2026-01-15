/**
 * @leadgen/tracking-v2 - Auto-initialization Script
 *
 * Runs on every page load + View Transitions.
 */

if (typeof window === 'undefined') {
  throw new Error('@leadgen/tracking-v2/init can only be used in browser');
}

import { initTracking, captureAttributionParams, hasMarketingConsent } from '../client/index';

// Initialize on first load
initTracking();

// Re-initialize on Astro View Transitions
document.addEventListener('astro:page-load', () => {
  // Re-capture params (URL may have new UTMs)
  if (hasMarketingConsent()) {
    captureAttributionParams();
  }
});

document.addEventListener('astro:after-swap', () => {
  if (hasMarketingConsent()) {
    captureAttributionParams();
  }
});

export { initTracking };
