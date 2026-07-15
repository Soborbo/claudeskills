# Tracking system invariants (DO NOT VIOLATE)

These constraints exist because tracking has measurable revenue impact and is hard
to verify after the fact (data appears with 24–48h delay in Google Ads / GA4).

Architecture recap (v6 / Run 6): **browser** = `events.ts` (`push({ event })`) +
`index.ts` (conversion functions) + `gateway.ts` (the `/api/event/conversion` POST
for LOW-RISK CLICKS ONLY) + the Astro components; **site backend** =
`server/backend/gateway-dispatch.ts` (the `/api/event/conversion-server` POST for
form/lead/purchase conversions, per-site token); **server** = the event-gateway
worker (`Soborbo/Serverside`), which does Meta CAPI on-site + Google Ads offline
(Data Manager), hashing, consent re-check, three-state ledger, and durability.
The gateway sends NO GA4 and validates NO Turnstile. Many invariants below are
enforced server-side *in the gateway*, not in this skill's code — they're still
load-bearing.

If you hand this skill to an LLM or a new engineer, give them THIS file alongside
SKILL.md and CANONICAL-EVENTS.md.

## 1. PII never goes into `dataLayer`

Email, phone, names go to a hidden side-channel via `setUserDataForEC()`
(`window.__sbUserData` + `#__sb_user_data__`), read by GTM's "User-Provided Data"
Custom JS variable. `buildConversionPayload()` (events.ts) builds the dataLayer
push and **never** includes PII — only `event_id`, `value`, `currency`,
attribution, `session_id`, `device`. The gateway gets PII in the POST body and
hashes it server-side.

**Never push a raw PII field (`email`, `phone`, `phone_number`, `first_name`,
`last_name`, `user_provided_data`, or the Meta short-codes `em`/`ph`/`fn`/`ln`)
into the dataLayer.** Route the value through `setUserDataForEC()` instead.

**Why:** anything in `window.dataLayer` is visible to every GTM tag (including
third-party HTML tags). One leaked PII push is a GDPR incident — and Meta's
automatic detection (Events Manager → Blocked parameters) will block the offending
event-parameter pair within 24h, killing optimization signal until you remediate
per INVARIANT #16.

## 2. Every conversion ends up with an `event_id`

`generateEventId()` mints a UUID v4; the conversion functions in `index.ts` use the
SAME id for the browser dataLayer push AND the gateway dispatch. Meta dedups
browser Pixel + CAPI on it.

**Why:** without a shared `event_id`, browser Pixel + server CAPI produce two
distinct conversions in Meta Events Manager — your reported volume doubles and
Smart Bidding gets noisy data.

## 3. Conversions fire immediately; dedup at the platform, not in client state

Fire the conversion directly from the success/click handler with a shared
`event_id`; the platforms dedup browser vs. server via Meta `event_id` and Google
Ads `orderId`.

There is **no** "upgrade window" / `conversion-state.ts` / `ENABLE_UPGRADE_WINDOW`
in v5 — that legacy machinery was removed. Do **not** hold conversions in
`localStorage` waiting for a possible upgrade. That pattern lost ~87% of quote
conversions in a real production deployment because most users do not return within
the catch-up window.

**Why:** a completion that lives only in `localStorage` is invisible to the
platforms until a return visit. The correct primitive for "don't count the same
lead twice" is platform-side dedup on a stable id, not a client-side state machine.

## 4. The gateway is the single server-side fan-out — with exactly two ingress doors

All server-side fan-out (Meta CAPI + forwarders + Google Ads offline) happens in
the event-gateway worker, behind exactly two routes: `/api/event/conversion`
(browser, tokenless, low-risk clicks only) and `/api/event/conversion-server`
(site backend / CRM, per-site token, everything else). Don't add ad-hoc
server-side conversion sends from random API routes in the site worker — the
backend always goes through `sendGatewayConversion` to the authenticated door.

