/**
 * EXAMPLE — what to do when the primary funnel completes successfully.
 *
 * Call this from the success branch of your form-submission handler
 * (after the API responded 200, ideally after the lead is persisted in
 * the DB so we don't track ghost conversions).
 *
 * Three things happen here (default, ENABLE_UPGRADE_WINDOW = false):
 *   1. PII lands on the side-channel via `setUserDataOnDOM`.
 *   2. `primary_conversion` fires immediately. The server-side save
 *      endpoint mirrors the SAME `event_id` to GA4 MP + Meta CAPI so
 *      the destinations dedup browser ↔ server.
 *   3. If this is the user's FIRST primary completion ever in this
 *      browser, fire the Meta `ViewContent` engagement signal.
 *
 * If you're navigating to a thank-you page after this handler, use
 * `trackConversionAndNavigate` for the primary_conversion fire — see
 * INVARIANT #19. A plain `window.location.href = '/thanks'` after a
 * `trackEvent` silently loses the conversion on unload.
 *
 * If you opt into `ENABLE_UPGRADE_WINDOW = true` in config.ts, see the
 * commented-out alternative path at the bottom of this file.
 */

import {
  hasViewContentFired,
  markViewContentFired,
  mirrorMetaCapi,
  setUserDataOnDOM,
  normalizeUserData,
  trackEvent,
  type UserData,
} from '@/lib/tracking';
import { generateUUID } from '@/lib/tracking';

interface FormSuccessInput {
  /** Server-issued conversion id. Pass this through from the API
   *  response body so the same id is used by client + server. If you
   *  don't have one, omit and the kit will generate. */
  eventId?: string;
  /** Free-form label for what was converted on. */
  service: string;
  /** Currency-denominated value of the conversion (estimated revenue,
   *  quote total, etc.). */
  value: number;
  currency?: string;
  /** PII collected during the funnel — required for Enhanced
   *  Conversions (Google Ads) + Advanced Matching (Meta CAPI). All
   *  fields are optional; pass what you have. */
  user: Partial<UserData>;
}

export function onFormSuccess(input: FormSuccessInput): void {
  // 1. Stash PII on the side-channel BEFORE any tracking event fires —
  //    the Google Ads enhanced-conversion variable reads from this.
  setUserDataOnDOM(normalizeUserData(input.user));

  const eventId = input.eventId || generateUUID();
  const currency = input.currency || 'EUR';

  // 2. The conversion — fires immediately. Pass `event_id` explicitly so
  //    your server-side save endpoint can mirror the same id to GA4 MP +
  //    Meta CAPI, and the destinations dedup browser ↔ server.
  trackEvent('primary_conversion', {
    event_id: eventId,
    value: input.value,
    currency,
    service: input.service,
  });
  void mirrorMetaCapi('primary_conversion', eventId, {
    value: input.value,
    currency,
  });

  // 3. First-ever-completion signal for Meta `ViewContent`. Fires once
  //    per browser ever — the flag lives in its own localStorage key
  //    so it survives any conversion-state wipe.
  if (!hasViewContentFired()) {
    const firstViewId = trackEvent('primary_first_view', {
      service: input.service,
      // intentionally NO value — this is engagement, not commerce
    });
    void mirrorMetaCapi('primary_first_view', firstViewId);
    markViewContentFired();
  }
}

// ---------------------------------------------------------------------------
// Alternative: ENABLE_UPGRADE_WINDOW = true (opt-in)
// ---------------------------------------------------------------------------
//
// Only use this path if you've flipped ENABLE_UPGRADE_WINDOW to true in
// config.ts AND measured that your funnel's in-window upgrade rate
// justifies the lost late-fires (production data has shown ~87% loss
// in lead-gen funnels — verify, don't assume). See INVARIANT #3.
//
// import { resetConversionState } from '@/lib/tracking';
//
// export function onFormSuccessWithUpgradeWindow(input: FormSuccessInput): void {
//   setUserDataOnDOM(normalizeUserData(input.user));
//
//   // Start the upgrade window. Returns the persisted state including
//   // the event_id we reuse for the engagement event below.
//   const state = resetConversionState({
//     value: input.value,
//     currency: input.currency,
//     service: input.service,
//     eventId: input.eventId,
//   });
//
//   // Engagement event — fires every time, immediately. The actual
//   // `primary_conversion` is owned by conversion-state.ts (upgrade or
//   // window timeout).
//   trackEvent('primary_conversion_complete', {
//     event_id: state.eventId,
//     value: state.value,
//     currency: state.currency,
//     service: state.service,
//   });
//
//   if (!hasViewContentFired()) {
//     const firstViewId = trackEvent('primary_first_view', { service: state.service });
//     void mirrorMetaCapi('primary_first_view', firstViewId);
//     markViewContentFired();
//   }
// }
