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
| `primary_conversion`      | upgrade window elapses without upgrade (LATE conversion) | `value`, `currency`, `service`, `late_conversion: true` if past timer |
| `callback_conversion`     | callback form submitted | `value`, `currency`, `service`, `source` |
| `phone_conversion`        | tel: click OR programmatic phone dial after primary | `value`, `currency`, `service`, `source`, `tel_target` |
| `email_conversion`        | mailto: click | `source` |
| `whatsapp_conversion`     | click on `wa.me` / `whatsapp.com` link | `source` |
| `scroll_50`, `scroll_90`  | scroll depth thresholds, once per page-load | — |

PII is NEVER pushed to dataLayer. See "PII handling" in INVARIANTS.md.

## The upgrade window

The core insight: a primary conversion (form completion, free trial signup,
quote request) ≠ a real lead until the user takes a higher-intent action.
We don't fire `primary_conversion` immediately. Instead, on completion we
record state in `localStorage` and start a timer.

- If the user clicks `tel:`, `mailto:`, `wa.me`, or submits the callback
  form within the window → that action becomes the conversion with the
  same `event_id`. The state is marked `upgraded` and the timer cancelled.
  Google Ads and Meta dedup against `event_id` so it counts as one
  conversion, not two.
- If the timer elapses without an upgrade → `primary_conversion` fires
  automatically. If the user closed the tab and re-opened the site within
  `LATE_CATCHUP_MS` of the timeout, it fires on the next page-load with
  `late_conversion: true`.

Cross-tab: a `BroadcastChannel` notifies other tabs when an upgrade
happens, so they cancel their pending timers. If `BroadcastChannel` isn't
available, multiple tabs may fire the late conversion — Meta's `event_id`
dedup catches it for Pixel/CAPI; Google Ads does NOT dedup on `orderId`
for Search/Display by default, so accept this as a known minor over-count
edge case.

**When to use the upgrade window**: lead-gen funnels where the primary
form completion is followed by a higher-intent action you can observe
(phone click, callback, chat). For pure e-commerce checkout (where the
purchase IS the conversion) skip this module entirely — fire
`purchase` directly from your post-checkout page.

## PII handling

PII (email, phone, names, addresses) **never** enters `dataLayer` or
gets logged client-side. Flow:

1. Form-success handler calls `setUserDataOnDOM(normalizeUserData({...}))`.
2. The values land on `<div id="__tk_user_data__" hidden>` as
   `data-email`, `data-phone`, `data-firstName`, etc.
3. GTM Custom JavaScript variables read the dataset and feed the
   Google Ads "User-Provided Data" variable.
4. Google Ads tags hash the values inside the GTM tag (Google's
   client-side SDK handles SHA-256). They get sent only to Google.
5. Meta's path: `mirrorMetaCapi()` POSTs (`sendBeacon` if available)
   to `/api/meta/capi` with the raw values. The server normalizes
   (email lowercase, phone E.164, postal code uppercase & spaces
   stripped, country lower) and SHA-256-hashes them via `@noble/hashes`
   before sending to Meta CAPI.

Result: PII is in a single hidden DOM node and on two outbound HTTPS
requests (GTM→Google, ours→Meta), with hashing in the latter. Not in
`window.dataLayer`, not in the page source, not in any GTM Variable that
vendor scripts can sniff.

The browser-side Meta Pixel (loaded by GTM) gets only the `event_id` and
`value`/`currency`. CAPI carries the hashed PII. They share `event_id`
and Meta dedupes them.

## Server-side mirroring

| Event | Server fires | Why |
| --- | --- | --- |
| `primary_conversion_complete` | GA4 MP from your save endpoint | Engagement backstop. Browser dataLayer push can miss (adblock, tab close after submit). |
| `form_abandonment` | GA4 MP from `/api/track/abandonment` (sendBeacon) | Pagehide-time browser pushes don't reliably reach GTM on mobile. |
| `primary_conversion`, `callback_conversion`, `phone_conversion`, `email_conversion`, `whatsapp_conversion`, `primary_first_view` | Meta CAPI from `/api/meta/capi` | Browser Pixel quality is degraded by iOS/ATT and adblockers. CAPI gives the server-side signal Meta uses to model attribution. |

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
wait_for_update:   500ms
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
- `src/` — the actual code. Drop `src/lib/tracking/` into your repo as-is
  after editing `config.ts`.
- `package.json` — minimal dependencies the kit needs.

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
