# Tracking system invariants (DO NOT VIOLATE)

These constraints exist because tracking has measurable revenue impact and is hard
to verify after the fact (data appears with 24–48h delay in Google Ads / GA4).

Architecture recap (v5): **browser** = `events.ts` (`push({ event })`) + `index.ts`
(conversion functions) + `gateway.ts` (the `/api/event/conversion` POST) + the
Astro components; **server** = the event-gateway worker (`Soborbo/Serverside`),
which does Meta CAPI + GA4 MP + Google Ads, hashing, consent re-check, and
durability. Many invariants below are enforced server-side *in the gateway*, not in
this skill's code — they're still load-bearing.

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

## 4. The gateway is the single server-side ingress

All server-side fan-out (Meta CAPI + GA4 MP + Google Ads) happens in the
event-gateway worker, behind the one `/api/event/conversion` route. Don't add
ad-hoc server-side conversion sends from random API routes in the site worker.

**Why:** centralizing the fan-out makes it auditable, rate-limitable, and
independently switchable per leg (Queues/DLQ retry) when a platform breaks.

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

## 9. Meta CAPI test event code is for testing only

The Meta CAPI test-event code (in the gateway's per-site KV) makes every CAPI hit
land in the Test Events tab instead of production. Ruinous if left set: real
conversions disappear from optimization. Remove it the moment validation is done.

**Why:** it's silent — no banner, and the GA4/Pixel UI keeps reporting the test
events as if real, so the breakage is invisible until you check the production view.

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

## 12. The gateway rejects requests without an `Origin` header

The gateway fails closed: no Origin = not a browser request = reject. Server-to-
server and curl don't set Origin, so a missing header is the strongest signal of an
injection attempt. Don't relax this to `if (origin && !allowed)`.

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

## 17. Never send a GA4 MP event with a synthetic `client_id`

Server-side GA4 MP (in the gateway) MUST use the visitor's real `_ga` `client_id`.
`gateway.ts` parses it from the `_ga` cookie (`extractGAClientId`) and the
`session_id` from the `_ga_<stream>` cookie (`extractGASessionId`) and sends them in
the POST; the gateway forwards them to MP. If there's no real `_ga` cookie (fresh
visitor, or analytics consent denied), **skip the MP send** — never synthesize an id
(no IP+UA hash, no random number). Pass `session_id` whenever present, or the event
starts a new session and distorts session counts.

**Why:** a synthetic `client_id` is an unknown user to GA4 → new user, new session,
`(not set)/(not set)` source/medium. The browser `gtag` event for the same
conversion arrives under the real id, so GA4 can't dedup; the server "backstop"
becomes a zombie unattributed session and Google Ads imports it without attribution,
poisoning Smart Bidding. The Meta side has the identical trap on `_fbp`/`_fbc` — the
client parses those cookies back out (and reconstructs `_fbc` from `fbclid`, see
`getFbc()` in persistence.ts).

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

v5 is unload-safe by construction: the gateway POST uses `navigator.sendBeacon` with
a `fetch(..., { keepalive: true })` fallback (`sendToWorker`), and `<TrackedForm>`
awaits `waitForTracking(600)` before `requestSubmit()`. Don't regress either path to
a plain `fetch` "for simplicity."

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
