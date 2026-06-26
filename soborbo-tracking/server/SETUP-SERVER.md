# Server wiring — event-gateway worker

The server side is the **`Soborbo/Serverside` event-gateway worker**. Wiring a new
site = KV site-config + route + (if Google Ads) OAuth. The config is produced
deterministically by `generate-site.mjs`.

## 0. Prerequisite
- `Soborbo/Serverside` repo available (`git clone https://github.com/Soborbo/Serverside.git`).
- SITE_CONFIG KV namespace id: `edd34e28eee847c09c26f9d9e3ea04ab`.

## 1. Collect the IDs (from MCP connectors where possible)
- **Meta pixel_id** — Meta Ads connector (`get_pixels`) or Events Manager.
- **Meta CAPI access_token** — Events Manager → Conversions API → Generate. **Secret.**
- **GA4 measurement_id (G-XXXX)** — GA4 connector: the web data stream's Measurement ID
  (NOT the property number).
- **GA4 api_secret** — GA4 Admin → Data Streams → stream → Measurement Protocol API
  secrets → Create. **Secret.**
- **Google Ads customer_id** — Ads connector (`list_google_ads_customers`), 10 digits
  without hyphens; login_customer_id only under an MCC.
- **conversion_actions** — Ads connector: action IDs mapped to event names.
- **country_code / currency / require_consent** — per market (EEA → `require_consent: true`).

## 2. Generate
```bash
node server/generate-site.mjs --input /tmp/<site>.json --out /tmp/<site>-out
```
Input (see the validator in the script):
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
Output: `site-config.json`, `routes.toml`, `kv-put.sh`, `INTEGRATION.md`.
**Secrets NEVER into git — only into KV.**

## 3. KV upload
Using the commands in `kv-put.sh` (wrangler) or the Cloudflare MCP `kv_put`,
one entry per hostname.

## 4. Route + deploy
Add the `routes.toml` block to the Serverside `wrangler.toml` → branch + PR →
`wrangler deploy`. This makes `https://<host>/api/event/*` go to the gateway worker
(same-origin with the site).

## 5. Google Ads OAuth (if there is a customer_id)
Once per customer_id: `GET /api/event/oauth-init` (X-Admin-Token) → OAUTH_TOKENS KV.

## 6. Verification
`INTEGRATION.md` "Verification": health, Meta Test Events (dedup on the same event_id),
GA4 DebugView (+ campaign_details if UTM), Google Ads Conversions, Workers Logs 24h.
