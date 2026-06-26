# Cloudflare Setup

## Google Tag Gateway
```
Dashboard → domain → Speed → Optimization → Content Optimization → Google Tag Gateway → Enable
```
Helps reduce some ad blocker impact. Verify: Network tab → GTM requests go through your domain.

## Environment Variables

In v5 the **site worker only needs PUBLIC vars** — the Meta/GA4/Google Ads secrets
and `ALLOWED_ORIGINS`/`TURNSTILE_SECRET_KEY` live in the **gateway** worker's KV/secrets
(`Soborbo/Serverside`), NOT here.

**Site worker** (`Dashboard → Worker → Settings → Variables and Secrets`, or `.env`):

| Variable | Required | Notes |
|----------|:--------:|-------|
| PUBLIC_TURNSTILE_SITE_KEY | ✅ | Turnstile site key for the `<Turnstile/>` widget |
| PUBLIC_TRACKING_COUNTRY | Optional | `GB` (default) \| `HU` — phone + formatting |
| PUBLIC_TRACKING_CURRENCY | Optional | `GBP` (default) \| `HUF` \| `EUR`… — default conversion currency |
| PUBLIC_TRACKING_LOCALE | Optional | `en` (default) \| `hu` — display strings |

**Gateway worker** (separate, see `server/SETUP-SERVER.md` + `Soborbo/Serverside`):
`TURNSTILE_SECRET_KEY`, `GADS_*`, `ADMIN_API_TOKEN`, and the per-site config KV
(Meta token/pixel, GA4 MP, Google Ads conversion actions, `country_code`/`currency`,
`require_consent`, allowed origins).

## Gateway route + WAF

The `/api/event/*` path is served same-origin by the gateway worker (a route on your
domain → the gateway). The gateway enforces Turnstile, consent, origin and rate limits
server-side. Optionally add a Cloudflare WAF rate-limit rule as defence in depth:
```
Security → WAF → Rate limiting → Create rule
├── URI: /api/event/conversion
├── Method: POST
├── Rate: 10/min per IP
└── Action: Block
```

## Astro Config
```js
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
});
```

## Layout
```astro
<head>
  <Tracking gtmId="GTM-XXX" cookieYesId="YOUR_ID" />
</head>
<body>
  <TrackingNoscript gtmId="GTM-XXX" />
  <Turnstile />   {/* required for the gateway's turnstile_token */}
  <slot />
</body>
```
