# Conversion-volume monitoring

The kit's biggest production failure mode is a tracking change that
silently breaks one event without breaking the code — the call site
still exists, runs, returns; the event just no longer reaches GA4,
Google Ads, or Meta. The browser-side `dataLayer.push()` looks healthy.
There is no exception. The dashboards look identical until the affected
event volume is missed days later.

A real production deployment of this pattern dropped **~90% of Google
Ads conversions** for **2.5 weeks** before anyone noticed.

The watchdog in [`monitoring/watchdog.ts`](../monitoring/watchdog.ts) closes
that gap to within 24 hours.

## What it does

A Cloudflare Worker runs daily on a cron schedule. For each event in
`KEY_EVENTS`:

1. Queries GA4 Data API for yesterday's event count.
2. Queries GA4 Data API for the 7-day window ending the day before
   yesterday, computes the daily average.
3. If yesterday's count is below `ALERT_RATIO * baselineAvg` (default
   60%), the event is flagged.
4. If any events are flagged, a single email goes to `ADMIN_EMAIL` via
   Resend, listing each event with yesterday / baseline / ratio.

Events with a baseline below `MIN_BASELINE_PER_DAY` (default 5) are
skipped — too noisy to alert on. Adjust if your volume is lower than
that.

## Setup

### 1. Provision a GA4 service account

- Google Cloud Console → IAM & Admin → Service Accounts → Create.
- Generate a JSON key, copy out the `client_email` and `private_key`.
- GA4 Admin → Property Access Management → grant the SA email the
  **Viewer** role on the GA4 property.

### 2. Deploy the Worker

```bash
# from soborbo-tracking/monitoring/
npx wrangler init --type ts --yes
# copy watchdog.ts into the generated folder
```

Minimal `wrangler.toml`:

```toml
name = "tracking-watchdog"
main = "watchdog.ts"
compatibility_date = "2024-12-01"

[triggers]
crons = ["0 8 * * *"]   # 08:00 UTC daily, after GA4 has finished
                        # backfilling the previous day's data
```

### 3. Set secrets

```bash
npx wrangler secret put GA4_PROPERTY_ID       # numeric, e.g. 123456789
npx wrangler secret put GA_SA_EMAIL           # service-account email
npx wrangler secret put GA_SA_PRIVATE_KEY     # paste the full PEM, \n escaped
npx wrangler secret put RESEND_API_KEY        # Resend API key
npx wrangler secret put ADMIN_EMAIL           # who gets the alerts
npx wrangler secret put ALERT_FROM            # optional, verified Resend sender
```

### 4. Verify

- `npx wrangler tail` while triggering a manual run: `npx wrangler dev --test-scheduled`,
  then hit `http://localhost:8787/__scheduled`.
- Confirm the Worker reaches GA4 (no auth errors in the tail).
- Temporarily lower `ALERT_RATIO` to 1.5 so any normal day flags every
  event — verify the email arrives. Restore to 0.6 before going live.

## Adapting `KEY_EVENTS`

The default list covers the v5 lead-gen conversion taxonomy (the gateway
`event_name`s — see CANONICAL-EVENTS.md): `contact_form_submitted`,
`quote_calculator_submitted`, `callback_request_submitted`, `phone_number_clicked`,
`email_address_clicked`, `whatsapp_button_clicked`.

For e-commerce, swap to `purchase`, `add_to_cart`, `begin_checkout`,
`view_item`. **Engagement-only events** (`form_start`, `scroll_*`,
`form_step_complete`) don't belong here — they're noisy and not
actionable. The watchdog is for the events you'd be willing to wake up
for at 2am if they crashed.

Every event you put in `KEY_EVENTS` should also appear in `CANONICAL-EVENTS.md`
and have a GTM trigger + at least one active tag (enforced by
`server/check-event-contract.mjs`).

## Tuning

- **False positives.** A drop below 60% can happen on a slow Sunday or
  after a holiday — the baseline includes Mon-Sun weighting. If you get
  weekend noise, either widen the baseline (`BASELINE_DAYS = 14`) or
  raise `MIN_BASELINE_PER_DAY` so only events with reliable daily
  volume are checked.
