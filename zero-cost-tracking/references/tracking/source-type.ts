/**
 * Zero-Cost Tracking v2 - Source Type Classification
 *
 * Classifies traffic source as paid/organic/owned/direct.
 */

import { getFirstTouch, getLastTouch } from './params';

// =============================================================================
// Types
// =============================================================================

export type SourceType = 'paid' | 'organic' | 'owned' | 'direct';

// =============================================================================
// Classification Logic
// =============================================================================

const PAID_MEDIUMS = ['cpc', 'ppc', 'paid', 'paidsocial', 'paid_social', 'display'];
const OWNED_MEDIUMS = ['email', 'newsletter', 'sms', 'push', 'owned'];
const SEARCH_ENGINES = ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu', 'yandex'];

/**
 * Check if medium indicates paid traffic
 */
function isPaidMedium(medium?: string): boolean {
  if (!medium) return false;
  return PAID_MEDIUMS.includes(medium.toLowerCase());
}

/**
 * Check if medium indicates owned traffic
 */
function isOwnedMedium(medium?: string): boolean {
  if (!medium) return false;
  return OWNED_MEDIUMS.includes(medium.toLowerCase());
}

/**
 * Check if referrer is a search engine
 */
function isSearchEngineReferrer(referrer?: string): boolean {
  if (!referrer) return false;
  return SEARCH_ENGINES.some((engine) => referrer.toLowerCase().includes(engine));
}

/**
 * Classify traffic source type
 *
 * Priority:
 * 1. gclid/fbclid/gbraid/wbraid present → paid
 * 2. utm_medium is cpc/ppc/paid → paid
 * 3. utm_medium is email/newsletter/sms → owned
 * 4. referrer from search engine (no click IDs) → organic
 * 5. no referrer, no UTMs → direct
 */
export function classifySourceType(): SourceType {
  const first = getFirstTouch();
  const last = getLastTouch();

  // Use last touch for classification (most recent intent)
  const params = last || first;

  // 1. Click IDs = paid
  if (params?.gclid || params?.fbclid || params?.gbraid || params?.wbraid) {
    return 'paid';
  }

  // 2. Paid medium
  if (isPaidMedium(params?.utm_medium)) {
    return 'paid';
  }

  // 3. Owned medium
  if (isOwnedMedium(params?.utm_medium)) {
    return 'owned';
  }

  // 4. Search engine referrer without paid indicators = organic
  if (isSearchEngineReferrer(params?.referrer)) {
    return 'organic';
  }

  // 5. Has any UTM = treat as referral/organic
  if (params?.utm_source) {
    return 'organic';
  }

  // 6. No data = direct
  return 'direct';
}

/**
 * Get source type as string for Sheets
 */
export function getSourceTypeLabel(): string {
  return classifySourceType();
}
