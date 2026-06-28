---
name: soborbo-tracking
description: >-
  Canonical lead-gen tracking for Astro.js on Cloudflare Workers (v5). Drop-in
  components: <Tracking/>, <TrackedForm/>, <PhoneLink/>, <CallbackButton/>,
  <Turnstile/>. Two channels with a SHARED event_id: browser (GTM → GA4 / Meta
  Pixel / Google Ads) + server-side via the Soborbo event-gateway worker. Model 2:
  the browser OWNS on-site GA4 + Google Ads; the server sends Meta CAPI on-site
  (+ TikTok/LinkedIn/Microsoft click-ID forwarders, event_id-deduped), and GA4 +
  Google Ads ONLY offline (CRM lead lifecycle) via the Google Data Manager API.
  Cloudflare Queues retry, consent gating, universal attribution. Consent Mode
  v2 + CookieYes, gclid/gbraid/wbraid/fbclid + full UTM capture, calculator
  funnel, form abandonment, phone dedup, first/last touch attribution.
  Bilingual / multi-market: works for HU and UK sites (HUF/GBP, HU/UK phone
  numbers, en/hu) via PUBLIC_TRACKING_* config. Includes a server-side onboarding
  generator (server/generate-site.mjs). Use when a new Astro site needs GA4 +
  Meta + Google Ads tracking. No Zaraz, no Stape. To INSTALL end-to-end, follow
  INSTALL.md (the ordered agent runbook) — it sequences every step below.
---

# Soborbo Tracking v5 — canonical

The **canonical** tracking solution. (The old `tracking/` and `tracking-kit/`
are deprecated and removed — this supersedes them.)

> **Installing? Start at [`INSTALL.md`](INSTALL.md)** — the single ordered runbook
> an agent follows top-to-bottom (intake gate → client → server binding → OAuth →
> verification). The sections below are reference; `INSTALL.md` is the spine.

## Engine repository (read this too)

This skill is the **standard / client** half. The **engine** is a separate repo —
the event-gateway Cloudflare Worker — and the **single source of truth for the
event taxonomy** lives there:

| | repo | role |
|---|---|---|
| **engine** | `github.com/Soborbo/Serverside` | gateway worker; `src/events.json` is the canonical event source |
| **skill** | `github.com/Soborbo/claudeskills` → `soborbo-tracking/` | client components + onboarding + GTM |

See [`repos.json`](repos.json). The canonical `events.json` is **vendored** into
this skill (`soborbo-tracking/events.json`, a copy of `Serverside/src/events.json`);
the generators (`server/generate-site.mjs`, `gtm/gen-container.mjs`,
`docs/CANONICAL-EVENTS.md`) read it, and `server/check-event-contract.mjs` guards
against drift. Any change to gateway behaviour happens in the **engine** repo.

## Architecture — two channels, SHARED event_id (Model 2)

```
Browser (Astro components)                  Server (event-gateway worker)
──────────────────────────────             ─────────────────────────────────
trackLeadSubmit() ─┬─ dataLayer.push ─→ GTM ─→ GA4 / Meta Pixel / Google Ads
                   │                            (Consent Mode v2)
                   │                            Browser OWNS on-site GA4 + Google Ads (AWCT + EC)
                   └─ sendToWorker() ─→ POST /api/event/conversion
                                          (same-origin route → event-gateway worker)
                                            └─→ Meta CAPI  (+ TikTok / LinkedIn / Microsoft
                                                click-ID forwarders) — event_id dedup w/ Pixel
                                                NO on-site GA4, NO on-site Google Ads

CRM webhook ─→ POST /api/event/lead-status (admin) ─→ Google Ads via Data Manager API
                                                      + GA4 MP (offline augment)
                                                      (Enhanced Conversions for Leads)
```

- **Model 2 (the double-count fix).** GA4 has **no** event_id dedup, so on-site GA4
  is **browser-only**. Google Ads on-site is **browser-only** too (AWCT + Enhanced
  Conversions — already configured client-side); the server does Google Ads **only
  offline**. This kills the GA4/Ads on-site double-count and the fragile
  conversion-action matching. **Meta CAPI stays** server-side on-site (Pixel↔CAPI
  dedup on the shared `event_id`); the TikTok/LinkedIn/Microsoft click-ID
  forwarders stay too (same event_id dedup model, money-signal click IDs).
- **Server offline leg.** The CRM posts lead-lifecycle statuses to
  `/api/event/lead-status`; the server uploads **Enhanced Conversions for Leads to
  Google Ads via the Data Manager API** (the legacy `uploadClickConversions` is
  closed to new adopters from 2026-06-15 — no developer token, OAuth `datamanager`
  scope) and sends **offline GA4 MP** as analytics augment (same deterministic
  `orderId`).
- The browser side runs through the `dataLayer` (GTM). The Pixel `eventID` and the
  server `event_id` are the SAME → Meta Pixel↔CAPI dedup.
