# Cloudflare Setup

## Google Tag Gateway
```
Dashboard → domain → Speed → Optimization → Content Optimization → Google Tag Gateway → Enable
```
Helps reduce some ad blocker impact. Verify: Network tab → GTM requests go through your domain.

## Environment Variables
```
Dashboard → Worker → Settings → Variables and Secrets (Production only)
```

| Variable | Required | Encrypt |
|----------|:--------:|:-------:|
| META_ACCESS_TOKEN | ✅ | ✅ |
| META_PIXEL_ID | ✅ | No |
| ALLOWED_ORIGINS | ✅ | No |
| TRACK_TOKEN | Optional | ✅ |
| TRACKING_SHEETS_WEBHOOK | Optional | No |

**ALLOWED_ORIGINS**: Your domains, comma-separated. E.g. `https://example.com,https://www.example.com`

**TRACK_TOKEN**: Optional shared secret. If set, the client must send `x-track-token` header. Extra abuse protection.

## Cloudflare WAF (Recommended)
```
Security → WAF → Rate limiting → Create rule
├── URI: /api/track
├── Method: POST
├── Rate: 10/min per IP
└── Action: Block
```
The in-memory rate limit in code is a soft check only. Cloudflare WAF is the real defence.

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
  <slot />
</body>
```
