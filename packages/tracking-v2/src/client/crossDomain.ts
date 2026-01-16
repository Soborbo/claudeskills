/**
 * @leadgen/tracking-v2 - Cross-Domain Tracking
 *
 * Pass session and attribution data across domains.
 */

import { getOrCreateSessionId } from './session';
import { getFirstTouch, getLastTouch, captureAttributionParams } from './params';
import { log } from './constants';
import type { AttributionParams } from '../types';

const CROSS_DOMAIN_PARAM = '_lg_xd';

interface CrossDomainData {
  sessionId: string;
  firstTouch: AttributionParams | null;
  lastTouch: AttributionParams | null;
  timestamp: number;
}

// =============================================================================
// Outbound: Decorate links with tracking data
// =============================================================================

/**
 * Get cross-domain data to pass to another domain
 */
export function getCrossDomainData(): CrossDomainData {
  return {
    sessionId: getOrCreateSessionId(),
    firstTouch: getFirstTouch(),
    lastTouch: getLastTouch(),
    timestamp: Date.now(),
  };
}

/**
 * Encode cross-domain data for URL parameter
 */
export function encodeCrossDomainData(): string {
  const data = getCrossDomainData();
  try {
    const json = JSON.stringify(data);
    return btoa(encodeURIComponent(json));
  } catch {
    return '';
  }
}

/**
 * Decorate a URL with cross-domain tracking data
 */
export function decorateUrl(url: string): string {
  const encoded = encodeCrossDomainData();
  if (!encoded) return url;

  try {
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.set(CROSS_DOMAIN_PARAM, encoded);
    return urlObj.toString();
  } catch {
    // Fallback for relative URLs
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${CROSS_DOMAIN_PARAM}=${encoded}`;
  }
}

/**
 * Decorate all links to specified domains
 */
export function decorateLinksTodomains(domains: string[]): void {
  if (typeof document === 'undefined') return;

  const normalizedDomains = domains.map((d) => d.toLowerCase().replace(/^www\./, ''));

  document.addEventListener('click', (e) => {
    const link = (e.target as Element).closest('a');
    if (!link || !link.href) return;

    try {
      const url = new URL(link.href);
      const linkDomain = url.hostname.toLowerCase().replace(/^www\./, '');

      if (normalizedDomains.includes(linkDomain)) {
        link.href = decorateUrl(link.href);
        log('Decorated cross-domain link:', link.href);
      }
    } catch {
      // Invalid URL, ignore
    }
  });

  log('Cross-domain link decoration enabled for:', domains);
}

// =============================================================================
// Inbound: Receive tracking data from another domain
// =============================================================================

/**
 * Decode cross-domain data from URL parameter
 */
export function decodeCrossDomainData(encoded: string): CrossDomainData | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const data = JSON.parse(json) as CrossDomainData;

    // Validate data structure
    if (!data.sessionId || !data.timestamp) {
      return null;
    }

    // Check if data is not too old (1 hour max)
    const maxAge = 60 * 60 * 1000;
    if (Date.now() - data.timestamp > maxAge) {
      log('Cross-domain data expired');
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Check for and apply incoming cross-domain data
 */
export function applyCrossDomainData(): boolean {
  if (typeof window === 'undefined') return false;

  const urlParams = new URLSearchParams(window.location.search);
  const encoded = urlParams.get(CROSS_DOMAIN_PARAM);

  if (!encoded) return false;

  const data = decodeCrossDomainData(encoded);
  if (!data) return false;

  log('Received cross-domain data:', data);

  // Store session ID (will be picked up by session module)
  try {
    const sessionData = { id: data.sessionId, lastActivity: Date.now() };
    localStorage.setItem('lg_session', JSON.stringify(sessionData));
  } catch {
    // localStorage not available
  }

  // Store attribution if we don't have it yet
  if (data.firstTouch) {
    try {
      const existing = localStorage.getItem('lg_first_touch');
      if (!existing) {
        localStorage.setItem('lg_first_touch', JSON.stringify(data.firstTouch));
        log('Applied cross-domain first touch');
      }
    } catch {
      // localStorage not available
    }
  }

  if (data.lastTouch) {
    try {
      localStorage.setItem('lg_last_touch', JSON.stringify(data.lastTouch));
      log('Applied cross-domain last touch');
    } catch {
      // localStorage not available
    }
  }

  // Clean up URL
  cleanupUrl();

  // Re-capture any new params from this page
  captureAttributionParams();

  return true;
}

/**
 * Remove cross-domain parameter from URL without reload
 */
function cleanupUrl(): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete(CROSS_DOMAIN_PARAM);

    window.history.replaceState({}, '', url.toString());
  } catch {
    // Ignore errors
  }
}

// =============================================================================
// Setup
// =============================================================================

/**
 * Initialize cross-domain tracking
 */
export function initCrossDomain(linkedDomains?: string[]): void {
  // Apply incoming data first
  applyCrossDomainData();

  // Set up outbound decoration if domains specified
  if (linkedDomains && linkedDomains.length > 0) {
    decorateLinksTodomains(linkedDomains);
  }
}
