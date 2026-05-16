# Tracking system invariants (DO NOT VIOLATE)

These constraints exist because the tracking system has measurable revenue
impact and is hard to verify after the fact (data appears with 24-48h
delay in Google Ads / GA4). Read README.md for the full rationale.

If you're handing this kit to an LLM or a new engineer, give them THIS
file alongside README.md and SETUP.md. The rules below are what saves
production from silent regressions.

## 1. PII never goes into `dataLayer`

Email, phone, names, addresses are stored on a hidden DOM element via
`setUserDataOnDOM()` and read by GTM variables directly. `trackEvent()`
silently strips the entire `PII_KEYS` set (`user_data`, `user_email`,
`user_phone`, `email`, `phone`, `phone_number`, `first_name`, `last_name`,
`name`, `street`, `city`, `postal_code`, `postcode`, plus the Meta
Advanced Matching short-codes `em` / `ph` / `fn` / `ln`) — and warns in
dev about the stripped keys. Adding raw PII fields to a `trackEvent`
call is forbidden — push the value through `setUserDataOnDOM()` and
reference it in GTM via the "User-Provided Data" variable instead.

**If you introduce a new PII-shaped field name, ADD IT to `PII_KEYS`.**
The guard is name-based, not value-based: putting an email STRING into
a non-PII key like `lead_id` will NOT be caught — the caller must
choose the right key.

**Why:** anything in `window.dataLayer` is visible to every GTM tag
(including third-party HTML tags). One leaked PII push to the wrong tag
is a GDPR incident — and Meta's automatic detection (Events Manager →
Settings → Blocked parameters) will block the offending event-parameter
pair within 24h, killing optimization signal until you remediate per
INVARIANT #16.

## 2. Every `trackEvent` call ends up with an `event_id`

Either pass one in (preferred — when the same event has a server-side
mirror that needs to dedup) or let `trackEvent` generate one. The same
`event_id` is what Meta uses to deduplicate Browser + CAPI for the same
conversion.

**Why:** without a shared `event_id`, browser Pixel + server CAPI
produce two distinct conversions in Meta Events Manager — your reported
volume doubles and Smart Bidding optimization gets noisy data.

## 3. Conversions fire immediately; dedup at the platform, not in client state

The kit's default (and the only mode supported without an explicit
opt-in flag) is: fire `primary_conversion` directly from your
form-success handler. Pass an `event_id` (UUID v4); the platforms
dedupe browser vs. server via Meta `event_id` and Google Ads `orderId`.

Do **NOT** hold conversions in `localStorage` waiting for a possible
"upgrade" (a phone click or callback that becomes the canonical Lead).
This pattern lost ~87% of quote conversions in a real production
deployment of this kit because most users do not return within the 25h
catch-up window.

`conversion-state.ts` is preserved in the kit but **gated behind
`ENABLE_UPGRADE_WINDOW` in `config.ts` (default `false`)**. Every
exported function in that module is a no-op when the flag is off, and
the first invocation when the flag is on emits a loud console warning.
Do not re-introduce client-side conversion hold timers without
measuring (not assuming) that your funnel's upgrade rate within the
window justifies the lost late-fires.

**Why:** a primary completion that lives only in `localStorage` is
invisible to the platforms until either an upgrade fires or the
late-catchup timer runs on a return visit. In aggregate that's a huge
drop in raw signal. The correct primitive for "don't count the same
lead twice" is platform-side dedup on a stable id, not a client-side
state machine.

## 4. Server-side mirrors run from one place per type

- **GA4 MP**: from your save-conversion endpoint and from
  `/api/track/abandonment`. Add a new MP send only if you have a new
  category of event the browser cannot reliably fire.
- **Meta CAPI**: from `/api/meta/capi`, called by the client mirror.
  This is the single ingress for client-driven CAPI sends.

Don't sprinkle `sendGA4MP` / `sendMetaCapi` calls across random API
routes. If you do, you'll lose track of who fires what and start
double-counting.

**Why:** centralizing the server-side fan-out makes it possible to audit,
add rate limits, and turn off a leg cleanly when something breaks.

## 5. Consent default MUST be the first script in `<head>`, before GTM

`GTMHead.astro` (and the Next.js / vanilla equivalents) already enforce
this. Don't reorder. Adding ANY analytics, A/B-testing, or session-replay
`<script>` above the consent default block will cause that script to run
under undefined consent state, which in the EU is a regulatory exposure.

**Why:** Consent Mode v2 has a defined default-state requirement. Tags
that fire before the default declaration assume "granted" (Google) or
fail-open (Meta) — both wrong outcomes.

## 6. `form_abandonment` is best-effort — don't tighten the budget

