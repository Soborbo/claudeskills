---
name: soborbo-tracking
description: >-
  Canonical lead-gen tracking for Astro.js on Cloudflare Workers (v6, Run 6
  contract). Drop-in components: <Tracking/>, <TrackedForm/>, <PhoneLink/>,
  <CallbackButton/>. Two channels with a SHARED event_id: browser (GTM → GA4 /
  Meta Pixel / Google Ads) + server-side via the Soborbo event-gateway worker.
  Model 2: the browser OWNS on-site GA4 + Google Ads; the server sends Meta CAPI
  on-site (+ TikTok/LinkedIn/Microsoft click-ID forwarders, event_id-deduped) and
  Google Ads ONLY offline (CRM lead lifecycle, Google Data Manager API); the
  server sends NO GA4. Two gateway ingress paths: tokenless browser path for
  low-risk clicks (Origin allow-list + rate limit), authenticated server path
  (per-site token, service binding) for form/lead/purchase conversions dispatched
  by the site BACKEND. No Turnstile. Daily synthetic smoke-lead cron + digest
  guard. Consent Mode v2 + CookieYes, gclid/gbraid/wbraid/fbclid + full UTM
  capture, calculator funnel, form abandonment, phone dedup, first/last touch
  attribution. Bilingual / multi-market (HU + UK) via PUBLIC_TRACKING_* config.
  Includes the server-side onboarding generator (server/generate-site.mjs) and
  backend dispatch reference (server/backend/). Use when a new Astro site needs
  GA4 + Meta + Google Ads tracking. No Zaraz, no Stape. To INSTALL end-to-end,
  follow INSTALL.md (the ordered agent runbook).
---

# Soborbo Tracking v6 — canonical (Run 6 contract)

The **canonical** tracking solution. (The old `tracking/`, `tracking-kit/`, and
the v5 Turnstile-gated browser dispatch are deprecated — this supersedes them.)

> **Installing? Start at [`INSTALL.md`](INSTALL.md)** — the single ordered runbook
> an agent follows top-to-bottom (intake gate → branch check → client → backend
> dispatch → server binding → OAuth → verification). The sections below are
> reference; `INSTALL.md` is the spine.

## Engine repository (read this too)

This skill is the **standard / client** half. The **engine** is a separate repo —
the event-gateway Cloudflare Worker — and the **single source of truth for the
event taxonomy** lives there:

| | repo | role |
|---|---|---|
| **engine** | `github.com/Soborbo/Serverside` | gateway worker; `src/events.json` is the canonical event source |
| **skill** | `github.com/Soborbo/claudeskills` → `soborbo-tracking/` | client components + backend dispatch + onboarding + GTM |

See [`repos.json`](repos.json). The canonical `events.json` is **vendored** into
this skill (`soborbo-tracking/events.json`, a copy of `Serverside/src/events.json`);
the generators (`server/generate-site.mjs`, `gtm/gen-container.mjs`) and
`lib/event-contract.ts` derive from it, and two machine checks guard drift:
`tests/event-contract.test.ts` (lib ↔ events.json) and
`server/check-event-contract.mjs --engine` (events.json ↔ engine). Any change to
gateway behaviour happens in the **engine** repo.

## Architecture — two channels, two ingress paths, ONE event_id

```
Browser (Astro components)                  Server
──────────────────────────────             ─────────────────────────────────
FORM SUBMIT (gated events):
trackLeadSubmit() ── dataLayer.push ─→ GTM ─→ GA4 / Meta Pixel / Google Ads
        │                                       (Consent Mode v2; browser OWNS
        └─ event_id hidden field ─→ form POST    on-site GA4 + Google Ads)
                                        │
                              SITE BACKEND (API route)
                                        ├─→ CRM  (response id = lead_id)
                                        └─→ POST /api/event/conversion-server
                                            X-Admin-Token + service binding
                                            SAME event_id → Meta CAPI dedup

LOW-RISK CLICKS (phone/email/whatsapp/video):
trackPhoneConversion() ─┬─ dataLayer.push ─→ GTM (as above)
                        └─ sendToWorker() ─→ POST /api/event/conversion
                                             (tokenless; Origin allow-list +
                                              rate limit) ─→ Meta CAPI

CRM webhook ─→ POST /api/event/lead-status (per-site token)
                 └─→ Google Ads offline via Data Manager API (EC for Leads)
                     (NO GA4 — on-site or offline; browser owns GA4)
```

