# Cloudflare Setup

## Google Tag Gateway
```
Dashboard → domain → Speed → Optimization → Content Optimization → Google Tag Gateway → Enable
```
Helps reduce some ad blocker impact. Verify: Network tab → GTM requests go through your domain.

## Environment Variables

The **site worker** needs the PUBLIC market vars plus the backend-dispatch
secrets — the Meta/Google Ads platform secrets live in the **gateway** worker's
KV/secrets (`Soborbo/Serverside`), NOT here.

**Site worker** (`Dashboard → Worker → Settings → Variables and Secrets`, or `.env`):

| Variable | Required | Notes |
|----------|:--------:|-------|
| PUBLIC_TRACKING_COUNTRY | Optional | `GB` (default) \| `HU` — phone + formatting |
| PUBLIC_TRACKING_CURRENCY | Optional | `GBP` (default) \| `HUF` \| `EUR`… — default conversion currency |
| PUBLIC_TRACKING_LOCALE | Optional | `en` (default) \| `hu` — display strings |
| TRACKING_GATEWAY_TOKEN | ✅ (secret) | per-site token (generate-site.mjs `crm-secret.env`) — backend dispatch + smoke |
| SITE_URL | ✅ | `https://example.com` — the site's own hostname |
| TRACKING_TEST_LEAD_EMAIL | ✅ | the designated synthetic-lead address (smoke cron) |
| TRACKING_TEST_EVENT_CODE | ✅ | Meta Test Events code for this pixel (per-request use only) |

**Gateway worker** (separate, see `server/SETUP-SERVER.md` + `Soborbo/Serverside`):
`GADS_*`, `ADMIN_API_TOKEN`, `SMOKE_SITES`, and the per-site config KV
(Meta token/pixel, offline Google Ads conversion actions, `country_code`/`currency`,
`require_consent`, `crm_token_sha256`, allowed origins). No Turnstile secret —
the gateway does not validate Turnstile.

## Gateway route + service binding

The `/api/event/*` path is served same-origin by the gateway worker (a route on your
domain → the gateway). The gateway enforces the Origin allow-list, consent and rate
limits on the browser path, and the per-site token on the server path.

The SITE worker reaches the gateway through a **service binding** (a plain fetch to
your own `/api/event/*` URL is short-circuited by Cloudflare's loop protection and
never arrives):
```toml
# keep_vars and other top-level keys must sit ABOVE every [table]!
keep_vars = true

[[services]]
binding = "GATEWAY"
service = "event-gateway"

[triggers]
crons = ["43 4 * * *"]   # daily smoke lead (stagger the minute per site)
```
Optionally add a Cloudflare WAF rate-limit rule as defence in depth:
```
Security → WAF → Rate limiting → Create rule
├── URI: /api/event/conversion
├── Method: POST
├── Rate: 10/min per IP
└── Action: Block
```
(Do NOT put such a rule on `/api/event/conversion-server` — the WAF-exempt server
ingress exists precisely because all backend conversions leave from one egress IP.)

## Astro Config
```js
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
});
```
Custom worker entry for the smoke cron: `main = "./src/worker.ts"` in the wrangler
config (see `server/backend/worker.ts`); after the first build, verify
`dist/server/wrangler.json` carries `main`, `triggers.crons` and `keep_vars`.

## Layout
```astro
<head>
  <Tracking gtmId="GTM-XXX" cookieYesId="YOUR_ID" />
</head>
<body>
  <TrackingNoscript gtmId="GTM-XXX" />
  <slot />
</body>
```
(No `<Turnstile/>` — the tracking path has no token gate.)
