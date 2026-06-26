# Szerver-bekötés — event-gateway worker

A szerver-oldal a **`Soborbo/Serverside` event-gateway worker**. Egy új site
bekötése = KV site-config + route + (ha Google Ads) OAuth. A configot a
`generate-site.mjs` állítja elő determinisztikusan.

## 0. Előfeltétel
- `Soborbo/Serverside` repo elérhető (`git clone https://github.com/Soborbo/Serverside.git`).
- SITE_CONFIG KV namespace id: `edd34e28eee847c09c26f9d9e3ea04ab`.

## 1. ID-k összegyűjtése (MCP-connectorokból, ahol lehet)
- **Meta pixel_id** — Meta Ads connector (`get_pixels`) v. Events Manager.
- **Meta CAPI access_token** — Events Manager → Conversions API → Generate. **Secret.**
- **GA4 measurement_id (G-XXXX)** — GA4 connector: web data stream Measurement ID-ja
  (NEM a property-szám).
- **GA4 api_secret** — GA4 Admin → Data Streams → stream → Measurement Protocol API
  secrets → Create. **Secret.**
- **Google Ads customer_id** — Ads connector (`list_google_ads_customers`), 10 számjegy
  kötőjel nélkül; login_customer_id csak MCC alatt.
- **conversion_actions** — Ads connector: akció-ID-k event-névre képezve.
- **country_code / currency / require_consent** — piac szerint (EEA → `require_consent: true`).

## 2. Generálás
```bash
node server/generate-site.mjs --input /tmp/<site>.json --out /tmp/<site>-out
```
Input (lásd a validátort a scriptben):
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
Kimenet: `site-config.json`, `routes.toml`, `kv-put.sh`, `INTEGRATION.md`.
**Secret SOHA gitbe — csak KV-be.**

## 3. KV feltöltés
A `kv-put.sh` parancsaival (wrangler) vagy a Cloudflare MCP `kv_put`-tal,
hostname-enként egy bejegyzés.

## 4. Route + deploy
A `routes.toml` blokkját a Serverside `wrangler.toml`-jához → branch + PR →
`wrangler deploy`. Ettől a `https://<host>/api/event/*` a gateway workerre megy
(same-origin a site-tal).

## 5. Google Ads OAuth (ha van customer_id)
Egyszer customer_id-nként: `GET /api/event/oauth-init` (X-Admin-Token) → OAUTH_TOKENS KV.

## 6. Verifikáció
`INTEGRATION.md` "Ellenőrzés": health, Meta Test Events (dedup azonos event_id),
GA4 DebugView (+ campaign_details ha UTM), Google Ads Conversions, Workers Logs 24h.
