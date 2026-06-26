---
name: soborbo-tracking
description: >-
  Canonical lead-gen tracking for Astro.js on Cloudflare Workers (v5). Drop-in
  components: <Tracking/>, <TrackedForm/>, <PhoneLink/>, <CallbackButton/>,
  <Turnstile/>. Two channels with a SHARED event_id: browser (GTM → GA4 / Meta
  Pixel / Google Ads) + server-side via the Soborbo event-gateway worker
  (Meta CAPI + GA4 Measurement Protocol + Google Ads uploadClickConversions,
  Cloudflare Queues retry, consent gating, universal attribution). Consent Mode
  v2 + CookieYes, gclid/gbraid/wbraid/fbclid + full UTM capture, calculator
  funnel, form abandonment, phone dedup, first/last touch attribution.
  Bilingual / multi-market: works for HU and UK sites (HUF/GBP, HU/UK phone
  numbers, en/hu) via PUBLIC_TRACKING_* config. Includes a server-side onboarding
  generator (server/generate-site.mjs). Use when a new Astro site needs GA4 +
  Meta + Google Ads tracking. No Zaraz, no Stape.
---

# Soborbo Tracking v5 — canonical

The **canonical** tracking solution. (The old `tracking/` and `tracking-kit/`
are deprecated — this supersedes them.)

## Architecture — two channels, SHARED event_id

```
Browser (Astro components)                  Server
──────────────────────────────             ─────────────────────────────────
trackLeadSubmit() ─┬─ dataLayer.push ─→ GTM ─→ GA4 / Meta Pixel / Google Ads
                   │                                    (Consent Mode v2)
                   └─ sendToWorker() ─→ POST /api/event/conversion
                                          (same-origin route → event-gateway worker)
                                            └─→ Meta CAPI + GA4 MP + Google Ads
                                                uploadClickConversions
                                                (Queues retry, consent, attribution)
```

- The **browser side** still runs through the `dataLayer` (GTM). The Pixel
  `eventID` and the server `event_id` are the SAME → Meta Pixel↔CAPI dedup.
- The **server side** is now the **event-gateway worker** (repo
  `Soborbo/Serverside`), not an in-app `/api/track`. All three platforms run
  server-side (the old one was Meta-only), with durability (Cloudflare Queues),
  central consent, and universal attribution (gclid/gbraid/wbraid/fbclid + UTM).
- The `/api/event/*` route is served on the site's OWN domain by the gateway
  worker (same-origin, no CORS). The `server/` onboarding sets this up.

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
| Gateway POST (Meta CAPI + Google Ads) | ❌ | ❌ | ✅ |
| Gateway GA4 MP | ❌ | ✅ (with consent signals) | ✅ |

Every client function checks consent; the gateway re-checks server-side
(`require_consent` for EEA) — defense in depth. Click-ID capture is gated on ad consent.

## File structure (copy into the site `src/`)

```
components/   Tracking.astro, TrackingNoscript.astro, TrackedForm.astro,
              PhoneLink.astro, CallbackButton.astro, Turnstile.astro
lib/          index.ts (entry), config.ts (market), events.ts (dataLayer/GTM),
              persistence.ts (attribution/normalization), consent.ts (CookieYes),
              gateway.ts (Turnstile + universal gateway dispatch), uuid.ts
server/       generate-site.mjs (onboarding generator), SETUP-SERVER.md,
              check-event-contract.mjs
examples/     ready-to-copy wiring (Layout + form + .env + route)
gtm/          container.json (importable GTM container) + gen-container.mjs + README
docs/         CANONICAL-EVENTS, MIGRATION-existing-sites, gtm-setup,
              cloudflare-setup, testing, INVARIANTS, CHECKLIST, EVENTS, MONITORING,
              SERVERSIDE-FOLLOWUP
monitoring/   watchdog.ts (optional conversion-volume alerting worker)
tests/        71 client tests (vitest + jsdom). Server tests live in Soborbo/Serverside.
tsconfig.json + env.d.ts (npm run typecheck)
```

## Quick setup (client)

1. Copy `components/` + `lib/` into the site `src/` (see `examples/`).
2. Layout:
   ```astro
   <head><Tracking gtmId="GTM-XXX" cookieYesId="abc123" /></head>
   <body>
     <TrackingNoscript gtmId="GTM-XXX" />
     <Turnstile />   {/* required for the gateway's turnstile_token */}
   ```
