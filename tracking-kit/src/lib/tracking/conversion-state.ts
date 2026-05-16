/**
 * Primary-conversion state machine ("upgrade window") — OPT-IN.
 *
 * **This module is gated behind `ENABLE_UPGRADE_WINDOW` in config.ts and
 * defaults to OFF.** When the flag is false, every exported function is
 * a no-op; conversions are expected to fire immediately from your
 * form-success handler via `trackEvent('primary_conversion', ...)`, and
 * platform dedup (Google Ads `orderId` / Meta `event_id`) handles
 * "don't count the same lead twice".
 *
 * Why default OFF: a production deployment of this kit ran with the
 * upgrade window enabled and lost ~87% of quote conversions because
 * most users do not return within the 25h catch-up window. See
 * INVARIANTS.md → "Conversions fire immediately; dedup at the platform,
 * not in client state".
 *
 * When the flag IS true, the pattern below applies:
 *
 * When a user finishes a primary funnel step (calculator, checkout,
 * free-trial signup) we don't fire the conversion event immediately.
 * Instead we record the completion in localStorage with a timer. If the
 * user takes a higher-intent action (phone/email/whatsapp click,
 * callback form submit) within the window, that action becomes the
 * conversion and the state is marked as upgraded — so we never count
 * both. If the window elapses without an upgrade, we fire
 * `primary_conversion` as a late conversion the next time the user is
 * on a page (or in-tab if the timer is still alive).
 *
 * Why localStorage and not sessionStorage: sessionStorage dies when the
 * tab closes, and a non-trivial fraction of users complete the primary
 * step and close the tab before either upgrading or hitting the timeout.
 * localStorage survives that. Cross-tab races are handled with
 * BroadcastChannel.
 */

import { clearUserDataOnDOM, trackEvent } from './tracking';
import { mirrorMetaCapi } from './meta-mirror';
import { generateUUID } from './uuid';
import {
  DEFAULT_CURRENCY,
  ENABLE_UPGRADE_WINDOW,
  LATE_CATCHUP_MS,
  CONVERSION_STATE_CHANNEL,
  CONVERSION_STATE_KEY,
  UPGRADE_WINDOW_MS,
  VIEW_CONTENT_FIRED_KEY,
} from './config';

let warnedFlagOn = false;
function warnFlagOnce(): void {
  if (warnedFlagOn) return;
  warnedFlagOn = true;
  // eslint-disable-next-line no-console
  console.warn(
    '[tracking] ENABLE_UPGRADE_WINDOW = true. The upgrade-window pattern ' +
      'lost ~87% of conversions in production because most users do not ' +
      'return within the catch-up window. Verify with your funnel data ' +
      'before keeping this on. See INVARIANTS.md.',
  );
}

export interface ConversionState {
  value: number;
  currency: string;
  /** Free-form label for what the user converted on (service slug,
   *  product category, etc.). Forwarded as `service` on dataLayer. */
  service: string;
  completedAt: number;
  eventId: string;
  upgraded: boolean;
}

function isConversionState(v: unknown): v is ConversionState {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.value === 'number' && Number.isFinite(o.value) &&
    typeof o.currency === 'string' &&
    typeof o.service === 'string' &&
    typeof o.completedAt === 'number' && Number.isFinite(o.completedAt) &&
    typeof o.eventId === 'string' && o.eventId.length > 0 &&
    typeof o.upgraded === 'boolean'
  );
}

let pendingTimerId: ReturnType<typeof setTimeout> | null = null;
let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!channel) {
    try {
      channel = new BroadcastChannel(CONVERSION_STATE_CHANNEL);
      channel.addEventListener('message', (e) => {
        if (e.data === 'upgraded') clearPendingTimer();
      });
    } catch {
      channel = null;
    }
  }
  return channel;
}

function broadcast(message: 'upgraded'): void {
  getChannel()?.postMessage(message);
}

function clearPendingTimer(): void {
  if (pendingTimerId !== null) {
    clearTimeout(pendingTimerId);
    pendingTimerId = null;
  }
}

function readState(): ConversionState | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONVERSION_STATE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isConversionState(parsed)) {
      // Schema-mismatch (older version, hand-edited, or junk) — drop it
      // rather than crash downstream callers that read state.upgraded etc.
      try { localStorage.removeItem(CONVERSION_STATE_KEY); } catch { /* ignore */ }
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeState(state: ConversionState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CONVERSION_STATE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or disabled — silently degrade
  }
}

