/**
 * UTM Parameter Utilities
 *
 * Handle UTM tracking parameters with localStorage persistence.
 *
 * @example
 * // In your page/component
 * import { captureUtmParams, getStoredUtm, clearUtm } from '@leadgen/utils/utm';
 *
 * // Capture UTM from URL and store
 * captureUtmParams();
 *
 * // Get stored UTM for form submission
 * const utm = getStoredUtm();
 * console.log(utm.source, utm.medium, utm.campaign);
 */

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  /** First touch timestamp */
  firstTouch?: number;
  /** Last touch timestamp */
  lastTouch?: number;
  /** Landing page URL */
  landingPage?: string;
}

const UTM_STORAGE_KEY = 'leadgen_utm_params';

/** Default expiration: 30 days */
const DEFAULT_EXPIRATION_DAYS = 30;

/**
 * Get UTM parameters from URL
 */
export function getUtmFromUrl(url?: string): UtmParams {
  const urlObj = url ? new URL(url) : (typeof window !== 'undefined' ? new URL(window.location.href) : null);
  if (!urlObj) return {};

  const params = urlObj.searchParams;

  return {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
    term: params.get('utm_term') || undefined,
    content: params.get('utm_content') || undefined,
  };
}

/**
 * Get stored UTM parameters from localStorage
 */
export function getStoredUtm(expirationDays = DEFAULT_EXPIRATION_DAYS): UtmParams {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(UTM_STORAGE_KEY);
    if (!stored) return {};

    const data = JSON.parse(stored) as UtmParams;

    // Check expiration
    if (data.firstTouch) {
      const expirationMs = expirationDays * 24 * 60 * 60 * 1000;
      if (Date.now() - data.firstTouch > expirationMs) {
        localStorage.removeItem(UTM_STORAGE_KEY);
        return {};
      }
    }

    return data;
  } catch {
    return {};
  }
}

/**
 * Store UTM parameters to localStorage
 */
export function storeUtm(params: UtmParams): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = getStoredUtm();
    const now = Date.now();

    const merged: UtmParams = {
      // Keep first touch values if they exist
      source: params.source || existing.source,
      medium: params.medium || existing.medium,
      campaign: params.campaign || existing.campaign,
      term: params.term || existing.term,
      content: params.content || existing.content,
      // Preserve first touch, update last touch
      firstTouch: existing.firstTouch || now,
      lastTouch: now,
      landingPage: existing.landingPage || (typeof window !== 'undefined' ? window.location.href : undefined),
    };

    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // localStorage not available
  }
}

/**
 * Capture UTM from URL and store (typically called on page load)
 *
 * @returns The captured/stored UTM params
 */
export function captureUtmParams(): UtmParams {
  const urlUtm = getUtmFromUrl();

  // Only store if we have at least one UTM param
  if (urlUtm.source || urlUtm.medium || urlUtm.campaign) {
    storeUtm(urlUtm);
  }

  return getStoredUtm();
}

/**
 * Clear stored UTM parameters
 */
export function clearUtm(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(UTM_STORAGE_KEY);
  } catch {
    // localStorage not available
  }
}

/**
 * Get UTM params for form submission (URL params take priority)
 */
export function getUtmForForm(): Record<string, string> {
  const urlUtm = getUtmFromUrl();
  const storedUtm = getStoredUtm();

  return {
    utm_source: urlUtm.source || storedUtm.source || '',
    utm_medium: urlUtm.medium || storedUtm.medium || '',
    utm_campaign: urlUtm.campaign || storedUtm.campaign || '',
    utm_term: urlUtm.term || storedUtm.term || '',
    utm_content: urlUtm.content || storedUtm.content || '',
  };
}

/**
 * Build URL with UTM parameters
 */
export function buildUtmUrl(baseUrl: string, params: Partial<UtmParams>): string {
  const url = new URL(baseUrl);

  if (params.source) url.searchParams.set('utm_source', params.source);
  if (params.medium) url.searchParams.set('utm_medium', params.medium);
  if (params.campaign) url.searchParams.set('utm_campaign', params.campaign);
  if (params.term) url.searchParams.set('utm_term', params.term);
  if (params.content) url.searchParams.set('utm_content', params.content);

  return url.toString();
}
