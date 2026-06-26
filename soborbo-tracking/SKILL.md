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
  funnel, form abandonment, phone dedup, first/last touch attribution. Includes
  a server-side onboarding generator (server/generate-site.mjs). Use when a new
  Astro site needs GA4 + Meta + Google Ads tracking. No Zaraz, no Stape.
---

# Soborbo Tracking v5 — kanonikus

Ez a **kanonikus** tracking-megoldás. (A korábbi `tracking/` és `tracking-kit/`
deprecated — ez váltja ki őket.)

## Architektúra — két csatorna, MEGOSZTOTT event_id

```
Böngésző (Astro komponensek)                Szerver
──────────────────────────────             ─────────────────────────────────
trackLeadSubmit() ─┬─ dataLayer.push ─→ GTM ─→ GA4 / Meta Pixel / Google Ads
                   │                                    (Consent Mode v2)
                   └─ sendToWorker() ─→ POST /api/event/conversion
                                          (same-origin route → event-gateway worker)
                                            └─→ Meta CAPI + GA4 MP + Google Ads
                                                uploadClickConversions
                                                (Queues retry, consent, attribúció)
```

- A **böngésző-oldal** (GTM) változatlanul a `dataLayer`-en megy — a Pixel `eventID`
  és a szerver `event_id` UGYANAZ → Meta Pixel↔CAPI dedup.
- A **szerver-oldal** mostantól az **event-gateway worker** (repo `Soborbo/Serverside`),
  NEM egy in-app `/api/track`. Így egyből mind a 3 platform szerver-oldalon van
  (a régi csak Meta volt), durabilityvel (Cloudflare Queues), központi consenttel
  és univerzális attribúcióval (gclid/gbraid/wbraid/fbclid + UTM).
- A `/api/event/*` route a site SAJÁT domainjén a gateway workerre megy
  (same-origin, nincs CORS gond) — ezt a `server/`-ben lévő onboarding állítja be.

## Mikor használd
- Új Astro lead-gen oldal: GA4 + Meta + Google Ads kell.
- Kalkulátor/quiz funnel, phone/callback/contact tracking.

## Consent Policy (Consent Mode v2 + CookieYes)

| Művelet | Nincs consent | Analytics | Marketing |
|--------|:----------:|:---------:|:---------:|
| localStorage (gclid/UTM/click ID) | ❌ | ❌ | ✅ |
| sessionStorage (session) | ❌ | ✅ | ✅ |
| Scroll / kalkulátor / phone / callback / abandon | ❌ | ✅ | ✅ |
| Lead/contact submit | ❌ | ❌ | ✅ |
| Gateway POST (Meta CAPI + Google Ads) | ❌ | ❌ | ✅ |
| Gateway GA4 MP | ❌ | ✅ (consent-jelekkel) | ✅ |

A kliens kódban minden függvény ellenőrzi a consentet; a gateway szerver-oldalon
ÚJRA ellenőrzi (`require_consent` EEA-n) — defense-in-depth. A click ID-k
gyűjtése/küldése ad-consenthez kötött.

## Fájlszerkezet (másold a site `src/`-jébe)

```
components/   Tracking.astro, TrackingNoscript.astro, TrackedForm.astro,
              PhoneLink.astro, CallbackButton.astro, Turnstile.astro
lib/          index.ts (belépő), events.ts (dataLayer/GTM), persistence.ts
              (attribúció/normalizálás), consent.ts (CookieYes),
              gateway.ts (Turnstile + univerzális gateway-dispatch), uuid.ts
server/       generate-site.mjs (bekötés-generátor), SETUP-SERVER.md,
              check-event-contract.mjs
examples/     kész, másolható wiring (Layout + form + .env + route)
docs/         gtm-setup, cloudflare-setup, testing, INVARIANTS, CHECKLIST,
              EVENTS, MONITORING (a tracking-kit doktrínájából átemelve)
monitoring/   watchdog.ts (opcionális konverzió-volumen riasztó worker)
```

## Quick Setup (kliens)

1. Másold a `components/` + `lib/` tartalmát a site `src/`-jébe (lásd `examples/`).
2. Layout:
   ```astro
   <head><Tracking gtmId="GTM-XXX" cookieYesId="abc123" /></head>
   <body>
     <TrackingNoscript gtmId="GTM-XXX" />
     <Turnstile />   {/* a gateway kötelező turnstile_token-jéhez */}
   ```
3. Astro env: `PUBLIC_TURNSTILE_SITE_KEY=0x4AAAA...`
4. `output: 'server'` az astro.config-ban; Google Tag Gateway bekapcsolva.
5. GTM beállítás: `docs/gtm-setup.md`.
6. **Szerver-bekötés**: `server/SETUP-SERVER.md` (a gateway route + KV-config az
   adott domainre — a `generate-site.mjs` generálja). A Meta/GA4/Ads secretek a
   **gateway KV-jébe** kerülnek, NEM a site workerébe.

