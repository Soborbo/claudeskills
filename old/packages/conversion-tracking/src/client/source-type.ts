/**
 * @leadgen/conversion-tracking - Source Type Classification
 */

import type { SourceType } from '../types';
import { getFirstTouch, getLastTouch } from './params';

const PAID_MEDIUMS = ['cpc', 'ppc', 'paid', 'paidsocial', 'paid_social', 'display'];
const OWNED_MEDIUMS = ['email', 'newsletter', 'sms', 'push', 'owned'];
const SEARCH_ENGINES = ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu', 'yandex'];

export function classifySourceType(): SourceType {
  const params = getLastTouch() || getFirstTouch();

  // Click IDs = paid
  if (params?.gclid || params?.fbclid || params?.gbraid || params?.wbraid) {
    return 'paid';
  }

  // Paid medium
  if (params?.utm_medium && PAID_MEDIUMS.includes(params.utm_medium.toLowerCase())) {
    return 'paid';
  }

  // Owned medium
  if (params?.utm_medium && OWNED_MEDIUMS.includes(params.utm_medium.toLowerCase())) {
    return 'owned';
  }

  // Search engine referrer = organic
  if (params?.referrer && SEARCH_ENGINES.some((e) => params.referrer!.toLowerCase().includes(e))) {
    return 'organic';
  }

  // Has UTM = referral/organic
  if (params?.utm_source) {
    return 'organic';
  }

  return 'direct';
}

export function getSourceTypeLabel(): string {
  return classifySourceType();
}