- The `/api/event/*` route is served on the site's OWN domain by the gateway worker
  (same-origin, no CORS). `server/` onboarding sets this up.

## Markets — bilingual HU + UK (and beyond)

The same skill serves Hungarian and UK sites by setting a few public env vars
(`lib/config.ts` → `trackingConfig`):

```
PUBLIC_TRACKING_COUNTRY   GB | HU            (default GB)   — phone + formatting
PUBLIC_TRACKING_CURRENCY  GBP | HUF | EUR…   (default GBP)  — default conversion currency
PUBLIC_TRACKING_LOCALE    en | hu            (default en)   — display strings
```

What this drives:
- **Currency**: the default conversion `currency` (override per call with
  `trackConversion(..., { currency })`). HU site → `HUF`, UK site → `GBP`.
- **Phone**: `normalizePhone` auto-detects unambiguous prefixes regardless of
  config (UK `07…` → `+447…`, HU `06…` → `+36…`) and uses the configured country
  for ambiguous/bare numbers. `<PhoneLink/>` formats both `+44` and `+36`.
- **Language**: the tracking itself is language-agnostic (snake_case event names;
  GA4 ignores page language). `locale` is for any display strings you add.

The gateway (server) uses the per-site KV `country_code` / `currency`
independently — keep them in sync with the `PUBLIC_TRACKING_*` values. The
`server/generate-site.mjs` generator validates the country/currency per site.

## Consent Policy (Consent Mode v2 + CookieYes)

| Action | No consent | Analytics | Marketing |
|--------|:----------:|:---------:|:---------:|
| localStorage (gclid/UTM/click IDs) | ❌ | ❌ | ✅ |
| sessionStorage (session) | ❌ | ✅ | ✅ |
| Scroll / calculator / phone / callback / abandon | ❌ | ✅ | ✅ |
| Lead/contact submit | ❌ | ❌ | ✅ |
| Browser on-site GA4 / Meta Pixel / Google Ads (AWCT) | ❌ | GA4: ✅ · Ads/Pixel: ❌ | ✅ |
| Gateway on-site POST (Meta CAPI + TikTok/LinkedIn/MsAds) | ❌ | ❌ | ✅ |
| Gateway OFFLINE (lead-status): Google Ads (Data Manager) | ❌ | ❌ | ✅ |
| Gateway OFFLINE GA4 MP (CRM augment) | ❌ | ✅ (analytics) | ✅ |

On-site GA4 comes from the **browser only** (the gateway sends **no** on-site GA4 —
that would double-count). Every client function checks consent; the gateway
re-checks server-side (`require_consent` for EEA) — defense in depth. Click-ID
capture is gated on ad consent.

## File structure (copy into the site `src/`)

```
components/   Tracking.astro, TrackingNoscript.astro, TrackedForm.astro,
              PhoneLink.astro, CallbackButton.astro, Turnstile.astro
lib/          index.ts (entry), config.ts (market), events.ts (dataLayer/GTM),
              persistence.ts (attribution/normalization), consent.ts (CookieYes),
              gateway.ts (Turnstile + universal gateway dispatch),
              observability.ts (diagnostic codes), uuid.ts
events.json   vendored canonical event source (copy of Serverside/src/events.json)
server/       generate-site.mjs (onboarding generator), site-config.schema.json,
              SETUP-SERVER.md, check-event-contract.mjs
examples/     ready-to-copy wiring (Layout + form + .env + route)
gtm/          container.json (importable GTM container) + gen-container.mjs + README
docs/         CANONICAL-EVENTS, MIGRATION-existing-sites, gtm-setup,
              cloudflare-setup, testing, INVARIANTS, CHECKLIST, EVENTS, MONITORING,
              OBSERVABILITY-CODES, SERVERSIDE-FOLLOWUP
monitoring/   watchdog.ts (optional conversion-volume alerting worker)
tests/        client tests (vitest + jsdom). Server tests live in Soborbo/Serverside.
tsconfig.json + env.d.ts (npm run typecheck)
```

## Quick setup (client)

1. Copy `components/` + `lib/` into the site `src/` as siblings
   (`src/components/` + `src/lib/`) — components import the lib via `../lib`,
   so no path alias is needed (see `examples/`).
2. Layout:
   ```astro
   <head><Tracking gtmId="GTM-XXX" cookieYesId="abc123" /></head>
   <body>
     <TrackingNoscript gtmId="GTM-XXX" />
     <Turnstile />   {/* required for the gateway's turnstile_token */}
   ```
3. Astro env: `PUBLIC_TURNSTILE_SITE_KEY` + the market vars
   (`PUBLIC_TRACKING_COUNTRY` / `_CURRENCY` / `_LOCALE`).
4. `output: 'server'` in astro.config; enable **Google Tag Gateway** (first-party
   GA4 measurement — the GTM container ships the Google tag, `googtag`).