## Használat

### Lead form
```astro
<TrackedForm action="/api/lead" eventType="lead" contentName="Calculator">
  <input name="email" type="email" required />
  <input name="phone" type="tel" />
  <button type="submit">Kérek ajánlatot</button>
</TrackedForm>
```
A submitkor: dataLayer push (GTM) + gateway POST (`contact_form_submit`), azonos
event_id-vel. A gateway hashel, attribúciót/consentet/Turnstile-t hozzárak.

### Közvetlen / fetch-submit
```ts
import { trackLeadSubmit, trackServerEvent } from '@/lib/tracking';
trackLeadSubmit({ email, phone, value, currency: 'HUF' });
// egyéb szerver-esemény (pl. quote): 
trackServerEvent('quote_calculator_conversion', { value, currency: 'HUF', email, phone });
```

### Kalkulátor / debug
`trackCalculatorStart/Step/Option/Complete` (dataLayer). Debug: `?debugTracking=1`.

## Gateway event-nevek (engedett)
`quote_calculator_conversion`, `callback_conversion`, `contact_form_submit`,
`phone_conversion`, `email_conversion`, `whatsapp_conversion`,
`quote_calculator_first_view`, `video_play`. (Új event = a gateway
ALLOWED_EVENT_NAMES + EVENT_NAME_MAP bővítése a Serverside repóban.)

## Megőrzött invariánsok (továbbra is érvényesek)
- **fbc coverage**: `getFbc()` a `_fbc` cookie-t preferálja, hiányában
  `fb.1.<fbclidAt>.<fbclid>`-t rekonstruál (a first-capture timestamppel, hogy
  ne driftiljen). A gateway is épít fbc-t fbclid-ből, ha a kliens nem küld fbc-t.
- **value event-típus-tudatos**: Lead/ViewContent valós érték; Contact value
  nélkül (ne mérgezzük a Smart Biddinget). A gateway `value: 0`-t sosem küld.
- **Normalizálás**: egy kanonikus normalizer (email lowercase/trim; phone UK 07→+44,
  HU 06→+36; név trim). A gateway szerver-oldalon is normalizál+hashel.
- A teljes doktrína: `docs/INVARIANTS.md`, `docs/CHECKLIST.md` (a tracking-kitből).

## Szerver-oldal (gateway) — összefoglaló
A szerver-logika a **`Soborbo/Serverside` event-gateway worker**. Ez a skill nem
duplikálja — a `server/SETUP-SERVER.md` + `generate-site.mjs` köti be az adott
site-ot (KV-config + route + Google Ads OAuth). A gateway tesztjei (156) ott élnek.

## Env Vars
**Kliens (Astro site worker):** `PUBLIC_TURNSTILE_SITE_KEY`. (A Meta/GA4/Ads
secretek NEM ide kellenek — azok a gateway KV-jébe.)
**Gateway (külön worker):** lásd `Soborbo/Serverside` — TURNSTILE_SECRET_KEY,
GADS_*, ADMIN_API_TOKEN, és a site-config KV (pixel/GA4/Ads ID-k + tokenek).

## Limitációk
- A Turnstile token aszinkron — pre-warmold (a widget page-loadkor execute-ál),
  hogy a form-submitkor kész legyen. Navigáció-típusú eventnél (tel: klikk) a
  cache-elt token segít.
- sendBeacon/fetch keepalive best-effort.
- Google Tag Gateway csökkenti, de nem szünteti meg az adblock-hatást.

## Kapcsolódó skillek
- `astro-forms` — a tényleges form-perzisztencia (`/api/submit`); az `event_id`
  köti össze a konverziót a lead-rekorddal.
- `deployment` — Astro v6 + Cloudflare Workers deploy.

## Esemény-taxonómia + GA4 setup
- **`docs/CANONICAL-EVENTS.md`** — a mérvadó esemény-térkép: böngésző ↔ GA4
  event-név ↔ gateway ↔ Meta/Ads, a GA4 Key Events és custom dimensions listája,
  és a **GA4-duplázás** kezelése (GA4 nem dedupol — egy csatorna GA4-re).
- **`docs/MIGRATION-existing-sites.md`** — már bekötött oldalak: hogyan add hozzá
  a gateway-t GA4-duplázás és átnevezés nélkül (bolt-on Meta+Ads, GA4 marad böngésző).

## Referenciák
`docs/gtm-setup.md`, `docs/cloudflare-setup.md`, `docs/testing.md`,
`docs/INVARIANTS.md`, `docs/CHECKLIST.md`, `docs/EVENTS.md`,
`docs/CANONICAL-EVENTS.md`, `docs/MIGRATION-existing-sites.md`,
`server/SETUP-SERVER.md`, `examples/`.
