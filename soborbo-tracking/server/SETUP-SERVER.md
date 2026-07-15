# Server wiring — event-gateway worker

The server side is the **`Soborbo/Serverside` event-gateway worker**. Wiring a new
site = KV site-config + route + per-site token + (if Google Ads) OAuth. The config
is produced deterministically by `generate-site.mjs` — **never hand-write it**.

## 0. Prerequisite
- `Soborbo/Serverside` repo available (`git clone https://github.com/Soborbo/Serverside.git`).
  Verify its DEFAULT branch and the Workers Builds production branch before any PR.
- SITE_CONFIG KV namespace id: `edd34e28eee847c09c26f9d9e3ea04ab`.

## 1. Collect the IDs (from MCP connectors where possible)
- **Meta pixel_id** — Meta Ads connector (`get_pixels`) or Events Manager.
- **Meta CAPI access_token** — Events Manager → Conversions API → Generate. **Secret.**
- **Meta Test Events code** — Events Manager → Test Events tab (for the smoke cron's
  `TRACKING_TEST_EVENT_CODE` var — per-request use ONLY, never KV).
- **Google Ads customer_id** — Ads connector (`list_google_ads_customers`), 10 digits
  without hyphens; login_customer_id only under an MCC.
- **conversion_actions** — Ads connector: action IDs keyed by **canonical** event
  names (typically the offline CRM events: `lead_qualified`, `booking_confirmed`,
  `revenue_confirmed` — the server does Google Ads only offline). Legacy GA4 alias
  keys are rejected by the generator: the ingress canonicalizes names before the
  lookup, so a legacy-keyed map never matches at runtime.
- **country_code / currency / require_consent** — per market (EEA → `require_consent: true`).
- **NO ga4 block for new sites** — the gateway sends no GA4 (browser owns on-site
  GA4; the offline GA4 leg is disabled). The block is legacy/diagnostics-only.

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
  "gads": { "customer_id": "1234567890", "login_customer_id": null,
            "conversion_actions": { "lead_qualified": "...", "booking_confirmed": "..." } }
}
```
Output: `site-config.json` (incl. `crm_token_sha256`), `routes.toml`, `kv-put.sh`,
`crm-secret.env` (the token PLAINTEXT — save it now, it is unrecoverable),
`INTEGRATION.md`.

**Hard gates:** `meta.test_event_code` in the input → exit 1 (per-request test
codes only; `--allow-test-event-code` is the explicit pre-launch opt-in).
Legacy-alias conversion_action keys → exit 1.
**Secrets NEVER into git — only into KV / worker secrets.**

## 3. KV upload
Run the commands in `kv-put.sh` (wrangler) or the Cloudflare MCP `kv_put`,
one entry per hostname.

## 4. Route + smoke registration + deploy
Add the `routes.toml` block to the Serverside `wrangler.toml` AND add the
`site_id` to the `SMOKE_SITES` var (same file) → branch + **PR into the deployed
branch** → deploy. This makes `https://<host>/api/event/*` go to the gateway
worker (same-origin with the site).

## 5. Distribute the per-site token
From `crm-secret.env`:
- Site worker secret `TRACKING_GATEWAY_TOKEN` (backend conversions + smoke cron —
  see `backend/README.md`).
- CRM deploy secrets `TRACKING_WORKER_URL` + `TRACKING_ADMIN_TOKEN` (offline
  lead-status loop).
The KV config stores only the SHA-256 (`crm_token_sha256`); once it is set, the
global ADMIN_API_TOKEN no longer writes to this site (tenant isolation).

## 6. Google Ads OAuth (if there is a customer_id)
Once per customer_id: `GET /api/event/oauth-init` (X-Admin-Token) → OAUTH_TOKENS KV.
Scope MUST include `datamanager`.

## 7. Verification
`./smoke-test.sh https://<host>` (gate behavior), then the generated
`INTEGRATION.md` "Verification": first smoke-cron ledger row
(`meta | accepted | 200` or `skipped`; NEVER `accepted` without http_status),
digest clean, Meta Test Events via the smoke lead only, Workers Logs 24h.
