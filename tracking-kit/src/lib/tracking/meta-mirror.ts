/**
 * Client → server Meta CAPI mirror.
 *
 * When a conversion fires in the browser via `trackEvent`, we also POST
 * the same `event_id` plus value/currency to /api/meta/capi (or wherever
 * you mounted the CAPI endpoint). The server hashes the user data from
 * the hidden DOM element (relayed via this payload), then forwards to
 * Meta CAPI. The browser-side Meta Pixel fires too. Meta dedupes the
 * pair using `event_id`.
 *
 * The map of internal-event → Meta-event-name lives in config.ts so you
 * can add events without touching this file.
 *
 * Consent: this function refuses to mirror when ads consent is denied.
 * The server endpoint also re-checks the consent snapshot included in
 * the payload — defense-in-depth so a tampered client can't bypass.
 */

import { META_CAPI_ENDPOINT, META_EVENT_NAMES } from './config';
import {
  getConsentSnapshot,
  hasFullAdsConsent,
  readUserDataFromDOM,
  type UserData,
} from './tracking';

export interface MetaMirrorPayload {
  value?: number;
  currency?: string;
  content_name?: string;
}

/** _fbp / _fbc cookie format Meta sets and expects back:
 *    fb.subdomain_index.creation_time.unique_id (fbp)
 *    fb.subdomain_index.creation_time.fbclid    (fbc)
 *  Anything else is junk or attribution-spoofing — drop. */
const FBP_RE = /^fb\.\d+\.\d+\.\d+$/;
const FBC_RE = /^fb\.\d+\.\d+\.[A-Za-z0-9_-]+$/;

export async function mirrorMetaCapi(
  internalEventName: string,
  eventId: string,
  data: MetaMirrorPayload = {},
): Promise<void> {
  if (typeof window === 'undefined') return;
  const metaName = META_EVENT_NAMES[internalEventName];
  if (!metaName) return;

  // Fail-closed consent gate — never forward to Meta without ads consent.
  if (!hasFullAdsConsent()) return;

  const userData: UserData = readUserDataFromDOM();
  // Best-effort _fbp / _fbc cookie parse — Meta uses these to attribute
  // the browser side; CAPI strongly recommends including them server-side
  // too so Meta can connect server hits to the same device. We validate
  // the shape so a malicious cookie injection can't smuggle a bogus
  // attribution pointer through to Meta.
  const cookies = parseCookies();
  const fbp = cookies._fbp && FBP_RE.test(cookies._fbp) ? cookies._fbp : undefined;
  const fbc = cookies._fbc && FBC_RE.test(cookies._fbc) ? cookies._fbc : undefined;

  const payload = {
    event_name: metaName,
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: window.location.href,
    user_data: {
      ...userData,
      fbp,
      fbc,
      client_user_agent: navigator.userAgent,
    },
    custom_data: data,
    consent_state: getConsentSnapshot(),
  };

  try {
    if (typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      const ok = navigator.sendBeacon(META_CAPI_ENDPOINT, blob);
      if (ok) return;
    }
    await fetch(META_CAPI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Mirror is best-effort. The browser Pixel side is the primary signal.
  }
}

function parseCookies(): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof document === 'undefined') return out;
  document.cookie.split(';').forEach((part) => {
    const [k, ...rest] = part.trim().split('=');
    if (k) out[k] = decodeURIComponent(rest.join('='));
  });
  return out;
}
