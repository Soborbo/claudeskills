/**
 * @leadgen/tracking - GCLID/UTM Persistence Module
 *
 * localStorage persistence for tracking parameters (Safari ITP bypass).
 * CLIENT-ONLY - Do not import in server context.
 */

import type { TrackingParams } from '../types';

// =============================================================================
// Browser Guard
// =============================================================================

if (typeof window === 'undefined') {
  throw new Error('@leadgen/tracking/client/gclid can only be used in browser');
}

// =============================================================================
// Constants
// =============================================================================

/** localStorage key for tracking params */
const STORAGE_KEY = 'leadgen_tracking';

/** Default TTL in days */
const DEFAULT_PERSIST_DAYS = 90;

/** List of URL parameters to capture */
const TRACKING_PARAMS = [
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

// =============================================================================
// localStorage Helpers
// =============================================================================

/**
 * Safely read from localStorage
 */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    // Safari private mode or localStorage disabled
    return null;
  }
}

/**
 * Safely write to localStorage
 */
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    // Safari private mode or localStorage disabled
    return false;
  }
}

/**
 * Safely remove from localStorage
 */
function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// URL Parameter Extraction
// =============================================================================

/**
 * Extract tracking parameters from current URL
 */
function getParamsFromUrl(): Partial<TrackingParams> {
  const urlParams = new URLSearchParams(window.location.search);
  const params: Partial<TrackingParams> = {};

  for (const param of TRACKING_PARAMS) {
    const value = urlParams.get(param);
    if (value) {
      params[param as keyof TrackingParams] = value;
    }
  }

  return params;
}

/**
 * Check if URL has any tracking parameters
 */
function hasTrackingParamsInUrl(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  return TRACKING_PARAMS.some((param) => urlParams.has(param));
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Persist tracking parameters from URL to localStorage
 *
 * Call this after consent is granted. URL params will override stored values.
 *
 * @param persistDays - Number of days to persist (default: 90)
 * @returns Whether params were persisted
 *
 * @example
 * if (hasMarketingConsent()) {
 *   persistTrackingParams();
 * }
 */
export function persistTrackingParams(persistDays = DEFAULT_PERSIST_DAYS): boolean {
  // Get params from URL
  const urlParams = getParamsFromUrl();

  // If no URL params, nothing to persist
  if (Object.keys(urlParams).length === 0) {
    return false;
  }

  // Get existing stored params (for merging)
  const existing = getTrackingParams();
  const now = Date.now();

  // Merge: URL params take priority
  const merged: TrackingParams = {
    // Keep existing values as fallback
    ...(existing || {}),
    // Override with URL params
    ...urlParams,
    // Always update timestamp and landing page when new params come in
    timestamp: now,
    landingPage: window.location.href,
  };

  // Store
  return safeSetItem(STORAGE_KEY, JSON.stringify(merged));
}

/**
 * Get stored tracking parameters
 *
 * @param persistDays - TTL in days (expired params return null)
 * @returns Stored params or null if expired/not found
 *
 * @example
 * const params = getTrackingParams();
 * if (params?.gclid) {
 *   formData.set('gclid', params.gclid);
 * }
 */
export function getTrackingParams(persistDays = DEFAULT_PERSIST_DAYS): TrackingParams | null {
  const stored = safeGetItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const params = JSON.parse(stored) as TrackingParams;

    // Check TTL
    const expirationMs = persistDays * 24 * 60 * 60 * 1000;
    if (params.timestamp && Date.now() - params.timestamp > expirationMs) {
      // Expired - clean up and return null
      safeRemoveItem(STORAGE_KEY);
      return null;
    }

    return params;
  } catch {
    // Invalid JSON - clean up
    safeRemoveItem(STORAGE_KEY);
    return null;
  }
}

/**
 * Get GCLID from URL (priority) or localStorage
 *
 * @returns GCLID value or null
 *
 * @example
 * const gclid = getGclid();
 * // Use for server-side conversion tracking
 */
export function getGclid(): string | null {
  // URL takes priority (fresh click)
  const urlParams = new URLSearchParams(window.location.search);
  const urlGclid = urlParams.get('gclid');
  if (urlGclid) return urlGclid;

  // Fall back to stored
  const stored = getTrackingParams();
  return stored?.gclid || null;
}

/**
 * Get Facebook Click ID from URL (priority) or localStorage
 *
 * @returns FBCLID value or null
 */
export function getFbclid(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  const urlFbclid = urlParams.get('fbclid');
  if (urlFbclid) return urlFbclid;

  const stored = getTrackingParams();
  return stored?.fbclid || null;
}

/**
 * Get all UTM parameters
 *
 * @returns Object with UTM values (URL priority, localStorage fallback)
 */
export function getUtmParams(): Record<string, string> {
  const urlParams = new URLSearchParams(window.location.search);
  const stored = getTrackingParams();

  return {
    utm_source: urlParams.get('utm_source') || stored?.utm_source || '',
    utm_medium: urlParams.get('utm_medium') || stored?.utm_medium || '',
    utm_campaign: urlParams.get('utm_campaign') || stored?.utm_campaign || '',
    utm_content: urlParams.get('utm_content') || stored?.utm_content || '',
    utm_term: urlParams.get('utm_term') || stored?.utm_term || '',
  };
}

/**
 * Clear stored tracking parameters
 *
 * Call this for GDPR data deletion requests.
 *
 * @returns Whether deletion was successful
 */
export function clearTrackingParams(): boolean {
  return safeRemoveItem(STORAGE_KEY);
}

/**
 * Check if there are any tracking params (URL or stored)
 */
export function hasTrackingParams(): boolean {
  return hasTrackingParamsInUrl() || getTrackingParams() !== null;
}