`pagehide` and `visibilitychange` don't fire reliably on mobile. We use
`navigator.sendBeacon()` to `/api/track/abandonment` and forward to GA4
MP server-side. Treat the numbers as **directional, not exact**. Don't
build paying-customer math (CAC / funnel-to-revenue ratios) on
abandonment counts.

**Why:** the next person who looks at the abandonment funnel will be
tempted to "fix" the missing 30% by retrying the beacon, switching
sendBeacon for fetch+keepalive in tighter loops, etc. Those fixes break
in different ways. Accept the noise.

## 7. Phone numbers normalize to E.164 before hashing

`normalizePhoneE164(phone, countryCode)` is the only correct path for
Meta CAPI phone hashing. Don't push raw user-typed phone strings through
the CAPI mirror — the server-side hash will be of the wrong string and
Meta's match rate drops.

**Why:** Meta's hash-match expects normalized E.164. "06 1 234 5678" and
"+3612345678" hash to different values; only the latter matches a real
profile.

## 8. Hashing for Meta CAPI happens server-side

`setUserDataOnDOM` stores raw values (UPD for Google Ads needs them raw —
Google hashes inside the tag). Meta CAPI requires SHA-256 of normalized
values; we do that in `server.ts` using `@noble/hashes`. Do not pre-hash
client-side and send the hash to `/api/meta/capi` — the server will
double-hash and Meta will reject.

**Why:** the two integrations have different hashing contracts. Mixing
them produces silent match-rate drops that look identical to "Pixel was
broken last week" in the Meta UI.

## 9. Test event code is for testing only

`META_CAPI_TEST_EVENT_CODE` makes every Meta CAPI hit land in the Test
Events tab instead of production. Useful while validating, ruinous if
left set in production: real conversions disappear from optimization.
Remove this env var the moment you've finished validation.

**Why:** the variable is silent — there's no banner saying "test mode
on," and the GA4 / Pixel UI keeps reporting the test events as if real,
so the breakage is invisible until you check the Events Manager
production view.

## 10. ViewContent fires once per browser EVER

`primary_first_view` (which becomes Meta `ViewContent`) is gated by the
standalone `hasViewContentFired()` flag, NOT by a field inside the
conversion state. The conversion state is wiped after every primary
conversion fires, so a flag stored inside it would re-arm `ViewContent`
on the next funnel completion — defeating the "once per browser" intent
and double-counting the engagement signal.

When adding new "first-time" engagement signals, give each its own
persistent localStorage key. Do NOT bundle them into the conversion
state.

## 11. PII at rest has a 24h TTL and a consent gate

`setUserDataOnDOM()` only persists to localStorage when `ad_storage`
consent is granted, and the stored blob carries `savedAt` so reads past
`USER_DATA_TTL_MS` (default 24h) silently purge. Fire-and-forget paths
(late conversion, upgrade) call `clearUserDataOnDOM()` after the
synchronous side-channel read — so the at-rest PII window matches the
window during which it could plausibly be needed.

Don't widen the TTL or remove the consent gate to "fix" missing PII on
late conversions — the user who closed the tab past the TTL is gone,
and forwarding their hashed PII to Meta without consent is a regulatory
exposure.

## 12. Server endpoints reject requests without an `Origin` header