function deleteState(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(CONVERSION_STATE_KEY);
  } catch {
    // ignore
  }
}

/**
 * `viewContentFired` lives in its own localStorage key — NOT inside the
 * conversion state — because the state is wiped after every primary
 * conversion fires (`deleteState()` in `fireConversionIfStillActive`).
 * If we kept the flag inside the state, every subsequent primary
 * completion would re-fire Meta `ViewContent`, double-counting an
 * engagement signal that's supposed to fire at most once per browser.
 */
export function hasViewContentFired(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(VIEW_CONTENT_FIRED_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Called from the primary-completion success handler to start a fresh
 * upgrade window. Resets the timer and event_id; preserves
 * `viewContentFired` so the Meta ViewContent only fires once per
 * browser even across re-runs.
 *
 * `eventId` is optional — passing it lets the caller share a dedup key
 * with a server-side mirror that was fired earlier (e.g. an API route
 * that received event_id in its request body).
 */
export function resetConversionState(input: {
  value: number;
  currency?: string;
  service: string;
  eventId?: string;
}): ConversionState {
  const state: ConversionState = {
    value: input.value,
    currency: input.currency || DEFAULT_CURRENCY,
    service: input.service,
    completedAt: Date.now(),
    eventId: input.eventId || generateUUID(),
    upgraded: false,
  };
  if (!ENABLE_UPGRADE_WINDOW) {
    // Flag off (the default). Return a synthesized state so existing
    // callers that read eventId / value / currency keep working, but
    // do NOT persist or start a timer — the caller is expected to fire
    // `primary_conversion` immediately via trackEvent().
    return state;
  }
  warnFlagOnce();
  clearPendingTimer();
  writeState(state);
  pendingTimerId = setTimeout(
    () => fireConversionIfStillActive(false),
    UPGRADE_WINDOW_MS,
  );
  return state;
}

/**
 * Returns the live state if and only if it's within the upgrade window
 * AND has not already been upgraded. Used by global click handlers to
 * decide whether a phone/email/whatsapp click counts as an upgrade vs a
 * standalone conversion.
 */
export function getActiveConversionState(): ConversionState | null {
  if (!ENABLE_UPGRADE_WINDOW) return null;
  const state = readState();
  if (!state || state.upgraded) return null;
  if (Date.now() - state.completedAt > UPGRADE_WINDOW_MS) return null;
  return state;
}

/**
 * Marks the active conversion as upgraded — i.e. its conversion has
 * been counted by a higher-intent event already, so the late-fire timer
 * should not fire `primary_conversion` for it.
 */
export function markConversionUpgraded(): void {
  if (!ENABLE_UPGRADE_WINDOW) return;
  const state = readState();
  if (!state) return;
  state.upgraded = true;
  writeState(state);
  clearPendingTimer();
  broadcast('upgraded');
}

export function markViewContentFired(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(VIEW_CONTENT_FIRED_KEY, '1');
  } catch {
    // ignore
  }
}

function fireConversionIfStillActive(isLate: boolean): void {
  const state = readState();
  if (!state || state.upgraded) return;

  trackEvent('primary_conversion', {
    value: state.value,
    currency: state.currency,
    service: state.service,
    event_id: state.eventId,
    ...(isLate ? { late_conversion: true } : {}),
  });
  void mirrorMetaCapi('primary_conversion', state.eventId, {
    value: state.value,
    currency: state.currency,
  });

  deleteState();
  clearPendingTimer();
  // Conversion is final — drop side-channel PII so the at-rest blob
  // doesn't outlive the conversion that needed it.
  clearUserDataOnDOM();
}

/**
 * Called on every page-load. If a saved conversion state exists, either
 * resume the timer (if we're inside the upgrade window) or fire a late
 * conversion (if we're past the window but still in the catch-up grace
 * period) or drop the state entirely (if it's stale).
 */
export function resumeConversionTimer(): void {
  if (!ENABLE_UPGRADE_WINDOW) return;
  const state = readState();
  if (!state || state.upgraded) return;

  warnFlagOnce();
  const elapsed = Date.now() - state.completedAt;
  clearPendingTimer();

  if (elapsed <= UPGRADE_WINDOW_MS) {
    pendingTimerId = setTimeout(
      () => fireConversionIfStillActive(false),
      UPGRADE_WINDOW_MS - elapsed,
    );
    return;
  }
  if (elapsed <= UPGRADE_WINDOW_MS + LATE_CATCHUP_MS) {
    fireConversionIfStillActive(true);
    return;
  }
  deleteState();
}