- **The ingress split is the load-bearing rule.** High-value conversions
  (`server_ingress_only` in events.json: `quote_calculator_submitted`,
  `callback_request_submitted`, `contact_form_submitted`,
  `order_request_submitted`, `purchase`) get **403 (TRK-400-017)** on the browser
  path — a browser Origin is curl-spoofable, so the money events require the
  per-site token. The client lib refuses to send them (TRK-1005); the backend
  dispatch (`server/backend/gateway-dispatch.ts`) is the ONLY server leg.
- **Model 2 (the double-count fix).** GA4 has **no** event_id dedup, so on-site
  GA4 is **browser-only**; Google Ads on-site is browser-only too (AWCT + EC).
  The server does Google Ads **only offline** and **no GA4 at all** (the offline
  GA4 leg is disabled — without a real client_id every event would open a
  synthetic GA4 client). **Meta CAPI stays** server-side on-site (Pixel↔CAPI
  dedup on the shared `event_id`); the TikTok/LinkedIn/Microsoft click-ID
  forwarders ride the same dedup.
- **No Turnstile anywhere in tracking.** The old token gate validated against a
  test secret while silently swallowing real click conversions for two weeks.
  The browser path's control is the gateway's Origin allow-list + rate limit;
  the server path's control is the per-site token. Bot filtering for FORMS
  belongs in the site's form endpoint (honeypot/time-check with a `silent`
  flag that also skips tracking) — see `server/backend/README.md`.
- **Durability & honesty are engine-side but load-bearing:** three-state D1
  ledger (`accepted`/`skipped`/`rejected`; `accepted` NEVER without a vendor
  HTTP status — TRK-950-004), DLQ with guaranteed-persist check (TRK-900-007),
  daily digest + `SMOKE_SITES` synthetic-lead guard.

## Markets — bilingual HU + UK (and beyond)

The same skill serves Hungarian and UK sites by setting a few public env vars
(`lib/config.ts` → `trackingConfig`):

```
PUBLIC_TRACKING_COUNTRY   GB | HU            (default GB)   — phone + formatting
PUBLIC_TRACKING_CURRENCY  GBP | HUF | EUR…   (default GBP)  — default conversion currency
PUBLIC_TRACKING_LOCALE    en | hu            (default en)   — display strings
```

What this drives:
- **Currency**: the default conversion `currency` (override per call). HU site →
  `HUF`, UK site → `GBP`. The backend dispatch has NO currency default — pass it
  explicitly with any value.
- **Phone**: `normalizePhone` auto-detects unambiguous prefixes regardless of
  config (UK `07…` → `+447…`, HU `06…` → `+36…`) and uses the configured country
  for ambiguous/bare numbers. `<PhoneLink/>` formats both `+44` and `+36`.
- **Language**: the tracking itself is language-agnostic (snake_case event names).

The gateway (server) uses the per-site KV `country_code` / `currency`
independently — keep them in sync with the `PUBLIC_TRACKING_*` values.

## Consent Policy (Consent Mode v2 + CookieYes)

| Action | No consent | Analytics | Marketing |
|--------|:----------:|:---------:|:---------:|
| localStorage (gclid/UTM/click IDs) | ❌ | ❌ | ✅ |
| sessionStorage (session) | ❌ | ✅ | ✅ |
| Scroll / calculator / phone / callback / abandon (dataLayer) | ❌ | ✅ | ✅ |
| Lead/contact submit (dataLayer) | ❌ | ❌ | ✅ |
| Browser on-site GA4 / Meta Pixel / Google Ads (AWCT) | ❌ | GA4: ✅ · Ads/Pixel: ❌ | ✅ |
| Browser-path gateway POST (clicks → Meta CAPI + forwarders) | ❌ | ❌ | ✅ |
| Backend gateway dispatch (forms → Meta CAPI) | ❌ | ❌ | ✅ (CookieYes cookie read server-side) |
| Gateway OFFLINE (lead-status): Google Ads (Data Manager) | ❌ | ❌ | ✅ |

