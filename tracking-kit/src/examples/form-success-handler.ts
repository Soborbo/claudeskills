/**
 * EXAMPLE — what to do when the primary funnel completes successfully.
 *
 * Call this from the success branch of your form-submission handler
 * (after the API responded 200, ideally after the lead is persisted in
 * the DB so we don't track ghost conversions).
 *
 * Three things happen here:
 *   1. The engagement event fires immediately (`primary_conversion_complete`).
 *   2. The conversion-state machine starts (or restarts) the upgrade
 *      window, capturing the same `event_id` for later dedup.
 *   3. If this is the user's FIRST primary completion ever in this
 *      browser, fire the Meta `ViewContent` engagement signal.
 *
 * Note that we deliberately do NOT fire `primary_conversion` here —
 * that's the conversion-state machine's job. It fires on upgrade
 * (phone/email/whatsapp click within the window) OR on window timeout
 * (late conversion). Firing it here would double-count.
 */

import {
  markViewContentFired,
  mirrorMetaCapi,
  resetConversionState,
  setUserDataOnDOM,
  normalizeUserData,
  trackEvent,
  type UserData,
} from '@/lib/tracking';

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

  // 2. Start (or restart) the upgrade window. Returns the persisted
  //    state including the event_id we should reuse for the engagement
  //    event below.
  const state = resetConversionState({
    value: input.value,
    currency: input.currency,
    service: input.service,
    eventId: input.eventId,
  });

  // 3. Engagement event — fires every time, immediately. This is the
  //    one your save-conversion API route ALSO mirrors to GA4 MP, with
  //    the SAME event_id, so the browser+server pair dedup.
  trackEvent('primary_conversion_complete', {
    event_id: state.eventId,
    value: state.value,
    currency: state.currency,
    service: state.service,
  });

  // 4. First-ever-completion signal for Meta `ViewContent`. Fires once
  //    per browser ever; the conversion-state machine remembers via
  //    `viewContentFired` flag so re-runs don't double-fire.
  if (!state.viewContentFired) {
    const firstViewId = trackEvent('primary_first_view', {
      service: state.service,
      // intentionally NO value — this is engagement, not commerce
    });
    void mirrorMetaCapi('primary_first_view', firstViewId);
    markViewContentFired();
  }
}