**Why:** centralizing the fan-out makes it auditable, rate-limitable, and
independently switchable per leg (Queues/DLQ retry) when a platform breaks; the
two-door split keeps spoofable browser traffic away from the money events.

## 5. Consent default MUST be the first script in `<head>`, before GTM

`Tracking.astro` enforces this: the `gtag('consent','default', …)` block runs
before the GTM snippet. Don't reorder. Adding ANY analytics / A-B / session-replay
`<script>` above the consent default makes it run under undefined consent state — an
EU regulatory exposure.

**Why:** Consent Mode v2 has a defined default-state requirement. Tags that fire
before the default declaration assume "granted" (Google) or fail-open (Meta).

## 6. `form_abandoned` is best-effort — don't tighten the budget

`pagehide`/`visibilitychange` don't fire reliably on mobile; the abandon event is
**directional, not exact**. Don't build CAC / funnel-to-revenue math on abandonment
counts, and don't "fix" the missing ~30% by retrying beacons in tighter loops —
those fixes break in different ways. Accept the noise.

## 7. Phone numbers normalize before hashing

`normalizePhone()` (persistence.ts) is the one canonical normalizer (UK `07…`→`+44`,
HU `06…`→`+36`, E.164-ish). The gateway re-normalizes + SHA-256-hashes server-side
using the per-site `country_code`. Don't push raw user-typed phone strings as the
hash input.

**Why:** Meta's hash-match expects normalized E.164. "06 1 234 5678" and
"+3612345678" hash to different values; only the latter matches a real profile.

## 8. Hashing for Meta CAPI happens server-side (in the gateway)

The Google Ads Enhanced-Conversions side-channel stores **raw** values (Google
hashes inside the tag). Meta CAPI needs SHA-256 of normalized values, done **in the
gateway**. Do not pre-hash client-side before the gateway — it will double-hash and
Meta will reject.

**Why:** the two integrations have different hashing contracts. Mixing them produces
silent match-rate drops that look identical to "the Pixel was broken last week."

## 9. Meta test-event code is PER-REQUEST only — never in KV

The sanctioned mechanism is the per-request `test_event_code` in the POST body,
resolved by the site worker ONLY when the lead's email equals
`TRACKING_TEST_LEAD_EMAIL` (`resolveTestEventCode` — keyed on the lead, so a real
lead can never be diverted). The gateway's KV site-config MUST NOT carry
`meta.test_event_code`: the config is edge-cached (`cacheTtl=300s`), and inside
the cache window every REAL conversion goes to Meta's Test stream — this has
happened in production **twice**. `generate-site.mjs` hard-errors on a KV test
code (`--allow-test-event-code` is the explicit pre-launch opt-in; remove before
go-live). If you see `meta.test_event_code` in a live site's KV config, it is a
bug — remove it.

**Why:** it's silent — no banner, the Pixel UI keeps reporting, and ROAS quietly
zeroes out until someone checks the production event stream.

## 10. ViewContent fires once per browser EVER

`quote_calculator_opened` (→ Meta `ViewContent`) must be gated by its **own**
persistent localStorage flag, NOT by a field inside any conversion/session state
that gets wiped on completion — otherwise it re-arms and double-counts. Give every
new "first-time" engagement signal its own persistent key.

## 11. Side-channel PII is marketing-gated and short-lived

`setUserDataForEC()` writes only with **marketing consent**, and `clearUserDataForEC()`
auto-runs a few seconds after each write (GTM reads it synchronously when its
conversion tags fire). The attribution localStorage (`sb_tracking`) is likewise
marketing-gated with a 90-day TTL.

Don't widen the clear delay or drop the consent gate to "fix" missing PII on late
conversions — forwarding a user's PII without consent is a regulatory exposure.

Consent is THREE-state, not two: **granted / denied / unknown**. "Unknown" is the
boot window before the CMP has loaded (no CookieYes cookie, JS API absent) — it is
NOT a user decision. Fail closed on the wire under unknown (send no click IDs / no
PII), but never PURGE at-rest data that was persisted under a prior grant — treating
unknown as denial deletes a consented user's stored gclid/PII on every early
page-load and orphans the conversion from its ad click. Purge only on an explicit
DENIED. (`collectAttribution` implements this; keep any new consent gate to the
same three-state contract.)