Every client function checks consent; the backend reads the SAME CookieYes cookie
(`readConsentFromCookie`) so the two legs cannot disagree; the gateway re-checks
server-side (`require_consent` for EEA) — defense in depth. Click-ID capture is
gated on ad consent, and consent is THREE-state (granted/denied/unknown — see
INVARIANTS #11).

## File structure

```
components/   Tracking.astro, TrackingNoscript.astro, TrackedForm.astro,
              PhoneLink.astro, CallbackButton.astro, RevealContact.astro
lib/          index.ts (entry), event-contract.ts (ingress split — test-guarded),
              config.ts (market), events.ts (dataLayer/GTM), persistence.ts
              (attribution/normalization), consent.ts (CookieYes), gateway.ts
              (browser-path dispatch), observability.ts (diagnostic codes), uuid.ts
events.json   vendored canonical event source (copy of Serverside/src/events.json)
server/       generate-site.mjs (onboarding generator, HARD test-code gate),
              site-config.schema.json, SETUP-SERVER.md, check-event-contract.mjs,
              smoke-test.sh (gate checks), site-inputs/
server/backend/  gateway-dispatch.ts + smoke.ts + worker.ts + README.md —
              the SITE BACKEND's server leg (verbatim from the live sites)
examples/     ready-to-copy wiring (Layout + form + .env + route)
gtm/          container.json (importable GTM container) + gen-container.mjs + README
docs/         CANONICAL-EVENTS, MIGRATION-existing-sites, gtm-setup,
              cloudflare-setup, testing, INVARIANTS, CHECKLIST, EVENTS, MONITORING,
              OBSERVABILITY-CODES
monitoring/   watchdog.ts (optional conversion-volume alerting worker)
tests/        client tests (vitest + jsdom) incl. the ingress-contract drift guards.
              Server tests live in Soborbo/Serverside.
tsconfig.json + env.d.ts (npm run typecheck)
```

## Usage

```astro
<TrackedForm action="/api/lead" eventType="lead" contentName="Calculator">
  <input name="email" type="email" required />
  <input name="phone" type="tel" />
  <button type="submit">Get a quote</button>
</TrackedForm>
```
On submit: dataLayer push (GTM) + the `event_id` hidden field travels with the
POST. The API route at `/api/lead` dispatches the gateway conversion with that
SAME event_id (see `server/backend/README.md`) — that is the server leg.

```ts
import { trackLeadSubmit, trackServerEvent, trackPhoneConversion } from '@/lib';
trackLeadSubmit({ email, phone, value });   // dataLayer leg + eventId for the backend
trackServerEvent('video_play');             // browser-path event (allow-listed)
trackPhoneConversion({ phone });            // click: dataLayer + browser-path gateway
```

Calculator: `trackCalculatorStart/Step/Option/Complete`. Debug: `?debugTracking=1`.

## Gateway event names (the ingress split)

**Browser path** (`/api/event/conversion`, tokenless): `phone_number_clicked`,
`email_address_clicked`, `whatsapp_button_clicked`, `begin_checkout`, `video_play`.

**Server path only** (`/api/event/conversion-server`, per-site token — browser
path answers 403/TRK-400-017): `quote_calculator_submitted`,
`callback_request_submitted`, `contact_form_submitted`, `order_request_submitted`,
`purchase`.

**Offline** (CRM → `/api/event/lead-status`): `lead_validated`, `lead_qualified`,
`quote_sent`, `booking_confirmed`, `job_completed`, `revenue_confirmed`,
`lead_disqualified`.

The gateway also accepts legacy GA4 names (`quote_calculator_conversion`,
`callback_conversion`, `contact_form_submit`, `phone_conversion`,
`email_conversion`, `whatsapp_conversion`, `booking_click`) and **normalizes them
to canonical at ingress** — which is also why `gads.conversion_actions` keys must
be canonical. The source of truth is `events.json` (vendored from the engine);
`lib/event-contract.ts` mirrors the split and the tests enforce the mirror.

## Invariants kept (still apply)

- **fbc coverage**: `getFbc()` prefers the `_fbc` cookie, else reconstructs
  `fb.1.<fbclidAt>.<fbclid>` (first-capture timestamp, no drift). The gateway
  also builds fbc from fbclid when the client sends none.
- **value is event-type aware**: real value for Lead/ViewContent; omitted for
  Contact. Neither leg ever sends `value: 0`.
- **One canonical normalizer** (email lowercase/trim; phone UK 07→+44, HU 06→+36;
  name trim). The gateway re-normalizes + hashes server-side using `country_code`.
  Note: the **offline Google** leg hashes email with Google's rule (Gmail dot/plus
  strip) — distinct from the Meta rule; both live in the engine.
