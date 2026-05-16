# Tracking kit

Portable browser+server tracking pipeline. Drop the `src/lib/tracking/` folder
into your project and wire the GTM components, API routes, and consent
default per the SETUP guide.

This is a generic version of a production tracking system. The opinions
below come from running it on a real lead-generation funnel; the code here
is the same code, with project-specific identifiers stripped out.

## At a glance

| Layer | Tech | Purpose |
| --- | --- | --- |
| Consent | Consent Mode v2 + a CMP (CookieYes / Cookiebot / OneTrust) | Default-deny posture before user picks |
| Container | Google Tag Manager | Routes dataLayer events to GA4, Google Ads, Meta Pixel |
| Browser analytics | GA4 (via GTM) | Engagement + conversion events |
| Browser ads | Google Ads conversions (via GTM) | Smart Bidding signal |
| Browser social | Meta Pixel (via GTM) | Lead / Contact / ViewContent |
| Server analytics | GA4 Measurement Protocol | Backstop for events the browser may miss |
| Server social | Meta Conversions API | Browser+server dedup on shared `event_id` |

## Source layout

```
src/lib/tracking/
  config.ts              # constants (timing windows, storage keys, endpoints) — EDIT FIRST
  uuid.ts                # UUID v4 with HTTPS-less fallback
  tracking.ts            # trackEvent + setUserDataOnDOM (PII side-channel)
  conversion-state.ts    # upgrade-window state machine, localStorage-backed
  form-tracking.ts       # form_start / form_step_complete / form_abandonment
  global-listeners.ts    # tel: / mailto: / wa.me click handlers, scroll depth
  meta-mirror.ts         # client → /api/meta/capi mirror for browser+server dedup
  boot.ts                # imported once per page-load to wire everything up
  server.ts              # GA4 MP + Meta CAPI server-side senders
  index.ts               # public barrel — pages import from here

src/components/
  GTMHead.astro          # Astro variant
  GTMBody.astro          # Astro variant
  GTMNext.tsx            # Next.js (App Router) variant
  gtm-head.html          # vanilla HTML variant
  gtm-body.html          # vanilla HTML variant

src/api/astro/
  meta-capi.ts           # Astro + Cloudflare Pages mount → /api/meta/capi
  abandonment.ts         # Astro + Cloudflare Pages mount → /api/track/abandonment
  save-conversion.example.ts  # how to mirror primary completions in YOUR save endpoint

src/api/nextjs/
  meta-capi.route.ts     # Next.js App Router mount → /app/api/meta/capi/route.ts
  abandonment.route.ts   # Next.js App Router mount → /app/api/track/abandonment/route.ts
```

## DataLayer event reference

