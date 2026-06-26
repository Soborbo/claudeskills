/**
 * Per-site market config — makes the same skill work for HU and UK sites
 * (and any other market) by changing a few PUBLIC_ env vars.
 *
 *   PUBLIC_TRACKING_COUNTRY   GB | HU            (default GB)
 *   PUBLIC_TRACKING_CURRENCY  GBP | HUF | EUR…   (default GBP)
 *   PUBLIC_TRACKING_LOCALE    en | hu            (default en)
 *
 * `country` drives phone normalization for ambiguous numbers and PhoneLink
 * formatting; `currency` is the default conversion currency; `locale` is for
 * display strings. The gateway (server) uses the per-site KV `country_code` /
 * `currency` independently — keep them in sync with these.
 */

export type Market = 'GB' | 'HU';

export interface TrackingConfig {
  country: Market;
  currency: string;
  locale: 'en' | 'hu';
}

function readEnv(key: string): string | undefined {
  try {
    return (import.meta.env as Record<string, string | undefined> | undefined)?.[key];
  } catch {
    return undefined;
  }
}

export const trackingConfig: TrackingConfig = {
  country: (readEnv('PUBLIC_TRACKING_COUNTRY') as Market) || 'GB',
  currency: readEnv('PUBLIC_TRACKING_CURRENCY') || 'GBP',
  locale: (readEnv('PUBLIC_TRACKING_LOCALE') as 'en' | 'hu') || 'en',
};