- **lead_id is the CRM's id or absent** — never a site-minted fallback.
- Full doctrine: `docs/INVARIANTS.md`, `docs/CHECKLIST.md`.

## Server side (gateway) — summary

Server logic is the **`Soborbo/Serverside` event-gateway worker**. This skill
does not duplicate it — `server/SETUP-SERVER.md` + `generate-site.mjs` bind a
site (KV config + route + per-site token + Google Ads OAuth with the
`datamanager` scope), and `server/backend/` is the site-side dispatch. Gateway
tests live there. Engine error-code runbook: `Serverside/docs/error-codes.md`
(TRK-400-017 browser-gate, TRK-900-007 retry-persist, TRK-950-004 ledger honesty).

## Env vars

**Client (Astro site worker):** `PUBLIC_TRACKING_COUNTRY`,
`PUBLIC_TRACKING_CURRENCY`, `PUBLIC_TRACKING_LOCALE`.
**Site worker (backend dispatch + smoke):** `TRACKING_GATEWAY_TOKEN` *(secret)*,
`SITE_URL`, `TRACKING_TEST_LEAD_EMAIL`, `TRACKING_TEST_EVENT_CODE`.
(Meta/Ads secrets do NOT go here — they live in the gateway KV.)
**Gateway (separate worker):** see `Soborbo/Serverside` — GADS_* (OAuth with
`datamanager` scope), ADMIN_API_TOKEN, the per-site config KV, `SMOKE_SITES`,
and `DATAMANAGER_VALIDATE_ONLY` for dry-run.

## Tests

Client tests (`npm test`, vitest + jsdom): normalizers (UK + HU phone),
attribution, consent gating, event-name contract, the INGRESS SPLIT (gated events
never reach the browser path; callback dataLayer-only; TRK-1005/1006 diagnostics),
shared event_id on click conversions, gateway payload (no turnstile_token),
no-PII-in-dataLayer + EC side-channel, GTM container export, market config,
`tests/event-contract.test.ts` drift guards. Also `npm run typecheck` and
`node server/check-event-contract.mjs [--engine <Serverside>/src/events.json]`.
Server-side tests live in Soborbo/Serverside.

## Reference docs

`docs/CANONICAL-EVENTS.md`, `docs/MIGRATION-existing-sites.md`,
`docs/gtm-setup.md`, `docs/cloudflare-setup.md`, `docs/testing.md`,
`docs/INVARIANTS.md`, `docs/CHECKLIST.md`, `docs/EVENTS.md`, `docs/MONITORING.md`,
`server/SETUP-SERVER.md`, `server/backend/README.md`, `examples/`.

> Note: some reference docs and inline comments are partly in Hungarian;
> functionality is fully bilingual (HU + UK). Translate as needed.
