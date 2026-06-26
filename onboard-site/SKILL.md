---
name: onboard-site
description: Bind a new website to the Soborbo event-gateway server-side tracking worker (repo Soborbo/Serverside). Use when the user wants to "connect"/"onboard"/"bekötni" a site (Trapézlemez, Skinlab, fémkerítés, olcsó kerítés, stb.) to the tracking worker — gathers Meta/GA4/Google Ads IDs from the connected MCP connectors, generates the KV site-config + route + client snippet via the bundled generate-site.mjs, and prepares the deploy. Complements the soborbo-tracking (client-side Astro kit) skill.
---

# Onboard a site to the event-gateway worker

Egy új site-ot köt be a Soborbo **`event-gateway`** workerhez (repo
`Soborbo/Serverside`). A bundled `generate-site.mjs` determinisztikusan állítja
elő a configot — te (az agent) az ID-ket gyűjtöd az MCP-connectorokból és
levezényled a lépéseket. **Ne improvizáld a config-formátumot — a scriptet futtasd.**

Kapcsolódó skill: **`soborbo-tracking`** (a kliens-oldali Astro drop-in:
`<Tracking/>`, `<TrackedForm/>`, `<PhoneLink/>`, CookieYes consent, attribúció).
Ez a skill az operatív bekötés (KV + route + verifikáció); az a kliens-kód.

## Előfeltétel
- A `Soborbo/Serverside` repo legyen elérhető (klónozd, ha nincs):
  `git clone https://github.com/Soborbo/Serverside.git`. A KV/route/wrangler/
  client-lib ott él; ez a skill arra dolgozik.
- SITE_CONFIG KV namespace id: `edd34e28eee847c09c26f9d9e3ea04ab`.

## Lépések

### 1. Gyűjtsd össze az ID-ket (MCP-connectorok)
Kérdezd meg a hostname-eket (apex + www) és a site_id-t, majd:

- **Meta pixel_id** — Meta Ads connector (`get_pixels`). Ha nincs, Events Managerből.
- **Meta CAPI access_token** — NEM API-ból. Kérd be (Events Manager → Conversions
  API → Generate access token). Secret → csak KV-be.
- **GA4 measurement_id (G-XXXX)** — GA4 connector: a web data stream Measurement ID-ja
  (a property-szám, pl. 449987171, NEM ez).
- **GA4 api_secret** — NEM API-ból. Kérd be (GA4 Admin → Data Streams → stream →
  Measurement Protocol API secrets → Create). Secret → csak KV-be.
- **Google Ads customer_id** — Ads connector (`list_google_ads_customers`), 10 számjegy
  KÖTŐJEL NÉLKÜL. login_customer_id csak ha MCC alatt.
- **Google Ads conversion_actions** — Ads connector: konverzió-akció ID-k event-névre
  képezve. Engedett: quote_calculator_conversion, callback_conversion,
  contact_form_submit, phone_conversion, email_conversion, whatsapp_conversion,
  quote_calculator_first_view, video_play.
- **country_code / currency** — piac szerint (HU/HUF, GB/GBP, …).
- **require_consent** — EEA (HU/EU/DE/FR/IT/ES) site-on `true`.

### 2. Generátor
Írd az inputot temp fájlba (NE a gitbe, secretekkel!), majd:

```bash
node onboard-site/generate-site.mjs --input /tmp/<site>.json --out /tmp/<site>-out
```

Input alak:
```json
{
  "site_id": "trapezlemez",
  "hostnames": ["trapezlemezes.hu", "www.trapezlemezes.hu"],
  "country_code": "HU", "currency": "HUF", "require_consent": true,
  "meta": { "pixel_id": "...", "access_token": "..." },
  "ga4": { "measurement_id": "G-XXXX", "api_secret": "..." },
  "gads": { "customer_id": "1234567890", "login_customer_id": null,
            "conversion_actions": { "callback_conversion": "...", "phone_conversion": "..." } }
}
```
Kimenet: `site-config.json`, `routes.toml`, `kv-put.sh`, `INTEGRATION.md`. Validál
(hibás ID → exit 1); javítsd az inputot, ne a scriptet.

### 3. KV feltöltés
A `kv-put.sh` parancsaival (wrangler) vagy a Cloudflare MCP `kv_put` tooljával,
hostname-enként egy bejegyzés (namespace id fent).

### 4. Route + PR
A `routes.toml` blokkját a Serverside `wrangler.toml`-jához → branch + PR (ne main-re
közvetlenül). A user `wrangler deploy`-jal élesít.

### 5. Google Ads OAuth (ha van customer_id)
Egyszer customer_id-nként: `GET /api/event/oauth-init` (X-Admin-Token) → OAUTH_TOKENS KV.

### 6. Astro site
Add át az `INTEGRATION.md`-t. Lényeg: client-lib (vagy a `soborbo-tracking` skill
komponensei) bemásolása, Turnstile widget + PUBLIC_TURNSTILE_SITE_KEY,
`trackConversion(...)` a konverziós pontokon. Consent (CookieYes) + attribúció automatikus.

### 7. Verifikáció
Az `INTEGRATION.md` "Ellenőrzés" szakasza: health, Meta Test Events (dedup azonos
event_id), GA4 DebugView, Google Ads Conversions, Workers Logs 24h.

## Szabályok
- Secrets (CAPI token, GA4 api_secret) SOHA gitbe — csak KV-be.
- EEA site: `require_consent: true` + CookieYes bekötve.
- test_event_code-ot élesítés előtt KÖTELEZŐ kivenni (a generátor figyelmeztet).
- Mindig a generátort futtasd a confighoz — ne kézzel írd a JSON-t.
