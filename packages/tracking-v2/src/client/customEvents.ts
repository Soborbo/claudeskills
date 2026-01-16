/**
 * @leadgen/tracking-v2 - Custom Events API
 *
 * Track arbitrary custom events beyond the predefined types.
 */

import { getDataLayer, getDeviceType } from './dataLayer';
import { getOrCreateSessionId } from './session';
import { TRACKING_VERSION, log } from './constants';

export interface CustomEventParams {
  [key: string]: string | number | boolean | undefined;
}

export interface TrackEventResult {
  success: boolean;
  eventName: string;
  timestamp: number;
}

/**
 * Track a custom event
 *
 * @example
 * trackEvent('pricing_viewed', { plan: 'pro', price: 99 });
 * trackEvent('chat_opened', { page: '/calculator' });
 * trackEvent('video_played', { videoId: 'abc123', duration: 120 });
 */
export function trackEvent(
  eventName: string,
  params: CustomEventParams = {}
): TrackEventResult {
  const timestamp = Date.now();

  // Validate event name
  if (!eventName || typeof eventName !== 'string') {
    log('Invalid event name:', eventName);
    return { success: false, eventName: '', timestamp };
  }

  // Sanitize event name (alphanumeric + underscore only)
  const sanitizedName = eventName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

  const dataLayer = getDataLayer();
  if (!dataLayer) {
    log('dataLayer not available');
    return { success: false, eventName: sanitizedName, timestamp };
  }

  dataLayer.push({
    event: sanitizedName,
    tracking_version: TRACKING_VERSION,
    session_id: getOrCreateSessionId(),
    page_url: window.location.pathname,
    device: getDeviceType(),
    event_timestamp: timestamp,
    ...params,
  });

  log(`Custom event tracked: ${sanitizedName}`, params);
  return { success: true, eventName: sanitizedName, timestamp };
}

/**
 * Track multiple events at once
 */
export function trackEvents(
  events: Array<{ name: string; params?: CustomEventParams }>
): TrackEventResult[] {
  return events.map(({ name, params }) => trackEvent(name, params));
}