The kit's default event taxonomy (you can rename freely — see EVENTS.md
for guidance). Every event includes `event_id` (UUID v4 — generated
automatically when the caller doesn't pass one). `event_id` is the dedup
key Meta uses to pair browser Pixel + server CAPI hits.

| Event name                | When | Key params |
| --- | --- | --- |
| `form_start`              | first focus on a tracked form's input | `form_name`, `page_path`, `page_title` |
| `form_step_complete`      | user advances past a step | `form_name`, `step_name`, `step_number`, `total_steps` |
| `form_abandonment`        | tab close / hide / navigate-away with unsubmitted form | `form_name`, `last_step`, `last_field`, `time_spent_seconds`, `exit_page_path` |
| `primary_conversion_complete` | engagement signal, fires every primary completion | `value`, `currency`, `service`, `event_id` |
| `primary_first_view`      | first primary completion in this browser → triggers Meta `ViewContent` | `service` (NO value, intentionally) |
| `primary_conversion`      | fired by form-success handler after the lead is persisted (default) — or, when `ENABLE_UPGRADE_WINDOW = true`, on phone/email/WA upgrade or after the timer | `value`, `currency`, `service`, optional `late_conversion: true` |
| `callback_conversion`     | callback form submitted | `value`, `currency`, `service`, `source` |
| `phone_conversion`        | tel: click OR programmatic phone dial after primary | `value`, `currency`, `service`, `source`, `tel_target` |
| `email_conversion`        | mailto: click | `source` |
| `whatsapp_conversion`     | click on `wa.me` / `whatsapp.com` link | `source` |
| `scroll_50`, `scroll_90`  | scroll depth thresholds, once per page-load | — |

PII is NEVER pushed to dataLayer. See "PII handling" in INVARIANTS.md.

## Conversions fire immediately (default)

The kit's default is to fire `primary_conversion` directly from your
form-success handler with a stable `event_id`. The platforms dedupe
browser vs. server using that id (Meta CAPI `event_id`, Google Ads
`orderId`).

This wasn't always the default. The kit used to ship with an
**upgrade window** — `conversion-state.ts` holds the primary completion
in `localStorage` and only fires `primary_conversion` once the user
either takes a higher-intent action (phone click / callback) or the
timer elapses. The pattern looks attractive: fewer, better signals to
Smart Bidding.

In a real production deployment, that pattern lost **~87% of quote
conversions** because most users do not return within the 25h catch-up
window. The "high-intent upgrade" funnel is the exception in
lead-gen, not the rule.

`conversion-state.ts` is preserved in the kit but **gated behind
`ENABLE_UPGRADE_WINDOW` in `config.ts` (default `false`)**:

- When `false` (default): every exported function in the module is a
  no-op. `global-listeners.ts` falls through to firing
  `phone_conversion` / `email_conversion` / `whatsapp_conversion`
  standalone. Your form-success handler should call
  `trackEvent('primary_conversion', { event_id, value, currency,
  service })` directly. See INVARIANT #3.
- When `true`: the original behavior. The first invocation per session
  emits a loud `console.warn` so the choice is visible. Only flip this
  on if you have measured (not assumed) that your funnel's in-window
  upgrade rate is high enough (≥80%) to justify the lost late-fires.

## Conversion → navigation

A plain

```ts
trackEvent('primary_conversion', { ... });
window.location.href = '/thanks';
```

silently drops the conversion on most browsers: GTM tags fire
asynchronously, and the browser tears down pending beacons on unload
before they go out. Use the kit's helper instead:

```ts
import { trackConversionAndNavigate } from '@/lib/tracking';

trackConversionAndNavigate(
  'primary_conversion',
  { event_id, value, currency, service },
  '/thanks',
);
```

It pushes the event, waits for GTM to settle (`gtag` `event_callback`
when available), then navigates — with a hard-timeout fallback so the
form still works if GTM is slow or blocked. The same trap exists with
`history.pushState`, programmatic `<form>.submit()`, `<a>.click()`,
and `router.push()`. See INVARIANT #19.

## PII handling

PII (email, phone, names, addresses) **never** enters `dataLayer` or
gets logged client-side. Flow:

1. Form-success handler calls `setUserDataOnDOM(normalizeUserData({...}))`.
2. The values land on `<div id="__tk_user_data__" hidden>` as
   `data-email`, `data-phone`, `data-firstName`, etc.
3. The same values are mirrored to `localStorage` ONLY if `ad_storage`
   consent is granted, with a `savedAt` timestamp. On every page-load
   `restoreUserDataFromStorage()` enforces the TTL (`USER_DATA_TTL_MS`,
   default 24h) — anything older is purged.
4. After a final conversion (late-fire or upgrade) `clearUserDataOnDOM()`
   wipes both the DOM element and the localStorage blob.
5. GTM Custom JavaScript variables read the dataset and feed the
   Google Ads "User-Provided Data" variable.
6. Google Ads tags hash the values inside the GTM tag (Google's
   client-side SDK handles SHA-256). They get sent only to Google.
7. Meta's path: `mirrorMetaCapi()` POSTs (`sendBeacon` if available)
   to `/api/meta/capi` with the raw values + the live consent snapshot.
   The server re-checks the consent snapshot, normalizes (email
   lowercase, phone E.164, postal code uppercase & spaces stripped,
   country lower), and SHA-256-hashes via `@noble/hashes` before
   sending to Meta CAPI. Without granted ads consent, the server
   refuses to forward.

Result: PII is in a single hidden DOM node, an opt-in localStorage blob
with a TTL, and on two outbound HTTPS requests (GTM→Google,
ours→Meta), with hashing in the latter. Not in `window.dataLayer`, not
in the page source, not in any GTM Variable that vendor scripts can
sniff, and not at rest beyond the TTL.

The browser-side Meta Pixel (loaded by GTM) gets only the `event_id` and
`value`/`currency`. CAPI carries the hashed PII. They share `event_id`
and Meta dedupes them.

## Server-side mirroring

| Event | Server fires | Why |
| --- | --- | --- |
| `primary_conversion_complete` | GA4 MP from your save endpoint | Engagement backstop. Browser dataLayer push can miss (adblock, tab close after submit). |
| `form_abandonment` | GA4 MP from `/api/track/abandonment` (sendBeacon) | Pagehide-time browser pushes don't reliably reach GTM on mobile. |
| `primary_conversion`, `callback_conversion`, `phone_conversion`, `email_conversion`, `whatsapp_conversion`, `primary_first_view` | Meta CAPI from `/api/meta/capi` | Browser Pixel quality is degraded by iOS/ATT and adblockers. CAPI gives the server-side signal Meta uses to model attribution. |

Both GA4 MP paths read the visitor's **real `_ga` / `_ga_<container>`
cookies** off the (same-origin) request via `readGa4IdsFromCookie()` and
pass `client_id` + `session_id` to `sendGA4MP()`. This is load-bearing: a
server-side MP hit with a synthetic `client_id` creates an unattributed
`(not set)/(not set)` session that GA4 can't dedup against the browser
event and that poisons Google Ads conversion imports. If there's no `_ga`
cookie (fresh visitor / analytics consent denied) the kit skips the MP
send rather than fabricate an id. See INVARIANT #17.

We do NOT mirror Google Ads conversions server-side. The client tag
already sees `gclid` cookies via Conversion Linker, which is what Ads
needs. Server-side Ads conversion uploads (offline conversion uploads
via the API) are a separate workflow — not implemented here.

## Consent

Load your CMP (CookieYes, Cookiebot, OneTrust, Klaro, etc.) as a **GTM
tag** firing on the built-in "Consent Initialization - All Pages" trigger.
That way GTM and the CMP load order is managed in one place and the
Consent Mode v2 default declared in `GTMHead` precedes everything.

Consent Mode v2 defaults (declared in `GTMHead` BEFORE GTM loads):

```
ad_storage:        denied
analytics_storage: denied
ad_user_data:      denied
ad_personalization: denied
functionality_storage: denied
personalization_storage: denied
security_storage:  granted
wait_for_update:   2000ms  # floor — raise to match your CMP's waitForTime
```

Tag-level consent settings to configure inside the GTM container:

- Google tags (GA4, Conversion Linker, Google Ads) → built-in consent
  handling. They will fire with reduced data when `analytics_storage` /
  `ad_storage` is denied (cookieless ping).
- Meta Pixel + custom HTML tags → require `ad_storage = granted`. Will
  not fire under denial.

## Stack assumptions

This kit assumes a **hard-navigation MPA** (Astro server, Next.js Pages
Router with full reloads, plain HTML+JS). For SPAs or View Transitions:

- `boot.ts` is currently imported as a side-effect module that runs
  once. In an SPA you'd want to call `initGlobalListeners()` once at
  app mount and re-run `restoreUserDataFromStorage()` on every route
  change.
- `global-listeners.ts` and `form-tracking.ts` install listeners
  without `AbortController` cleanup. In an SPA you'd add controllers
  and abort them on route change to avoid listener compounding.

The server-side hashing uses `@noble/hashes`. If you're on a runtime
that exposes WebCrypto's `crypto.subtle.digest` (modern browsers,
Node 18+, Cloudflare Workers, Deno) you can swap the three `hash*`
helpers in `server.ts` to SubtleCrypto and drop the dependency.

