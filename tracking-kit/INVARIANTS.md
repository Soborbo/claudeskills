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
strips a `user_data` key if anyone accidentally passes one (and warns in
dev). Adding raw PII fields to a `trackEvent` call is forbidden — push
the value through `setUserDataOnDOM()` and reference it in GTM via the
"User-Provided Data" variable instead.

**Why:** anything in `window.dataLayer` is visible to every GTM tag
(including third-party HTML tags). One leaked PII push to the wrong tag
is a GDPR incident.

## 2. Every `trackEvent` call ends up with an `event_id`

Either pass one in (preferred — when the same event has a server-side
mirror that needs to dedup) or let `trackEvent` generate one. The same
`event_id` is what Meta uses to deduplicate Browser + CAPI for the same
conversion.

**Why:** without a shared `event_id`, browser Pixel + server CAPI
produce two distinct conversions in Meta Events Manager — your reported
volume doubles and Smart Bidding optimization gets noisy data.

## 3. The primary conversion fires once, on upgrade or after the window

Use `resetConversionState()` when the primary funnel completes; let
`markConversionUpgraded()` consume the state when the user takes a
higher-intent action (phone/email/whatsapp click, callback form). Don't
fire `primary_conversion` directly — `conversion-state.ts` owns it.

**Why:** double-firing the primary conversion floods Smart Bidding with
fake conversion-credit. The state machine guarantees exactly-once
behavior across tabs, page closes, and the late-fire timer.

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

## 10. Don't add a new DataLayer event without updating the GTM container

Adding a new `trackEvent('my_new_event', ...)` call without a
corresponding GTM trigger and tag means the event lives in the dataLayer
and dies there. If you forget the GTM side, the new event is invisible
to GA4, Ads, and Meta even though the code looks correct.

**Why:** GTM is the routing layer. The dataLayer push is necessary but
not sufficient — every new event needs (a) a custom-event trigger and
(b) at least one tag firing on it. EVENTS.md documents the workflow.