`isAllowedOrigin()` fails closed: no Origin = not a browser request =
reject. Server-to-server, curl, and most automation tooling don't set
Origin, so a missing header is the strongest signal that something is
attempting to inject fake conversions. Don't relax this to `if (origin
&& !allowed)` — that's the bypass we just closed.

## 13. CAPI server rejects requests without a granted consent snapshot

The client `mirrorMetaCapi` reads the live Consent Mode v2 snapshot and
includes it in the payload. The server re-checks (`metaCapiConsentAllowed`)
and refuses to forward to Meta if `ad_storage` or `ad_user_data` is
denied. This is defense-in-depth — a tampered client can omit the
snapshot, and the server still won't forward.

## 14. `custom_data` is whitelisted on the CAPI endpoint

Only `value` (range-checked against `MAX_CONVERSION_VALUE`), `currency`
(ISO-4217 regex), and `content_name` (length-capped string) are
forwarded to Meta. Adding a field to the whitelist means:
1. Add validation to `sanitizeCustomData()` in BOTH the Astro and
   Next.js routes.
2. Verify the new field can't be used to inflate Smart Bidding signals
   (e.g. don't let the client set `predicted_ltv` directly).

## 15. Don't add a new DataLayer event without updating the GTM container

Adding a new `trackEvent('my_new_event', ...)` call without a
corresponding GTM trigger and tag means the event lives in the dataLayer
and dies there. If you forget the GTM side, the new event is invisible
to GA4, Ads, and Meta even though the code looks correct.

**Why:** GTM is the routing layer. The dataLayer push is necessary but
not sufficient — every new event needs (a) a custom-event trigger and
(b) at least one tag firing on it. EVENTS.md documents the workflow.

## 16. Meta Blocked Parameters: "Request review" is self-attestation, not audit

When Meta detects raw PII on a custom event parameter, it lands in
**Events Manager → Settings → Blocked parameters** with `Action required`
status. The "Request review" button opens a yes/no popup (*"Did you
make changes?"*) — answering `yes` unblocks immediately. **There is no
server-side review.** SETUP.md documents the full remediation playbook;
two non-obvious behaviors that make this an invariant:

1. **Cross-event attribution.** When one event leaks (e.g.
   `quote_request` carries a raw `user_email`), Meta's session-level
   detector tags **other custom events fired in the same session** with
   the same `user_email` parameter (e.g. `calculator_step`). The
   blocked-parameters list will appear to show two independent leaks —
   it is one leak. Fix the source event; the secondary attribution
   clears on its own.

2. **Recurrence detection.** After unblock, Meta watches for ~7 days.
   If the same event-parameter pair leaks again, Meta auto-re-blocks,
   this time more aggressively (potential account-level delivery
   impact). Self-attestation is a contract — **deploy the fix BEFORE
   clicking "Request review"**, never after.

**Workflow:** (1) grep the codebase for `trackEvent` calls passing the
flagged param name, (2) move the value to `setUserDataOnDOM()`, (3)
deploy + verify in Tag Assistant that the next push is clean, (4) THEN
click "Request review" and answer `yes`.

**Why an invariant rather than just docs:** the natural reaction to a
"blocked parameter" notice is to click the unblock button immediately
to restore signal. Doing that without deploying the fix burns the
recurrence-detection grace period and risks an account-level penalty.
Treat the self-attestation as a load-bearing promise.

## 17. Never send a GA4 MP event with a synthetic `client_id`

Server-side GA4 Measurement Protocol sends MUST use the visitor's real
`_ga` cookie `client_id`, read via `readGa4IdsFromCookie()` from the
request's `Cookie` header. The kit's MP endpoints are same-origin, so
the `_ga` and `_ga_<container>` cookies ride along on every form POST
and `sendBeacon` automatically — no client-side relay needed.

- **No synthetic `client_id` — ever.** Not an IP+User-Agent hash, not a
  random number, not a request fingerprint. If there's no real `_ga`
  cookie (fresh visitor, or analytics consent denied),
  `readGa4IdsFromCookie()` returns `{}` and the caller MUST **skip the MP
  send entirely** — guard on `clientId` being present.
- **Pass `session_id` whenever you have it.** `readGa4IdsFromCookie()`
  also returns the `session_id` from the `_ga_<container>` cookie;
  `sendGA4MP()` merges it (with `engagement_time_msec`) into every
  event's params. Without `session_id` the event still attributes to the
  right user but starts a *new* session — a session-count distorter.
- **There is no `deriveClientId()` helper.** It was deleted on purpose.
  Don't reintroduce a "fallback" id generator under any name — the next
  person to call it re-creates this exact bug six months later.
- **Applies to every MP path:** the save-conversion mirror, the
  `/api/track/abandonment` beacon, and any future beacon endpoint. They
  all receive same-origin cookies, so they can all read the real id.

**Why:** a synthetic `client_id` is an unknown user to GA4 → new user,
new session, no source/medium → the event lands in the
`(not set)/(not set)` bucket. The browser-side `gtag` event for the
*same* conversion arrives under the real `_ga` client_id, so GA4 cannot
dedup the pair. Every server-side "backstop" event then becomes a zombie
unattributed session; Google Ads imports those conversions without
attribution and Smart Bidding optimizes on poisoned data. It's nearly
invisible at first — the client-side event usually fires, so the
`google/cpc` bucket isn't empty, just suspiciously low. You only catch
it by diffing the `form_start` source breakdown against the conversion
event's source breakdown in GA4 Explore.

The Meta CAPI side has the identical trap on `_fbp` / `_fbc` cookies
(and the `fbclid` URL param). `meta-mirror.ts` already does this right —
it parses the click-id cookies back out and shape-validates them. Use it
as the reference pattern when wiring any new server-side mirror.

## 18. A tracking event is never silently dropped

If a payload field looks wrong (out-of-range value, missing currency,
unexpected shape), **clamp or omit the field and emit the event without
it**. Never `return` from a tracking function without pushing the
event.

What happened on a real production deploy of this kit's lineage: a
`trackEvent()` wrapper had a `value > 2_100_000 HUF` guard that
`return`-ed before the `dataLayer.push()`. Every quote above that
threshold disappeared from GA4, Google Ads, **and** Meta — not only
from value-based bidding. The most valuable customers were the most
invisible.

The current `trackEvent()` in `tracking.ts` strips PII keys but always
pushes — preserve that contract for any wrapper, gate, or pre-validation
layer you add around it. A field can be omitted; the event cannot.

## 19. Conversion → navigation MUST go through `trackConversionAndNavigate`

Never call `window.location` / `history.pushState` / programmatic
`<form>.submit()` / `<a>.click()` directly after a `trackEvent` that
represents a conversion. GTM tags fire asynchronously and the browser
tears down pending beacons on unload, so the conversion silently drops
— usually on the exact submits you wanted to attribute.

Use `trackConversionAndNavigate(name, params, url)` from
`@/lib/tracking` instead; it pushes the event, waits for GTM to settle
(via `gtag` `event_callback` when available), and navigates with a
hard-timeout fallback so the form still works if GTM is slow or blocked.

The Meta CAPI mirror (`mirrorMetaCapi`) already uses
`navigator.sendBeacon` with a `fetch(..., { keepalive: true })`
fallback for the same reason. Do not regress to a plain `fetch` "for
simplicity" — both paths must be unload-safe.

## 20. `wait_for_update` in `GTMHead` must match the CMP's load time

The kit's Consent Mode v2 default block sets `wait_for_update: 2000`.
That is a floor, not a target. If your CMP advertises a longer
`waitForTime` (some OneTrust configs go 3000-5000 ms), set
`wait_for_update` to at least that value.

What goes wrong with a too-low value: a returning consented visitor's
stored choice is still loading when GTM evaluates the default tag
gates. The tags fire under the *denied* default and the conversion is
lost. This is invisible — there is no error; the visitor just doesn't
appear in conversion-attribution data, and they are precisely the most
attributable visitors (you have their consent and they came back).

Verify in DevTools after deploy: `window.google_tag_data.ics.entries.ad_storage.update`
must become defined after the visitor's choice is restored. If it stays
undefined past `wait_for_update` ms, your CMP isn't wiring through.

## 21. Server-side mirrors do not fail silently on missing config

`sendGA4MP()` and `sendMetaCapi()` are allowed to no-op when their
required env vars (`GA4_API_SECRET`, `GA4_MEASUREMENT_ID`,
`META_CAPI_ACCESS_TOKEN`, `META_PIXEL_ID`) are missing — secret
rotations and Preview deploys shouldn't 500. But the no-op MUST emit a
**loud, structured warning the first time each missing secret is hit
per process**, not at `debug` level.

The kit's `warnMissingSecretOnce()` helper in `server.ts` does this;
keep the `__pipeline: 'error'` field on the meta object so your tail
worker / log routing forwards the warning to the operator.

What happened: `GA4_API_SECRET` was unset for the full audit window of
a production deployment. The server-side mirror was the only safety
net for events that lost the client-side race, and nobody knew it was
off — the `debug` line drowned in production log volume. 2.5 weeks
later, conversions were down ~90% and we were diagnosing the wrong
thing.

## 22. The GTM container is a committed artifact

Commit your GTM container export to the consuming repo, recommended
path `gtm/container.json`, on the same PR as any code change that
touches `trackEvent` call sites. Do NOT `.gitignore` it.

`scripts/check-event-contract.mjs` enforces this in CI:

1. Every `trackEvent('X')` call site appears in `EVENTS.md`.
2. Every `EVENTS.md` event has a `CE - X` custom-event trigger in the
   committed GTM container JSON.
3. Every `CE - X` trigger fires at least one non-paused tag.

A code-only PR that breaks the implicit contract with the container is
the most common way this kit fails in production. In a past audit, a
`trackEvent('quote_request')` was emitting ~600 events/month and
**zero** reached GA4 because no GTM trigger consumed it. The drift went
undetected for the lifetime of the integration.

## 23. Migrate by running in parallel, not by switching

When replacing a legacy tracking implementation, run the old and the
new emitters **in parallel for at least 7 days**. Verify in each
destination (GA4 + Google Ads + Meta) that the new path's volume
matches the old path within ±10% before removing the legacy emitters,
in a separate PR.

What happened on a real production cutover: day-2 removal of a "legacy
thank-you push" took out the last safety net (the new path had a
latent CMP timing bug that masked itself when the legacy push was
still running) and dropped the conversion floor to ~12% of normal.
Same-day cutover hides exactly the failure modes the parallel run is
designed to surface.