## 12. The BROWSER path rejects requests without an `Origin` header

The gateway fails closed on `/api/event/conversion`: no Origin = not a browser
request = reject (403). Server-to-server and curl don't set Origin, so a missing
header is the strongest signal of an injection attempt. Don't relax this to
`if (origin && !allowed)`. (The SERVER path has no Origin — its control is the
per-site token; the two must not be mixed.)

## 13. The gateway rejects requests without a granted consent snapshot

The client (`gateway.ts`) reads the live Consent Mode v2 snapshot
(`getConsentState()`) and includes it in the payload. The gateway re-checks
(`require_consent` for EEA) and refuses to forward to the ad platforms if
`ad_storage` / `ad_user_data` is denied. Defense in depth — a tampered client can
omit the snapshot and the gateway still won't forward.

## 14. `custom_data` is whitelisted on the gateway

Only `value` (range-checked), `currency` (ISO-4217), and `content_name`
(length-capped) are forwarded to Meta. Adding a field means adding validation in the
gateway AND verifying it can't be used to inflate Smart Bidding signals (e.g. don't
let the client set `predicted_ltv`).

## 15. Don't add a dataLayer event without updating the GTM container

A new `push({ event: 'X' })` without a corresponding GTM Custom-Event trigger + tag
lives in the dataLayer and dies there — invisible to GA4, Ads, and Meta even though
the code looks correct. `npm run check:events` enforces the contract (INVARIANT #22).

## 16. Meta Blocked Parameters: "Request review" is self-attestation, not audit

When Meta detects raw PII on a custom event parameter it lands in **Events Manager →
Settings → Blocked parameters** with `Action required`. "Request review" is a yes/no
popup — there is no server-side audit. Two non-obvious behaviors:

1. **Cross-event attribution.** When one event leaks a raw param, Meta tags other
   events in the same session carrying the same param. It looks like two leaks; it's
   one. Fix the source; the secondary clears itself.
2. **Recurrence detection.** After unblock, Meta watches ~7 days; a repeat leak
   auto-re-blocks more aggressively (possible account-level delivery impact).

**Workflow:** (1) grep for the flagged param in `push(...)` call sites / a
`setUserDataForEC` misuse, (2) move it to the side-channel, (3) deploy + verify the
next push is clean in Tag Assistant, (4) THEN click "Request review". Deploy the fix
**before** requesting review, never after.

## 17. The server sends NO GA4 — do not re-enable it

The gateway's GA4 legs are OFF, both on-site (browser owns GA4 via GTM — GA4 has
no event_id dedup, a server mirror double-counts) and offline (the CRM loop has
no browser, hence no real `_ga` client_id — every offline MP event would open a
synthetic GA4 client: new user, new session, `(not set)/(not set)` source).
The client still parses `client_id`/`session_id` from the `_ga` cookies into the
browser-path payload (ledger/debug value), but no GA4 MP call is made server-side.

If a future change ever re-introduces a server GA4 leg, the old rule stands:
ONLY with the visitor's real `_ga` client_id, NEVER a synthesized one (no IP+UA
hash, no random number) — a synthetic id poisons attribution and Smart Bidding.
The Meta side has the identical trap on `_fbp`/`_fbc` — the client parses those
cookies back out (and reconstructs `_fbc` from `fbclid`, see `getFbc()`).

## 18. A tracking event is never silently dropped

If a payload field looks wrong (out-of-range value, missing currency, odd shape),
**clamp or omit the field and emit the event without it**. Never `return` from a
tracking function without firing.

