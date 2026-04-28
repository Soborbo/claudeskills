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