3. Astro env: `PUBLIC_TURNSTILE_SITE_KEY` + the market vars
   (`PUBLIC_TRACKING_COUNTRY` / `_CURRENCY` / `_LOCALE`).
4. `output: 'server'` in astro.config; enable Google Tag Gateway.
5. GTM: `docs/gtm-setup.md` (GA4 event names per `docs/CANONICAL-EVENTS.md`).
6. **Server binding**: `server/SETUP-SERVER.md` (gateway route + KV config per
   domain, generated by `generate-site.mjs`). Meta/GA4/Ads secrets go to the
   **gateway KV**, not the site worker.

## Usage

```astro
<TrackedForm action="/api/lead" eventType="lead" contentName="Calculator">
  <input name="email" type="email" required />
  <input name="phone" type="tel" />
  <button type="submit">Get a quote</button>
</TrackedForm>
```
On submit: dataLayer push (GTM) + gateway POST (`contact_form_submit`) with the
SAME event_id. The gateway hashes, adds attribution/consent/Turnstile.

```ts
import { trackLeadSubmit, trackServerEvent } from '@/lib/tracking';
trackLeadSubmit({ email, phone, value });            // currency defaults to PUBLIC_TRACKING_CURRENCY
trackLeadSubmit({ email, value, currency: 'GBP' });  // per-call override
trackServerEvent('quote_calculator_conversion', { value, currency, email, phone });
```

Calculator: `trackCalculatorStart/Step/Option/Complete`. Debug: `?debugTracking=1`.

## Gateway event names (allowed)
`quote_calculator_conversion`, `callback_conversion`, `contact_form_submit`,
`phone_conversion`, `email_conversion`, `whatsapp_conversion`,
`quote_calculator_first_view`, `video_play`. (Add new ones in the gateway's
ALLOWED_EVENT_NAMES + EVENT_NAME_MAP in the Serverside repo.)

## Invariants kept (still apply)
- **fbc coverage**: `getFbc()` prefers the `_fbc` cookie, else reconstructs
  `fb.1.<fbclidAt>.<fbclid>` (first-capture timestamp, no drift). The gateway
  also builds fbc from fbclid when the client sends none.
- **value is event-type aware**: real value for Lead/ViewContent; omitted for
  Contact (don't poison Smart Bidding). The gateway never sends `value: 0`.
- **One canonical normalizer** (email lowercase/trim; phone UK 07→+44, HU 06→+36;
  name trim). The gateway re-normalizes + hashes server-side using `country_code`.
- Full doctrine: `docs/INVARIANTS.md`, `docs/CHECKLIST.md`.

## Server side (gateway) — summary
Server logic is the **`Soborbo/Serverside` event-gateway worker**. This skill
does not duplicate it — `server/SETUP-SERVER.md` + `generate-site.mjs` bind a
site (KV config + route + Google Ads OAuth). Gateway tests (156) live there.

## Env vars
**Client (Astro site worker):** `PUBLIC_TURNSTILE_SITE_KEY`,
`PUBLIC_TRACKING_COUNTRY`, `PUBLIC_TRACKING_CURRENCY`, `PUBLIC_TRACKING_LOCALE`.
(Meta/GA4/Ads secrets do NOT go here — they live in the gateway KV.)
**Gateway (separate worker):** see `Soborbo/Serverside` — TURNSTILE_SECRET_KEY,
GADS_*, ADMIN_API_TOKEN, and the per-site config KV.

## Tests
71 client tests (`npm test`, vitest + jsdom): normalizers (UK + HU phone),
attribution, consent gating, event-name contract, shared event_id (incl. phone/
callback/email/whatsapp click conversions across both channels), gateway payload,
no-PII-in-dataLayer + Enhanced-Conversions side-channel, GTM container export,
Turnstile pre-warm, market config. Also `npm run typecheck` (tsc --noEmit).
Server-side: 156 tests in Soborbo/Serverside.

## Reference docs
`docs/CANONICAL-EVENTS.md`, `docs/MIGRATION-existing-sites.md`,
`docs/gtm-setup.md`, `docs/cloudflare-setup.md`, `docs/testing.md`,
`docs/INVARIANTS.md`, `docs/CHECKLIST.md`, `docs/EVENTS.md`,
`server/SETUP-SERVER.md`, `examples/`.

> Note: the reference docs under `docs/` and inline code comments are partly in
> Hungarian; functionality is fully bilingual (HU + UK). Translate as needed.
