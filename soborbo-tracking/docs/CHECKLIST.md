# Tracking change checklist

Use this on every PR that touches tracking — kit code, consumer-site call
sites, GTM container, or conversion-action config. A tracking change is
not "done" until every applicable item is checked.

## Pre-merge

- [ ] Every new browser event (`push({ event: 'X' })` in `events.ts`) is in
      `docs/CANONICAL-EVENTS.md` with: GA4 event name, gateway `event_name`,
      consuming GTM trigger, tag(s), and destination platform(s).
- [ ] `npm run check:events` (i.e. `server/check-event-contract.mjs`)
      passes locally and in CI.
- [ ] `npm test` and `npm run typecheck` pass.
- [ ] Updated GTM container export is committed in the same PR
      (`gtm/container.json`).
- [ ] New gateway `event_name`s are in the allowed set
      (`ALLOWED_EVENT_NAMES` + `EVENT_NAME_MAP` in `Soborbo/Serverside`).
- [ ] No raw PII in the dataLayer — conversion PII goes through
      `setUserDataForEC()` to the hidden side-channel, never a dataLayer push.
- [ ] No client-side conditional swallows a conversion under the *consent it
      should fire on* — analytics gates the dataLayer push, marketing gates the
      gateway POST, and the two are independent (a marketing-only visitor still
      gets the server-side conversion).
- [ ] Navigation after a conversion does not drop it: the gateway POST uses
      `navigator.sendBeacon` / `keepalive`, and `<TrackedForm>` waits
      (`waitForTracking`) before re-submitting. Don't navigate synchronously
      before a non-beacon dispatch.
- [ ] `wait_for_update` in `Tracking.astro`'s Consent Default is ≥ the CMP's
      load/restore time (2000 ms for CookieYes), not a 500 ms placeholder.

## Post-deploy verification (within 24h)

- [ ] Tag Assistant on staging: every relevant tag fires; the same
      `event_id` appears on the browser pixel and the CAPI mirror call.
- [ ] GA4 DebugView shows the events with expected parameters
      (`event_id`, `value`, `currency`, `service`).
- [ ] Server-side GA4 MP events land under the **real** session
      source/medium (not `(not set)/(not set)`) — verifies INVARIANT
      #17 (no synthetic `client_id`).
- [ ] Google Ads conversion actions reach (or stay at) "Recording
      conversions" within 24h.
- [ ] Meta Events Manager Test Events shows matching `eventID` between
      Pixel and CAPI; the event is marked "Browser AND Server" and EMQ
      rating is unchanged or better.
- [ ] Meta CAPI test-event code is **removed** from the production gateway KV
      (it forces all events into Test Events and out of optimization).

## Post-deploy monitoring (48–168h)

- [ ] The conversion-volume watchdog (see `MONITORING.md`) is deployed
      and includes every new conversion event in `KEY_EVENTS`.
- [ ] Daily check of the watchdog output for the first 7 days.
- [ ] Compare ground-truth lead count (Sheets / CRM) to GA4 key-event
      count daily for the first 7 days. Drift > 20% means something is
      dropping events — first suspect: the most recent tracking-touching
      deploy.

## Migration (only when replacing an existing tracking system)

- [ ] Legacy emitters left in place; new emitters added alongside.
- [ ] Both paths run in parallel for **≥7 days** (INVARIANTS "Migrate
      by running in parallel").
- [ ] In each destination (GA4 + Google Ads + Meta), the new path's
      volume matches the legacy path within ±10%.
- [ ] Only then: legacy emitters removed, in a **separate PR**.
- [ ] After cutover, run the Meta Custom Events queue cleanup
      (see `MIGRATION-existing-sites.md`) to prevent 28-day audience drift.

> **Note (v5):** there is no "upgrade window" / `conversion-state.ts` /
> `ENABLE_UPGRADE_WINDOW` in this skill. Conversions fire immediately and dedup
> at the platform via the shared `event_id` (browser Pixel ↔ server CAPI). That
> legacy machinery from the old tracking-kit was removed.