What happened in this kit's lineage: a wrapper had a `value > 2_100_000 HUF` guard
that `return`-ed before the `dataLayer.push()`. Every quote above that threshold
disappeared from GA4, Ads, AND Meta — the most valuable customers were the most
invisible. `buildConversionPayload()` omits `value` when ≤ 0 but always pushes;
preserve that contract in any gate you add.

## 19. Conversion → navigation MUST be unload-safe

Never call `window.location` / `history.pushState` / programmatic `<form>.submit()` /
`<a>.click()` synchronously after a conversion that depends on a non-beacon dispatch.
GTM tags fire async and the browser tears down pending requests on unload.

v6 is unload-safe by construction: the browser gateway POST uses
`navigator.sendBeacon` with a `fetch(..., { keepalive: true })` fallback
(`sendToWorker`, no token mint in front of it — the beacon queues immediately),
and `<TrackedForm>` awaits `waitForTracking(600)` before `requestSubmit()`. Don't
regress either path to a plain `fetch` "for simplicity." The FORM conversions'
server leg is backend-dispatched (inside the form POST request), so page unload
cannot kill it at all.

One subtlety a fixed wait doesn't cover:

- **GTM pixel tags on the same event need their own gate.** If GTM fires Ads/GA4/
  Meta tags off the dataLayer push, navigate from GTM's `eventCallback` (+
  `eventTimeout` and the same safety timeout), not synchronously after the push —
  the dataLayer push "succeeding" says nothing about the pixel requests it
  triggered. This race silently zeroed a production site's "Callback requested"
  Google Ads conversions for months.

## 20. `wait_for_update` in `Tracking.astro` must match the CMP's load time

The Consent Default block sets `wait_for_update: 2000` (CookieYes' advertised load
time). That's a floor — if your CMP advertises longer, raise it.

A too-low value: a returning consented visitor's stored choice is still loading when
GTM evaluates the tag gates → tags fire under the *denied* default and the conversion
is lost. Invisible — no error, the visitor just doesn't appear in attribution, and
they're the most attributable (consented + returning). Verify in DevTools:
`window.google_tag_data.ics.entries.ad_storage.update` must become defined after the
choice restores.

## 21. The gateway must not fail silently on missing config

