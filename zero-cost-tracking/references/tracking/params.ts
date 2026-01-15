/**
 * Zero-Cost Tracking v2 - First + Last Touch Attribution
 *
 * Captures and persists UTM/click ID parameters from URL.
 * First touch = first visit with params (never overwritten)
 * Last touch = most recent visit with params (always updated)
 */

import { STORAGE_KEYS, TRACKING_PARAMS, type TrackingParam } from './constants';
import { getStoredJson, setStoredJson } from './storage';

// =============================================================================
// Types
// =============================================================================

export interface AttributionParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  fbclid?: string;
  referrer?: string;
  timestamp: number;
  landingPage: string;
}

export interface AttributionData {
  first: AttributionParams | null;
  last: AttributionParams | null;
}

// =============================================================================
// URL Parameter Extraction
// =============================================================================

/**
 * Extract tracking parameters from current URL
 */
function getParamsFromUrl(): Partial<AttributionParams> {
  if (typeof window === 'undefined') return {};

  const urlParams = new URLSearchParams(window.location.search);
  const params: Partial<AttributionParams> = {};

  for (const param of TRACKING_PARAMS) {
    const value = urlParams.get(param);
    if (value) {
      params[param as TrackingParam] = value;
    }
  }

  return params;
}

/**
 * Check if URL has any tracking parameters
 */
function hasTrackingParamsInUrl(): boolean {
  if (typeof window === 'undefined') return false;

  const urlParams = new URLSearchParams(window.location.search);
  return TRACKING_PARAMS.some((param) => urlParams.has(param));
}

/**
 * Get document referrer (if external)
 */
function getExternalReferrer(): string | undefined {
  if (typeof document === 'undefined') return undefined;

  const referrer = document.referrer;
  if (!referrer) return undefined;

  try {
    const referrerUrl = new URL(referrer);
    const currentHost = window.location.hostname;

    // Only capture external referrers
    if (referrerUrl.hostname !== currentHost) {
      return referrerUrl.hostname;
    }
  } catch {
    // Invalid URL
  }

  return undefined;
}

// =============================================================================
// Attribution Capture
// =============================================================================

/**
 * Capture tracking params from URL and persist
 *
 * Call this on page load (after consent check).
 * - First touch: only set if not already stored
 * - Last touch: always updated if URL has params
 *
 * @returns Whether any params were captured
 */
export function captureAttributionParams(): boolean {
  if (typeof window === 'undefined') return false;

  const urlParams = getParamsFromUrl();
  const hasParams = Object.keys(urlParams).length > 0;
  const referrer = getExternalReferrer();

  // Nothing to capture
  if (!hasParams && !referrer) return false;

  const now = Date.now();
  const landingPage = window.location.pathname + window.location.search;

  const newParams: AttributionParams = {
    ...urlParams,
    referrer,
    timestamp: now,
    landingPage,
  };

  // First touch: only set if not exists
  const existingFirst = getStoredJson<AttributionParams>(STORAGE_KEYS.FIRST_TOUCH);
  if (!existingFirst) {
    setStoredJson(STORAGE_KEYS.FIRST_TOUCH, newParams);
  }

  // Last touch: always update if we have new params
  if (hasParams) {
    setStoredJson(STORAGE_KEYS.LAST_TOUCH, newParams);
  }

  return true;
}

// =============================================================================
// Attribution Reading
// =============================================================================

/**
 * Get first touch attribution data
 */
export function getFirstTouch(): AttributionParams | null {
  return getStoredJson<AttributionParams>(STORAGE_KEYS.FIRST_TOUCH);
}

/**
 * Get last touch attribution data
 */
export function getLastTouch(): AttributionParams | null {
  return getStoredJson<AttributionParams>(STORAGE_KEYS.LAST_TOUCH);
}

/**
 * Get combined attribution data for conversion events
 */
export function getAttributionData(): AttributionData {
  return {
    first: getFirstTouch(),
    last: getLastTouch(),
  };
}

/**
 * Get GCLID (last touch priority, first touch fallback)
 */
export function getGclid(): string | null {
  // Check URL first (freshest source)
  if (typeof window !== 'undefined') {
    const urlGclid = new URLSearchParams(window.location.search).get('gclid');
    if (urlGclid) return urlGclid;
  }

  // Last touch
  const last = getLastTouch();
  if (last?.gclid) return last.gclid;

  // First touch fallback
  const first = getFirstTouch();
  return first?.gclid || null;
}

/**
 * Get Facebook Click ID (last touch priority)
 */
export function getFbclid(): string | null {
  if (typeof window !== 'undefined') {
    const urlFbclid = new URLSearchParams(window.location.search).get('fbclid');
    if (urlFbclid) return urlFbclid;
  }

  const last = getLastTouch();
  if (last?.fbclid) return last.fbclid;

  const first = getFirstTouch();
  return first?.fbclid || null;
}

/**
 * Build attribution object for dataLayer (conversion events)
 */
export function buildAttributionForDataLayer(): Record<string, string | undefined> {
  const first = getFirstTouch();
  const last = getLastTouch();

  return {
    // First touch
    first_utm_source: first?.utm_source,
    first_utm_medium: first?.utm_medium,
    first_utm_campaign: first?.utm_campaign,
    first_utm_term: first?.utm_term,
    first_utm_content: first?.utm_content,
    first_gclid: first?.gclid,
    first_fbclid: first?.fbclid,
    first_referrer: first?.referrer,

    // Last touch (only include if different from first)
    last_utm_source: last?.utm_source,
    last_utm_medium: last?.utm_medium,
    last_utm_campaign: last?.utm_campaign,
    last_utm_term: last?.utm_term,
    last_utm_content: last?.utm_content,
    last_gclid: last?.gclid,
    last_fbclid: last?.fbclid,
  };
}

/**
 * Check if we have any attribution data
 */
export function hasAttributionData(): boolean {
  return getFirstTouch() !== null || getLastTouch() !== null;
}

/**
 * Clear all attribution data (for testing or GDPR deletion)
 */
export function clearAttributionData(): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEYS.FIRST_TOUCH);
      localStorage.removeItem(STORAGE_KEYS.LAST_TOUCH);
    } catch {
      // Ignore
    }
  }
}