## Files in this kit

- `README.md` — this file. The big-picture overview.
- `INVARIANTS.md` — rules you must not violate. Read before touching the
  code.
- `SETUP.md` — step-by-step bring-up. Follow top to bottom for a new
  project.
- `EVENTS.md` — guidance on adapting the event taxonomy to your funnel.
- `CHECKLIST.md` — pre-merge / post-deploy / monitoring / migration
  checklist. Use on every tracking-touching PR.
- `MONITORING.md` — conversion-volume watchdog (Cloudflare Worker +
  GA4 Data API + Resend). Catches silent regressions within 24h.
- `scripts/check-event-contract.mjs` — CI script. Enforces code ↔
  EVENTS.md ↔ GTM container parity. Run via `npm run check:events`.
- `src/` — the actual code. Drop `src/lib/tracking/` into your repo as-is
  after editing `config.ts`.
- `src/watchdog/` — the conversion-volume watchdog Worker. Deploy
  separately from your app.
- `package.json` — minimal dependencies the kit needs.

## Hardening on the server endpoints

The `/api/meta/capi` and `/api/track/abandonment` mounts (Astro and
Next.js variants) enforce:

- **Origin allowlist, fail-closed.** Requests with no `Origin` header
  are rejected — that's the strongest signal of server-to-server /
  curl injection attempts. Edit `ALLOWED_ORIGINS` in each route file
  to your domains.