The gateway may no-op a leg when its per-site secrets are missing (rotations /
preview deploys shouldn't 500) — but it MUST emit a **loud, structured warning** the
first time each missing secret is hit, not at `debug` level, routed to your tail
worker.

What happened: a GA4 API secret was unset for a full audit window; the server-side
mirror was the only safety net for events that lost the client-side race, and the
`debug` line drowned in log volume. 2.5 weeks later conversions were down ~90% and we
were diagnosing the wrong thing.

## 22. The GTM container is a committed artifact

The container export is committed at `gtm/container.json` on the same PR as any code
change that touches event emission. Don't `.gitignore` it.
`server/check-event-contract.mjs` (`npm run check:events`) enforces in CI:

1. Every browser event emitted in code (`push({ event: 'X' })`) is in
   `docs/CANONICAL-EVENTS.md`.
2. Every such event has a `CE - X` Custom-Event trigger in the container.
3. Every such trigger fires ≥ 1 non-paused tag.

A code-only PR that breaks the implicit contract with the container is the most
common way tracking fails in production: in a past audit a `quote_request` event
emitted ~600/month and **zero** reached GA4 because no trigger consumed it.

## 23. Migrate by running in parallel, not by switching

When replacing a legacy tracking implementation, run old and new emitters **in
parallel for ≥ 7 days**. Verify in each destination (GA4 + Ads + Meta) that the new
path's volume matches the old within ±10% before removing the legacy emitters, in a
separate PR. Same-day cutover hides exactly the failure modes the parallel run is
designed to surface (a real cutover dropped the conversion floor to ~12% of normal
when day-2 removal took out the last safety net masking a CMP timing bug).

## 24. High-value events are server-ingress-only (the Run 6 gate)

`quote_calculator_submitted`, `callback_request_submitted`, `contact_form_submitted`,
`order_request_submitted`, `purchase` (the `server_ingress_only` flags in
events.json) are 403'd on the browser path (TRK-400-017). Their server leg goes
EXCLUSIVELY through the site backend (`server/backend/gateway-dispatch.ts`,
per-site token, service binding), reusing the browser's `event_id`. The client lib
double-guards (TRK-1005) and `tests/event-contract.test.ts` +
`tests/gateway-contract.test.ts` enforce it.

**Why:** the browser path's only control is a spoofable Origin header; the money
events must be non-forgeable. AND the reverse lesson from the same incident:
before ANY gate is enforced, audit every call site in the SITE REPO — three
production flows relied on browser-only dispatch and would have silently lost
their conversions when the gate shipped. The deployed worker bundle does NOT
contain client scripts; audit source, not bundles.

## 25. `lead_id` is the CRM's own record id — or absent

The gateway `lead_id` column joins the on-site event to the offline CRM loop
(lead-status → Google Ads offline). It comes from the CRM webhook RESPONSE
(`{success, id}`), coerced to string. If the CRM call failed or returned no id,
send NO lead_id. Never substitute event_id, an email hash, or a timestamp — a
populated-but-unjoinable key is worse than NULL because NULL is detectable.
The gateway DROPS an invalid-format lead_id with a warning but keeps the event —
a join-key format quirk must not kill the money event.

## 26. The ledger never lies (engine-side, but read it correctly)

Delivery status is three-state: `accepted` / `skipped` / `rejected`. `accepted`
REQUIRES a vendor HTTP status — the engine downgrades a statusless "accepted" to
`skipped` and fires TRK-950-004 (critical). A deliberate skip (no platform
config, consent-blocked, no identifiers) is `skipped`, never a fake success.
When verifying an install, `meta | skipped` for a meta-less site is CORRECT;
`accepted` with NULL http_status is a bug. A monitor that counts `skipped` as
coverage shortfall is also a bug (deliberate skips subtract from the expected
base).

## 27. Bot-guarded forms silently drop tracking too

When a form endpoint fake-succeeds on a honeypot/time-check hit, it must signal
`silent: true` internally, and the caller must skip the CRM forward AND every
tracking sink (browser handled separately — the backend never dispatches for a
silent drop). A bot lead that books a Meta conversion poisons optimization
exactly like a lost real one.

## 28. Gateway 400/401/403/404 are non-retriable; 204 is browser-only

The site-side dispatch treats 400 (invalid payload), 401 (bad token), 403, 404
(no KV config) as OUR misconfiguration: fail loud, no retry loop. The gateway
answers 204 only on the browser-beacon path (beacons can't read bodies); every
server-to-server route returns real error statuses so the caller CAN retry on
5xx. Never "improve" a server route to swallow errors with a 204.

## 29. Synthetic testing goes through the authenticated ingress only

NO live-pixel browser testing — two production Meta leaks came from it. The
sanctioned synthetic proof is the daily smoke cron (`server/backend/smoke.ts`):
authenticated ingress, per-request test code, deterministic
`smoke-<site>-YYYYMMDD` event_id (idempotency-deduped), guarded by the gateway
digest's `SMOKE_SITES` check. The smoke module REFUSES to run without the test
code configured — a synthetic event without it would land in the production Meta
stream.

## 30. Deploy-config footguns (each one has bitten)

- **Default branch is not always `main`** (a live site deploys from `master`).
  Before any merge: `git remote show origin | grep "HEAD branch"` + check which
  branch Workers Builds deploys.
- **TOML top-level keys go ABOVE every `[table]`** — `keep_vars = true` placed
  after `[triggers]` parses as `triggers.keep_vars`, and the next deploy wipes
  every dashboard-managed var. Always inspect the generated
  `dist/server/wrangler.json` after a build.
- **Cloudflare loop protection eats same-zone fetches** — a site worker must call
  the gateway through a SERVICE BINDING, never a plain fetch to its own
  `/api/event/*` URL (the request short-circuits and the conversion vanishes
  while the endpoint returns 200).
