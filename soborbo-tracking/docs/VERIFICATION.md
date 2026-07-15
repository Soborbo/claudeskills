# VERIFICATION — the layered proof harness

## Why this exists (and what it can honestly promise)

No test suite can prove an implementation "perfectly correct" — tests sample
behavior, they can't enumerate it. What a suite CAN do is make specific,
named failure classes impossible to ship silently. This harness targets the
five classes that actually shipped on a production site and cost months of
conversions, each of which was invisible to the unit-test layer:

| # | Failure class (real incident) | Why unit tests missed it | Layer that catches it |
|---|---|---|---|
| 1 | The spec itself was wrong (60-min "upgrade window" — conversions almost never fired; Ads saw 1 in 14 weeks) | The tests verified the spec, and the code matched the spec perfectly | **live-data** (outcome: events must ARRIVE, attributed) |
| 2 | Repo GTM JSON ≠ live container (audits validated an export that was never published) | The committed artifact was internally consistent | **gtm-live** (reads the LIVE container via the API) |
| 3 | dataLayer push succeeded, pixel request cancelled by synchronous navigation | dataLayer-level assertions pass; the loss happens after | **e2e** (network truth: the REQUEST is the evidence) + **source** (nav-after-track rule) |
| 4 | Seam bugs: Turnstile in one layout but the conversion page used another; gclid captured by one module, never read by the next | Each unit was correct in isolation | **dist** (built-HTML pairing) + **e2e** (seeded funnel crosses the seams) |
| 5 | Nobody closed the loop with GA4/Ads data after "code looks right" | Not a code property at all | **live-data** (scheduled + post-deploy) |

The honest claim after a full `--strict` PASS: *the five known failure
classes are excluded, the machinery emits correctly-formed requests for a
real browser session, and production data confirms attributed arrivals for
consented traffic.* What remains outside any suite's reach: consent-denied
visitors (invisible to GA4), ad-platform-side configuration (which action is
Primary), and specs that are wrong in ways nobody has seen yet — that last
one is why live-data runs on a schedule, not once.

## The layers

```
node verify/run-verify.mjs --config verify.site.json [--strict] [--base-url URL]
```

| Layer | Runs where | Needs | Verifies |
|---|---|---|---|
| `source` | CI, <1s | nothing | no `value: 0`, no sync nav after `trackEvent`, GA4 MP call-sites session-stitched, no PII keys in pushes; also extracts the event vocabulary |
| `dist` | CI, after build | `dist/` | every conversion-capable page has the FULL Turnstile pair; GTM loader with non-empty ID + noscript on every page; consent default BEFORE the GTM loader; SSR pages fetched via `--base-url` |
| `gtm-live` | CI / on-demand | GTM API creds (snapshot = fallback) | every conversion event the code emits has a LIVE trigger firing ≥1 unpaused tag; dead live triggers; committed-JSON drift |
| `e2e` | CI w/ browser, or against preview/prod URL | Playwright + a site adapter | network truth: conversion fires once (with a settle window — "once at first glance" is not once); refresh doesn't re-fire; changed quote re-fires with new id; callback pixels are issued before the navigation COMMIT **and delivered** (`requestfinished` — an issued-then-cancelled request is the regression, not evidence); phone click carries value; Turnstile pair present at runtime. Third-party pixels are answered locally with 204 — no data pollution; site APIs are stubbed — no fake leads |
| `live-data` | scheduled + post-deploy | GA4 SA creds | key events ARRIVED in the window AND their "(not set)"-source share is under threshold (attribution quality, not just volume) |

**A SKIP is never a PASS.** Every layer that can't run says so loudly and
exits 3; the summary lists it; `--strict` turns skips into failures. This is
the rule that prevents "conditionally done" from reading as done. The full
skip map:

- `dist` with `ssrPages` configured but no `--base-url` → **SKIP** (the SSR
  conversion page is exactly where the historical Turnstile bug lived).