- **Per-IP rate limit, in-memory sliding window.** Defaults:
  `RATE_LIMIT_CAPI_MAX = 20` requests/min/IP, `RATE_LIMIT_ABANDONMENT_MAX
  = 60` requests/min/IP. Survives across requests in the same isolate;
  on Cloudflare Workers, that's "best effort". For stricter guarantees
  swap the helper for a KV/Durable-Object-backed limiter.
- **Strict input validation.** `event_id` regex, `event_name` enum,
  `currency` ISO-4217 regex, `value` capped at `MAX_CONVERSION_VALUE`,
  email regex, `fbp/fbc` cookie shape regex, length caps on every
  string field.
- **`event_source_url` pinned to allowed origins**, with the request's
  `Referer` as a fallback if the client-provided URL doesn't match.
- **`custom_data` whitelist** — only `value`/`currency`/`content_name`
  are forwarded to Meta. A tampered client cannot inject
  `predicted_ltv` or other Smart Bidding signals.
- **CAPI consent gate.** The client includes a Consent Mode v2
  snapshot; the server requires `ad_storage = granted` AND
  `ad_user_data = granted` before forwarding to Meta.
- **CORS preflight responder** so cross-origin `OPTIONS` requests get
  a proper 204 with `Access-Control-Allow-*` headers, only echoing
  allowed origins (never `*`).
- **Meta Graph API version pinned** in `config.ts`
  (`META_GRAPH_API_VERSION`). Bump in one place when Meta deprecates
  a version.

## Known limitations

- **`form_abandonment` is best-effort.** Mobile pagehide/visibilitychange
  fires inconsistently. Treat the numbers as directional, not exact.
- **Cross-domain upgrade.** `localStorage` is per-origin. If your primary
  funnel lives on `app.example.com` and the user clicks a phone number
  on `www.example.com`, the upgrade is not tracked by the window. To
  support cross-domain upgrade you need a server-side state store keyed
  by something stable (a 1st-party session cookie or a server-issued
  upgrade token).
- **CMP-modeled conversions** for users who reject ads consent require a
  Pro CMP plan in most cases. With a free CMP, denied-consent users are
  simply not counted.
- **Google Ads cross-tab over-count.** Late-fire conversions can
  duplicate across tabs when `BroadcastChannel` is unavailable. Acceptable
  for low/medium volume; if you're at scale, switch to a server-side
  trigger.