5. GTM: `docs/gtm-setup.md` (GA4 event names per `docs/CANONICAL-EVENTS.md`).
6. **Server binding**: `server/SETUP-SERVER.md` (gateway route + KV config per
   domain, generated by `generate-site.mjs`, validated against
   `server/site-config.schema.json`). Meta/GA4/Ads secrets go to the **gateway KV**,
   not the site worker.

## Usage

```astro
<TrackedForm action="/api/lead" eventType="lead" contentName="Calculator">
  <input name="email" type="email" required />
  <input name="phone" type="tel" />
  <button type="submit">Get a quote</button>
</TrackedForm>
```
On submit: dataLayer push (GTM) + gateway POST with the SAME event_id. The gateway
hashes, adds attribution/consent/Turnstile, fans out Meta CAPI (+ forwarders).

```ts
// The shipped components import the library via a relative path (`../lib`) — no alias
// needed when components/ + lib/ are siblings under src/. In YOUR OWN code import from
// wherever you copied lib/ (e.g. '@/lib' if you have the @→src alias, or a relative path).
import { trackLeadSubmit, trackServerEvent } from '@/lib';
trackLeadSubmit({ email, phone, value });            // currency defaults to PUBLIC_TRACKING_CURRENCY
trackLeadSubmit({ email, value, currency: 'GBP' });  // per-call override
trackServerEvent('quote_calculator_submitted', { value, currency, email, phone });
```

Calculator: `trackCalculatorStart/Step/Option/Complete`. Debug: `?debugTracking=1`.

## Gateway event names (canonical, on-site allowlist)
`quote_calculator_submitted`, `callback_request_submitted`, `contact_form_submitted`,
`phone_number_clicked`, `email_address_clicked`, `whatsapp_button_clicked`,
`quote_calculator_opened` (ViewContent), `video_play`. The gateway also accepts the
legacy GA4 names (`quote_calculator_conversion`, `callback_conversion`,
`contact_form_submit`, `phone_conversion`, `email_conversion`, `whatsapp_conversion`,
`booking_click`) and **normalizes them to canonical at ingress** (migration-safe).
Offline (CRM, `/api/event/lead-status`) events: `lead_qualified`, `booking_confirmed`,
`revenue_confirmed`, … The source of truth is `events.json` (vendored from the engine).

## Invariants kept (still apply)
- **fbc coverage**: `getFbc()` prefers the `_fbc` cookie, else reconstructs
  `fb.1.<fbclidAt>.<fbclid>` (first-capture timestamp, no drift). The gateway
  also builds fbc from fbclid when the client sends none.
- **value is event-type aware**: real value for Lead/ViewContent; omitted for
  Contact (don't poison Smart Bidding). The gateway never sends `value: 0`.
- **One canonical normalizer** (email lowercase/trim; phone UK 07→+44, HU 06→+36;
  name trim). The gateway re-normalizes + hashes server-side using `country_code`.
  Note: the **offline Google** leg hashes email with Google's rule (Gmail dot/plus
  strip) — distinct from the Meta rule; both live in the engine.
- Full doctrine: `docs/INVARIANTS.md`, `docs/CHECKLIST.md`.

## Server side (gateway) — summary
Server logic is the **`Soborbo/Serverside` event-gateway worker**. This skill
does not duplicate it — `server/SETUP-SERVER.md` + `generate-site.mjs` bind a
site (KV config + route + Google Ads OAuth with the `datamanager` scope). Gateway
tests live there.

## Env vars
**Client (Astro site worker):** `PUBLIC_TURNSTILE_SITE_KEY`,
`PUBLIC_TRACKING_COUNTRY`, `PUBLIC_TRACKING_CURRENCY`, `PUBLIC_TRACKING_LOCALE`.
(Meta/GA4/Ads secrets do NOT go here — they live in the gateway KV.)
**Gateway (separate worker):** see `Soborbo/Serverside` — TURNSTILE_SECRET_KEY,
GADS_* (OAuth with `datamanager` scope), ADMIN_API_TOKEN, the per-site config KV,
and `DATAMANAGER_VALIDATE_ONLY` for dry-run.

## Tests
Client tests (`npm test`, vitest + jsdom): normalizers (UK + HU phone),
attribution, consent gating, event-name contract, shared event_id (incl. phone/
callback/email/whatsapp click conversions across both channels), gateway payload,
no-PII-in-dataLayer + Enhanced-Conversions side-channel, GTM container export,
Turnstile pre-warm, market config. Also `npm run typecheck` (tsc --noEmit) and
`node server/check-event-contract.mjs`. Server-side tests live in Soborbo/Serverside.

## Reference docs
`docs/CANONICAL-EVENTS.md`, `docs/MIGRATION-existing-sites.md`,
`docs/gtm-setup.md`, `docs/cloudflare-setup.md`, `docs/testing.md`,
`docs/INVARIANTS.md`, `docs/CHECKLIST.md`, `docs/EVENTS.md`,
`server/SETUP-SERVER.md`, `examples/`.

> Note: the reference docs under `docs/` and inline code comments are partly in
> Hungarian; functionality is fully bilingual (HU + UK). Translate as needed.