- **False negatives.** A 30% drop won't fire (it's above the 60%
  threshold). If you need tighter sensitivity, lower `ALERT_RATIO` to
  0.75 — accept more false positives in exchange for catching smaller
  regressions earlier.
- **Multi-property.** If you run the same kit on several properties
  (different brands, regions), deploy one Worker per property — each
  with its own `GA4_PROPERTY_ID` and (optionally) its own
  `KEY_EVENTS`.

## When the alert fires

The alert email points the operator at the most recent
tracking-touching deploy. Workflow:

1. Open GA4 DebugView, fire each flagged event from staging, confirm
   it appears.
2. If GA4 doesn't see it, check the GTM container — was the
   `CE - <event>` trigger removed? `check-event-contract.mjs` would
   have caught a code-side rename, but a GTM-only edit slips past it.
3. If GTM looks healthy, check the consent state — a CMP misconfig can
   silently deny ads consent for everyone (especially after a CMP
   plan/version bump).
4. If consent looks healthy, check the server-side mirrors — a missing
   `GA4_API_SECRET` or `META_CAPI_ACCESS_TOKEN` would only show up in
   the structured warning the kit emits on first hit per process (see
   `INVARIANTS.md` → "Server-side mirrors do not fail silently").

## Client diagnostic codes (real-time, complementary)

The watchdog above is **volume-based** (it notices conversions dropped, after the
fact). The client also emits **real-time** coded diagnostics for the failure modes
that cause those drops — see `OBSERVABILITY-CODES.md`. The two complement each other:

- **`TRK-1002`** (gateway POST failed) / **`TRK-1006`** (gateway rejected the POST)
  tell you *immediately* that the browser-path dispatch is broken — before the
  watchdog's daily volume comparison would. **`TRK-1005`** flags a wiring bug the
  moment a gated form event is dispatched from browser code.
- **`TRK-3001`** (PII blocked from the dataLayer) flags a GDPR regression the moment
  it ships.

Forward the `sb-tracking-diagnostic` CustomEvent (or scrape `window.__sbTrackingDiag`)
to the same alerting sink as the watchdog so both the leading (codes) and lagging
(volume) signals land in one place.

## Gateway-side monitoring (engine — the primary safety net since Run 6)

The client codes and the GA4 watchdog above are the BROWSER's view. The gateway
(`Soborbo/Serverside`) has its own, stronger net — know it before you build more:

- **Three-state D1 ledger.** Every delivery books `accepted` / `skipped` /
  `rejected` per platform. `accepted` ALWAYS carries the vendor's HTTP status —
  the engine downgrades a statusless success to `skipped` and fires
  **TRK-950-004** (critical). A green dashboard over a ledger full of statusless
  "accepted" rows is the exact failure this killed.
- **Daily synthetic smoke lead** (`server/backend/smoke.ts`, 04:4x UTC per site) —
  proves site worker → token → gateway → Meta TEST stream → ledger with no human.
  The gateway's **daily digest** (08:00 UTC) alarms when a site in `SMOKE_SITES`
  has no fresh `smoke-*` row (chain dead) or its Meta leg is `rejected` (vendor
  call broken). `skipped` is OK for a deliberately meta-less site.
- **Zero-conversion guard** in the same digest: a configured site with 0 accepted
  events in 24h is flagged — a silently dead server leg looks exactly like that.
- **DLQ + TRK-900-007**: a failed vendor call is queued for retry (Queue/R2); if
  the retry record itself cannot be persisted anywhere, the event is NOT marked
  dispatched and TRK-900-007 (critical) fires — recovery is a MANUAL resend.
- **TRK-400-017** (browser path rejected a server-only event): occasional hits are
  bots/probes; a sustained spike after a site deploy means a call site regressed
  to browser dispatch (pair it with client TRK-1005).

Runbook for all gateway codes: `Serverside/docs/error-codes.md`.

**Division of labor:** the gateway digest + smoke guard catch server-leg death
within 24h; the GA4 watchdog catches browser-leg / GTM death within 24h; the
client TRK codes catch both in real time on live sessions. All three exist
because each one alone has already missed a multi-week outage.
