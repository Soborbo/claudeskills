# Tracking change checklist

Use this on every PR that touches tracking — kit code, consumer-site call
sites, GTM container, or conversion-action config. A tracking change is
not "done" until every applicable item is checked.

## Pre-merge

- [ ] **Default branch verified** in every repo touched
      (`git remote show origin | grep "HEAD branch"`) AND the Workers Builds
      production branch confirmed — a PR into the wrong branch is a silent no-op.
- [ ] Every new browser event (`push({ event: 'X' })` in `events.ts`) is in
      `docs/CANONICAL-EVENTS.md` with: GA4 event name, gateway `event_name`,
      consuming GTM trigger, tag(s), and destination platform(s).
- [ ] `npm run check:events` (i.e. `server/check-event-contract.mjs`) passes —
      with `--engine <Serverside>/src/events.json` when the engine repo is checked
      out (vendored events.json must not drift).
- [ ] `npm test` and `npm run typecheck` pass — including
      `tests/event-contract.test.ts` (the ingress-split drift guard).
- [ ] Updated GTM container export is committed in the same PR
      (`gtm/container.json`).
- [ ] New gateway `event_name`s exist in the ENGINE's `src/events.json` first
      (that repo is the source of truth), then re-vendor here.
- [ ] **The ingress split is respected**: no `server_ingress_only` event is
      dispatched from browser code anywhere in the SITE REPO (grep the repo — the
      deployed bundle doesn't contain client scripts); every gated form's API
      route calls `sendGatewayConversion` with the hidden-field `event_id` and the
      CRM's id as `lead_id`.
- [ ] No raw PII in the dataLayer — conversion PII goes through
      `setUserDataForEC()` to the hidden side-channel, never a dataLayer push.
- [ ] No client-side conditional swallows a conversion under the *consent it
      should fire on* — analytics gates the dataLayer push, marketing gates the
      gateway POST, and the two are independent.
- [ ] Navigation after a conversion does not drop it: the browser gateway POST
      uses `navigator.sendBeacon` / `keepalive`, and `<TrackedForm>` waits
      (`waitForTracking`) before re-submitting.
- [ ] `wait_for_update` in `Tracking.astro`'s Consent Default is ≥ the CMP's
      load/restore time (2000 ms for CookieYes), not a 500 ms placeholder.
- [ ] If wrangler config changed: top-level keys (e.g. `keep_vars`) sit ABOVE
      every `[table]`, and the generated `dist/server/wrangler.json` was inspected
      after a build.

## Post-deploy verification (within 24h) — observable checks only

- [ ] `server/smoke-test.sh https://<host>` passes (gate behavior: 403 for gated
      events + missing Origin on the browser path, 401 for tokenless server ingress).
- [ ] The next smoke cron books its D1 ledger row: `meta | accepted | <http_status>`
      (or `skipped` for a meta-less site). **`accepted` with NULL http_status is a
      bug (TRK-950-004), never a pass.**
- [ ] Gateway daily digest: no smoke alarm, no zero-conversion warning for the site.
- [ ] For a REAL lead (organic, not synthetic!): Meta Events Manager shows Pixel +
      CAPI with the same `eventID`, "Browser AND Server", EMQ unchanged or better —
      **observe passively; do not fire test conversions from a live browser.**
- [ ] Google Ads conversion actions stay at "Recording conversions".
- [ ] Cloudflare Workers logs clean (no TRK-4xx/9xx) for 24h.
- [ ] Client diagnostics clean on a real page view: no TRK-1005 / TRK-1006 in
      `window.__sbTrackingDiag`.

## Post-deploy monitoring (48–168h)

- [ ] The conversion-volume watchdog (see `MONITORING.md`) includes every new
      conversion event in `KEY_EVENTS`.
- [ ] Daily check of the watchdog output + gateway digest for the first 7 days.
- [ ] Compare ground-truth lead count (Sheets / CRM) to the gateway D1 ledger and
      GA4 key-event count daily for the first 7 days. Drift > 20% means something
      is dropping events — first suspect: the most recent tracking-touching deploy.

## Migration (only when replacing an existing tracking system)

- [ ] Legacy emitters left in place; new emitters added alongside.
- [ ] Both paths run in parallel for **≥7 days** (INVARIANTS #23).
- [ ] In each destination (GA4 + Google Ads + Meta), the new path's
      volume matches the legacy path within ±10%.
- [ ] Only then: legacy emitters removed, in a **separate PR**.
- [ ] After cutover, run the Meta Custom Events queue cleanup
      (see `MIGRATION-existing-sites.md`) to prevent 28-day audience drift.

> **Note (v6):** there is no "upgrade window" / `conversion-state.ts`, no Turnstile
> token gate, and no browser dispatch for gated form events. Conversions fire
> immediately; forms hand off to the backend via the `event_id` hidden field; dedup
> happens at the platform via the shared `event_id`.
