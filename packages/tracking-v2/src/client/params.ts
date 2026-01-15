/**
 * @leadgen/tracking-v2 - First + Last Touch Attribution
 */

import type { AttributionParams, AttributionData } from '../types';
import { STORAGE_KEYS, TRACKING_PARAMS, log } from './constants';
import { getStoredJson, setStoredJson, safeRemoveItem } from './storage';

function getParamsFromUrl(): Partial<AttributionParams> {
  if (typeof window === 'undefined') return {};

  const urlParams = new URLSearchParams(window.location.search);
  const params: Partial<AttributionParams> = {};

  for (const param of TRACKING_PARAMS) {
    const value = urlParams.get(param);
    if (value) {
      (params as Record<string, string>)[param] = value;
    }
  }

  return params;
}

function getExternalReferrer(): string | undefined {
  if (typeof document === 'undefined') return undefined;

  const referrer = document.referrer;
  if (!referrer) return undefined;

  try {
    const referrerUrl = new URL(referrer);
    if (referrerUrl.hostname !== window.location.hostname) {
      return referrerUrl.hostname;
    }
  } catch {}

  return undefined;
}

export function captureAttributionParams(): boolean {
  if (typeof window === 'undefined') return false;

  const urlParams = getParamsFromUrl();
  const hasParams = Object.keys(urlParams).length > 0;
  const referrer = getExternalReferrer();

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
    log('First touch captured:', newParams);
  }

  // Last touch: always update if new params
  if (hasParams) {
    setStoredJson(STORAGE_KEYS.LAST_TOUCH, newParams);
    log('Last touch updated:', newParams);
  }

  return true;
}

export function getFirstTouch(): AttributionParams | null {
  return getStoredJson<AttributionParams>(STORAGE_KEYS.FIRST_TOUCH);
}

export function getLastTouch(): AttributionParams | null {
  return getStoredJson<AttributionParams>(STORAGE_KEYS.LAST_TOUCH);
}

export function getAttributionData(): AttributionData {
  return {
    first: getFirstTouch(),
    last: getLastTouch(),
  };
}

export function getGclid(): string | null {
  if (typeof window !== 'undefined') {
    const urlGclid = new URLSearchParams(window.location.search).get('gclid');
    if (urlGclid) return urlGclid;
  }

  const last = getLastTouch();
  if (last?.gclid) return last.gclid;

  const first = getFirstTouch();
  return first?.gclid || null;
}

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

export function buildAttributionForDataLayer(): Record<string, string | undefined> {
  const first = getFirstTouch();
  const last = getLastTouch();

  return {
    first_utm_source: first?.utm_source,
    first_utm_medium: first?.utm_medium,
    first_utm_campaign: first?.utm_campaign,
    first_utm_term: first?.utm_term,
    first_utm_content: first?.utm_content,
    first_gclid: first?.gclid,
    first_gbraid: first?.gbraid,
    first_wbraid: first?.wbraid,
    first_fbclid: first?.fbclid,
    first_referrer: first?.referrer,
    last_utm_source: last?.utm_source,
    last_utm_medium: last?.utm_medium,
    last_utm_campaign: last?.utm_campaign,
    last_utm_term: last?.utm_term,
    last_utm_content: last?.utm_content,
    last_gclid: last?.gclid,
    last_gbraid: last?.gbraid,
    last_wbraid: last?.wbraid,
    last_fbclid: last?.fbclid,
    last_referrer: last?.referrer,
  };
}

export function hasAttributionData(): boolean {
  return getFirstTouch() !== null || getLastTouch() !== null;
}

export function clearAttributionData(): void {
  safeRemoveItem(STORAGE_KEYS.FIRST_TOUCH);
  safeRemoveItem(STORAGE_KEYS.LAST_TOUCH);
}
