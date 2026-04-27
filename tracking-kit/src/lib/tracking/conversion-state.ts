/**
 * Primary-conversion state machine ("upgrade window").
 *
 * The pattern: when a user finishes a primary funnel step (calculator,
 * checkout, free-trial signup) we don't fire the conversion event
 * immediately. Instead we record the completion in localStorage with a
 * timer. If the user takes a higher-intent action (phone/email/whatsapp
 * click, callback form submit) within the window, that action becomes
 * the conversion and the state is marked as upgraded — so we never count
 * both. If the window elapses without an upgrade, we fire
 * `primary_conversion` as a late conversion the next time the user is on
 * a page (or in-tab if the timer is still alive).
 *
 * Why this model: a primary completion alone is not always a real
 * commercial signal — many users browse a quote, get a price, and bounce.
 * A phone click after the price is a stronger signal for Smart Bidding.
 * Rolling the completion into the higher-intent action feeds Ads/Meta
 * fewer, better signals. For users who never upgrade, the late-fire
 * still counts (we don't lose them in attribution).
 *
 * Why localStorage and not sessionStorage: sessionStorage dies when the
 * tab closes, and a non-trivial fraction of users complete the primary
 * step and close the tab before either upgrading or hitting the timeout.
 * localStorage survives that. Cross-tab races are handled with
 * BroadcastChannel.
 *
 * If your funnel has no upgrade window — i.e. you want to fire the
 * conversion immediately — skip this module entirely. Use trackEvent +
 * mirrorMetaCapi directly from your form-success handler.
 */

import { trackEvent } from './tracking';
import { mirrorMetaCapi } from './meta-mirror';
import { generateUUID } from './uuid';
import {
  DEFAULT_CURRENCY,
  LATE_CATCHUP_MS,
  CONVERSION_STATE_CHANNEL,
  CONVERSION_STATE_KEY,
  UPGRADE_WINDOW_MS,
} from './config';

export interface ConversionState {
  value: number;
  currency: string;
  /** Free-form label for what the user converted on (service slug,
   *  product category, etc.). Forwarded as `service` on dataLayer. */
  service: string;
  completedAt: number;
  eventId: string;
  upgraded: boolean;
  /** Whether the Meta `ViewContent` engagement signal has already fired
   *  in this browser. Survives across re-completions so re-runs don't
   *  double-fire. */
  viewContentFired: boolean;
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
    return JSON.parse(raw) as ConversionState;
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
  clearPendingTimer();
  const previous = readState();

  const state: ConversionState = {
    value: input.value,
    currency: input.currency || DEFAULT_CURRENCY,
    service: input.service,
    completedAt: Date.now(),
    eventId: input.eventId || generateUUID(),
    upgraded: false,
    viewContentFired: previous?.viewContentFired ?? false,
  };
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
  const state = readState();
  if (!state) return;
  state.upgraded = true;
  writeState(state);
  clearPendingTimer();
  broadcast('upgraded');
}

export function markViewContentFired(): void {
  const state = readState();
  if (!state) return;
  state.viewContentFired = true;
  writeState(state);
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
}

/**
 * Called on every page-load. If a saved conversion state exists, either
 * resume the timer (if we're inside the upgrade window) or fire a late
 * conversion (if we're past the window but still in the catch-up grace
 * period) or drop the state entirely (if it's stale).
 */
export function resumeConversionTimer(): void {
  const state = readState();
  if (!state || state.upgraded) return;

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
