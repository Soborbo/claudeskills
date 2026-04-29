---
name: error-pipeline
description: >-
  Per-site client tracker and Astro endpoint for the centralised
  soborbo-error-pipeline workers. Captures client JS errors via sendBeacon,
  forwards via console.error → Tail Worker. Server-side uncaught exceptions
  are captured automatically. ~1.5KB client bundle, no external deps. Email
  throttled to 1 per (site, code) per 4 hours by the notifier worker.
---

# Error Pipeline Skill

## When To Use

- Astro project on Cloudflare Workers needs error monitoring
- The `soborbo-error-pipeline` repo is already deployed
- Project should report client errors and have server exceptions captured

## When Not To Use

- Heavy frontend (React/Vue SPA) — tracker is tuned for static + island Astro
- Pre-launch / staging — only wire this in when you want alerts

## Architecture

```
producer Astro project           shared infra (separate repo)
┌──────────────────┐             ┌──────────────────────┐
│ tracker.ts       │ sendBeacon  │ error-notifier       │
│ ~1.5KB client    │────────────►│ (Tail Worker)        │
│                  │             │   ↓                  │
│ /api/error-log   │ tail_consumer  ERROR_KV ──┐        │
│ 15-line endpoint │────────────►│   ↓         │        │
│                  │             │   Resend    │        │
│ + auto SSR       │             │   CRITICAL  │        │
│   exception cap  │             └─────────────┼────────┘
└──────────────────┘                           ▼
                                         error-admin
                                       (Cloudflare Access)
```

Producer is dumb on purpose. Endpoint logs structured JSON via `console.error`
and returns 204 immediately. All severity, throttling, persistence, and email
logic lives in the notifier worker.

## File Structure

```
src/
├── lib/errors/
│   ├── tracker.ts          # client tracker, sendBeacon
│   └── client-init.ts      # global handlers + init
└── pages/api/
    └── error-log.ts        # 15-line endpoint, returns 204
```

## Quick Setup

1. Copy reference files into `src/lib/errors/` and `src/pages/api/`.

2. Wire the client init in your base layout (last script before `</body>`):

```astro
<script>
  import { initErrorTracker } from '@/lib/errors/client-init';
  initErrorTracker({
    siteId: import.meta.env.PUBLIC_SITE_ID || 'unknown',
    endpoint: '/api/error-log',
  });
</script>
```

Set `PUBLIC_SITE_ID` to match the producer's `wrangler.jsonc` script name.

3. Add to `wrangler.jsonc`:

```jsonc
{ "tail_consumers": [{ "service": "error-notifier" }] }
```

Redeploy.

## Reporting From Server Code

Uncaught exceptions: do nothing — Workers captures these automatically.

Known error conditions in API routes:

```typescript
console.error(JSON.stringify({
  __pipeline: 'error',
  code: 'EMAIL-BOTH-001',
  message: 'Resend and Brevo both failed',
  url: request.url, source: '/api/quote',
  context: { resendStatus: 500 },
  stack: '', ts: new Date().toISOString(),
  requestId: crypto.randomUUID().slice(0, 12),
  fingerprint: 'EMAIL-BOTH-001:quote',
  pageLoadedAgo: 0,
  userAgent: '', viewport: '', connection: '', sessionId: '',
}));
```

The notifier resolves severity from the code.

## Performance

- Client init runs in `requestIdleCallback` — ~0.3-0.5ms TTI cost
- Bundle ~1.5KB minified, no dependencies
- `sendBeacon` is fire-and-forget — zero blocking
- Endpoint returns 204 in <5ms, no awaits

## What This Skill Does NOT Cover

- Web Vitals (separate skill, different alerting model)
- Source map upload (manual; add to deploy script if needed)
- The notifier/admin workers — see `soborbo-error-pipeline` repo

## See Also

- `references/setup.md` — extended setup with troubleshooting
- `references/tracker.ts` — client tracker source
- `references/client-init.ts` — global error handlers
- `references/error-log-endpoint.ts` — Astro endpoint