- `gtm-live` without creds: falls back to the committed snapshot; a clean
  snapshot-only run is still **SKIP** — a snapshot cannot prove the LIVE
  container (that failure mode is incident #2 above). With creds present,
  live ALWAYS takes precedence over the snapshot. Snapshots older than 14
  days warn; `fetchedAt` in the snapshot JSON is the staleness anchor.
- `e2e` capability skips (GTM/Turnstile unreachable in a sandbox): the
  factory appends each skipped claim to `VERIFY_SKIP_FILE`; the orchestrator
  downgrades a green Playwright exit to **SKIP** if that file is non-empty.
- missing prerequisites (no `dist/`, no source dir, invalid manifest) are
  **ERROR** (exit 2), not skip — those are misconfigurations to fix, not
  capabilities to lack.

### Network-truth interception rules (e2e)

- Route patterns are **RegExp, not globs** — Playwright's glob `*` does not
  match `/`, and real pixel URLs carry path segments (Ads conversion id:
  `…/pagead/conversion/123456789/?…`; modern Meta: `facebook.com/tr/?…`).
  Globs silently let REAL conversion pixels through to production.
- A **blocking catch-all** over the known tracking hosts backstops pattern
  rot: anything it catches was missed by a specific matcher — blocked
  anyway, recorded in `misses`, and `misses` must be empty at the end of
  every test. Script loads (gtm.js, fbevents.js, conversion_async.js) pass
  through: 204-ing them would break the very tags under test.
- Every recorded request carries `at` (issued) and `finishedAt`/`failed`
  (delivered vs cancelled). Race-class assertions must check delivery.
- Known residual: a GA4 tag using `server_container_url` (custom sGTM
  collect domain) is invisible to matchers, catch-all AND capability
  probes. Moving to sGTM requires extending `network-truth.ts` first.

## Site setup

1. Copy `verify/` into the site repo (same copy-model as `lib/` +
   `components/`).
2. Write `verify.site.json`:

```json
{
  "src": "./src",
  "dist": "./dist/client",
  "mpFn": "sendGA4MP",
  "conversionEvents": [
    "quote_calculator_conversion", "callback_conversion", "phone_conversion",
    "email_conversion", "whatsapp_conversion", "contact_form_submit"
  ],
  "keyEvents": ["quote_calculator_conversion", "callback_conversion", "phone_conversion"],
  "conversionCapablePages": ["/instantquote/", "/instantquote/your-quote/"],
  "ssrPages": ["/instantquote/your-quote/"],
  "turnstileExempt": [],
  "dispatchBundleMarkers": [],
  "gtmSnapshot": "./verify/gtm-live-snapshot.json",
  "committedGtm": "./GTM-workspace.json",
  "e2eDir": "./e2e",
  "liveData": { "days": 2, "maxUnassigned": 0.4 }
}
```

Unknown manifest keys are warned about by name — a typo like
`turnstileExampt` must not silently disable an exemption.

**Force-list every SSR conversion page in `conversionCapablePages`.** The
tel:/mailto: heuristic works on static HTML, but an SSR page whose
conversion UI is a client-only React island renders NO links server-side —
the heuristic sees nothing and the Turnstile-pair requirement silently
doesn't apply. This is precisely the page class the historical bug lived
on. (SSR pages are also status-checked: a styled 404 or a redirect to a
different path counts as FAIL, not as the page it landed on.)

3. Write the e2e **site adapter** (`e2e/adapter.ts`) implementing
   `SiteAdapter` from `verify/e2e/funnel-factory.ts` — the only site-specific
   part is `seedCompletedState` (inject a completed funnel into
   sessionStorage; build it FROM the site's own typed `initialState` so the
   seed can never drift from the schema) and `stubSiteApis` (route-stub the
   save/callback endpoints so tests create no leads). Then the spec is one
   line: `defineFunnelSpecs(adapter)`.
4. Wire the npm scripts:

```json
{
  "verify": "node verify/run-verify.mjs --config verify.site.json",
  "verify:strict": "node verify/run-verify.mjs --config verify.site.json --strict"
}
```

5. Credentials (CI secrets): `GA_SA_EMAIL`, `GA_SA_PRIVATE_KEY`,
   `GA4_PROPERTY_ID` (live-data + gtm-live), `GTM_ACCOUNT_ID`,
   `GTM_CONTAINER_ID` (gtm-live; grant the service account Read on the
   container). Without them those layers SKIP loudly.

## When to run what

- **Every commit / PR**: `source` + `dist` (fast, no creds).
- **Before + after every deploy**: full `--strict` run against the preview
  URL (`--base-url`), e2e included.
- **Daily (scheduled)**: `gtm-live` + `live-data` — this pair catches drift
  that happens OUTSIDE the repo (GTM UI edits, consent breakage, upstream
  platform changes), which is exactly where post-hoc audits kept going
  wrong. The volume watchdog (`monitoring/watchdog.ts`) complements this
  with drop alerts.

## False positives

Every source rule accepts an explicit, reviewable escape hatch on the same
or previous line: `// verify-allow: <rule>` (`value-zero`,
`nav-after-track`, `mp-session-stitch`, `pii-in-push`). `dist` exemptions go
in `turnstileExempt` in the manifest. The point is that every exception is
visible in diff review, never implicit.

## Mutation validation

The suite itself is tested by reintroducing each historical bug and
asserting the corresponding layer FAILS (see the table above). Re-run that
exercise whenever the rules change — a verifier nobody has ever seen fail
is not evidence of anything.

Validated 2026-07-08 against painlessremovals.com (the reference site):

| Mutation (historical bug reintroduced) | Layer | Result |
|---|---|---|
| Turnstile script stripped from a built conversion-capable page | dist | ❌ FAIL (caught, zero noise) |
| GTM container-id token stripped from a built page (empty `GTM_ID` at build) | dist | ❌ FAIL (caught) |
| Consent Mode default block removed from a built page | dist | ❌ FAIL (caught) |
| Conversion event renamed in code (`callback_conversion` → `_v2`) | gtm-live | ❌ 2× FAIL: configured-but-not-emitted AND emitted-but-no-live-trigger (caught from both directions) |
| `value: 0` reinserted into a real `trackEvent` payload | source | ❌ FAIL (caught) |
| Navigation-safe helper regressed to `trackEvent` + sync redirect | source | ❌ FAIL (caught) |
| `sessionId` removed from a `sendGA4MP` call-site | source | ❌ FAIL (caught) |
| Refresh double-fire / stale-guard / callback race / value-drop | e2e | encoded as dedicated scenarios in `funnel-factory.ts` — and on its FIRST full run against the reference site, `refresh-no-dupe` caught a genuine production bug that 195 unit tests, a 25-agent adversarial code review and a bot PR-review had all passed: the quote-signature input contained a `completedAt` timestamp minted per call, so the fingerprint rotated every mount and a refresh re-fired the conversion under a fresh event_id. Fixed; all 6 scenarios green since. |

First-run false positives (fixed, kept as calibration notes — a verifier's
first real run is where you calibrate it, not where you trust it):

- the `value-zero` rule matched the COMMENTS explaining the rule (now
  comment-stripped);
- `nav-after-track` flagged `tel:`/`mailto:` href assignments, which open
  the dialer without unloading the page (now excluded);
- the GTM check expected the container id INSIDE the loader URL, but the
  standard snippet concatenates it at runtime (`gtm.js?id='+i`) — it
  failed all 115 pages of a perfectly tracked build. Now: loader presence
  + a `GTM-XXXX` token anywhere on the page.

Second-round hardening (an adversarial review of the harness itself — two
independent reviewers tasked with making each layer LIE — found these false
negatives; all fixed and encoded):

- `nav-after-track` missed `window.location.replace()`, nav on the SAME
  line as the `trackEvent` call, and any line where `//` appeared inside a
  string literal (`'https://…'` truncated the whole line as a "comment");
- `pii-in-push` missed shorthand properties (`{ email }`), keys after a
  nested object (`{ meta: {…}, email }` — body capture stopped at the
  first `}`), and the runtime set's `name`/`city` keys;
- `value-zero` missed `value: 0.0`; the `mp-session-stitch` look-ahead was
  satisfied by a `// TODO: wire sessionId` comment;
- the e2e route patterns were globs — Playwright's `*` doesn't match `/`,
  so REAL Ads (`…/conversion/<id>/?…`) and modern Meta (`…/tr/?…`) pixel
  URLs were neither recorded NOR blocked (both headline claims false);
- the callback-race test timestamped navigation AFTER `waitForURL`
  resolved (near-vacuous ordering) and treated an issued-then-cancelled
  request as evidence — now: `framenavigated` commit time + delivery
  (`requestfinished`) required;
- "fires exactly once" resolved at the first observation — a duplicate
  200 ms later passed. Now: 2.5 s settle window, then re-assert.

The meta-lesson is the same at every layer: **the verifier is code too.
Review it adversarially, mutation-test it, and treat "the harness passed on
its first try" as a smell, not a comfort.**
