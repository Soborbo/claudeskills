/**
 * Event ingress contract — WHICH events may travel WHICH path to the gateway.
 *
 * Source of truth: `events.json` (vendored copy of `Serverside/src/events.json`).
 * This file is a hand-written mirror of the derived sets so that sites which copy
 * only `lib/` still carry the contract. `tests/event-contract.test.ts` asserts this
 * file NEVER drifts from events.json — if that test fails, regenerate these arrays
 * from events.json, do not "fix" the test.
 *
 * The two ingress paths (Serverside CLAUDE.md #10):
 *
 *  - BROWSER path (`POST /api/event/conversion`, tokenless): Origin allow-list +
 *    rate limit. ONLY the low-risk click/engagement events below are accepted.
 *  - SERVER path (`POST /api/event/conversion-server`, per-site `X-Admin-Token`,
 *    called by the SITE BACKEND via a service binding): all server-channel events.
 *
 * High-value form/lead/purchase conversions are `server_ingress_only` — the
 * gateway answers **403 (TRK-400-017)** when they arrive on the browser path,
 * because a browser Origin header can be spoofed from curl. Their browser leg is
 * dataLayer-only (Pixel/GA4 via GTM); the site backend dispatches the gateway leg
 * with the SAME event_id (hidden form field) so Meta Pixel↔CAPI dedup still works.
 */

/** Events the browser may POST to the gateway (`/api/event/conversion`). */
export const BROWSER_GATEWAY_EVENTS: ReadonlySet<string> = new Set([
  'phone_number_clicked',
  'email_address_clicked',
  'whatsapp_button_clicked',
  'begin_checkout',
  'video_play',
]);

/**
 * Events the gateway REJECTS on the browser path (403, TRK-400-017). These are
 * sent EXCLUSIVELY by the site backend on `/api/event/conversion-server` with the
 * per-site token. Dispatching them from the browser is a guaranteed silent loss.
 */
export const SERVER_INGRESS_ONLY_EVENTS: ReadonlySet<string> = new Set([
  'quote_calculator_submitted',
  'callback_request_submitted',
  'contact_form_submitted',
  'order_request_submitted',
  'purchase',
]);

/** CRM lifecycle events — only via `/api/event/lead-status` (never from a site). */
export const OFFLINE_EVENTS: ReadonlySet<string> = new Set([
  'lead_validated',
  'lead_qualified',
  'quote_sent',
  'booking_confirmed',
  'job_completed',
  'revenue_confirmed',
  'lead_disqualified',
]);
