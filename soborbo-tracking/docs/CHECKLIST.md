# Tracking change checklist

Use this on every PR that touches tracking — kit code, consumer-site call
sites, GTM container, or conversion-action config. A tracking change is
not "done" until every applicable item is checked.

## Pre-merge

- [ ] Every new `trackEvent('X')` call has an entry in `EVENTS.md` with:
      consuming GTM trigger, tag(s), and destination platform(s).
- [ ] `npm run check:events` (i.e. `scripts/check-event-contract.mjs`)
      passes locally and in CI.
- [ ] Updated GTM container export is committed in the same PR
      (`gtm/container.json`).
- [ ] No client-side conditional swallows a conversion. In particular:
      no `return` before `window.dataLayer.push()` for any reason that
      depends on the event payload (value, missing fields, upgrade
      window, etc.) — see INVARIANTS "A tracking event is never
      silently dropped".
- [ ] No `window.location` / `history.pushState` / programmatic form
      `submit` / `<a>.click()` directly after a conversion `trackEvent`.
      Use `trackConversionAndNavigate()` instead — see INVARIANTS
      "Conversion → navigation".
- [ ] Server-side mirrors (`sendGA4MP` / `sendMetaCapi`) emit a loud
      structured warning on missing required secrets; they do not
      silently no-op at `debug` level.
- [ ] `wait_for_update` in `GTMHead` (Astro / Next / vanilla) is ≥ the
      CMP's `waitForTime`, not the 500 ms placeholder.

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
- [ ] `META_CAPI_TEST_EVENT_CODE` is **removed** from production env
      (INVARIANT #9).

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
      (`SETUP.md` → "Migrating from a legacy GTM container") to prevent
      28-day audience drift.

## Upgrade window — only if `ENABLE_UPGRADE_WINDOW = true`

The kit ships with `conversion-state.ts` gated off by default — primary
conversions fire immediately. If you've opted in:

- [ ] You've read the rationale in INVARIANTS "Conversions fire
      immediately; dedup at platform" and verified your funnel actually
      benefits from the upgrade window (most don't — the production
      data showed ~87% loss).
- [ ] `UPGRADE_WINDOW_MS` and `LATE_CATCHUP_MS` in `config.ts` match
      your funnel's observed upgrade-time distribution.
- [ ] You've verified the loud runtime warning fires once on first use
      (and confirmed you're not silencing it).
