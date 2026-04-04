---
name: error-tracking
description: >-
  Client + server error tracking for Astro on Cloudflare Workers. Global error
  catcher, offline queue, dedup, 290+ error codes with severity/impact, Web Vitals
  monitoring (LCP/CLS/INP/TTFB), PII sanitization, Google Sheets logging, email
  alerts for CRITICAL errors. ~4KB client bundle, no external dependencies.
---

# Error Tracking Skill

## When To Use

- New Astro project needs error monitoring without paid SaaS (Sentry, etc.)
- Need CRITICAL error alerts via email
- Need Web Vitals monitoring with threshold-based reporting
- Need structured error codes across forms, SEO, calculators, email providers

## Architecture

```
Client (browser)                    Server (CF Workers)
┌─────────────────┐                ┌──────────────────┐
│ client-catcher   │  sendBeacon   │ error-report.ts  ��
│ tracker.ts       │──────────────►│ (POST /api/error)│
│ web-vitals.ts    │  fetch+queue  │                  │
│ sanitize.ts      │               │  ┌──► Sheets     │
└─────────────────┘               │  └──► Email alert │
       ~4KB                        └────────────────���─┘
                                   tracker-server.ts
                                   (API route errors)
```

Client bundle imports `tracker.ts` only (no `codes.ts`). Server uses full code registry for severity resolution.

## File Structure

```
src/
├── lib/errors/
│   ├── client-catcher.ts    # Global catch: onerror, unhandledrejection, img, offline
│   ├── tracker.ts           # Client reporter: dedup, queue, sendBeacon/fetch
│   ├── tracker-server.ts    # Server reporter: Sheets + email for API routes
│   ├── error-report.ts      # POST endpoint: validate, rate limit, log, alert
│   ├── codes.ts             # 290+ error codes (severity, impact, retry, context)
│   ├── types.ts             # TypeScript interfaces
│   ├── sanitize.ts          # PII masking, size enforcement
│   └── web-vitals.ts        # LCP, CLS, INP, TTFB via PerformanceObserver
└── pages/api/
    └── error-report.ts      # Wire error-report.ts as Astro API route
```

## Quick Setup

### 1. Client-side (base layout)

Last script before `</body>`:

```astro
<script>
  import { initGlobalCatcher } from '@/lib/errors/client-catcher';
  import { initWebVitals } from '@/lib/errors/web-vitals';

  initGlobalCatcher({
    endpoint: '/api/error-report',
    siteId: import.meta.env.PUBLIC_SITE_ID || 'unknown',
    deployId: import.meta.env.PUBLIC_DEPLOY_ID || '',
    isDev: import.meta.env.DEV,
  });

  initWebVitals();
</script>
```

### 2. API endpoint

Create `src/pages/api/error-report.ts`:

```typescript
export { POST } from '@/lib/errors/error-report';
```

### 3. Server-side tracking (in API routes)

```typescript
import { trackServerError, buildErrorConfig } from '@/lib/errors/tracker-server';

const errorConfig = buildErrorConfig(import.meta.env);

try {
  // your logic
} catch (e) {
  await trackServerError('FORM-SUBMIT-001', e, { formId: 'contact' }, errorConfig);
  return new Response(JSON.stringify({ ok: false }), { status: 500 });
}
```

## Error Code System

Codes follow pattern: `CATEGORY-SUBCATEGORY-###`

### Categories

| Category | Prefix | Codes | Examples |
|----------|--------|-------|---------|
| HTTP | `HTTP-4xx/5xx` | 25 | `HTTP-500-001`, `HTTP-524-001` (CF timeout) |
| Server/Workers | `SRV-*` | 23 | `SRV-FUNC-001` (unhandled), `SRV-ENV-001` (env missing) |
| Email | `RESEND-*`, `BREVO-*`, `EMAIL-*` | 32 | `EMAIL-BOTH-001` (both providers failed) |
| Forms | `FORM-*` | 30 | `FORM-ZOD-001`, `FORM-HONEY-001` |
| Calculators | `CALC-*` | 30 | `CALC-PRICE-001` (NaN), `CALC-STEP-001` |
| SEO | `SEO-*` | 45 | `SEO-META-015` (noindex in prod!), `SEO-PERF-001` (LCP) |
| Config | `CFG-*` | varies | `CFG-MISS-001` (required config missing) |
| Network | `NET-*` | varies | `NET-OFFLINE-001`, `NET-TIMEOUT-001` |
| JavaScript | `JS-*` | varies | `JS-RUNTIME-001`, `JS-PROMISE-001` |
| Images | `IMG-*` | varies | `IMG-LOAD-001` (image load failure) |

### Code Definition

```typescript
{
  severity: 'CRITICAL' | 'ERROR' | 'WARN' | 'INFO',
  message: string,
  retryable: boolean,
  userImpact: 'blocked' | 'degraded' | 'none',
  requiredContext?: string[]  // validated in dev mode
}
```

### Adding Project-Specific Codes

Edit `PROJECT_CODES` in `codes.ts`:

```typescript
export const PROJECT_CODES: Record<string, ErrorCodeDef> = {
  'MOVE-DIST-001': {
    severity: 'ERROR', retryable: true, userImpact: 'degraded',
    message: 'Distance API failed',
    requiredContext: ['from', 'to'],
  },
};
```

## Severity & Alerting

| Severity | Action | When |
|----------|--------|------|
| CRITICAL | Sheets + email alert | Service down, data loss risk |
| ERROR | Sheets | Feature broken, user blocked |
| WARN | Sheets | Degraded UX, soft errors |
| INFO | Sheets (optional) | Informational, bots, duplicates |

## Key Features

### Deduplication
- 60-second window per fingerprint (`code:source:messageHash`)
- Max 50 reports per session
- In-memory Map, resets on page reload

### Offline Queue
- localStorage key: `_err_queue`
- Max 20 reports, 24h expiry
- Auto-flushes on `online` event and `DOMContentLoaded`
- Fallback: if fetch fails, report auto-queued

### PII Sanitization
- Field names `email`, `phone`, `name`, `address`, `postcode` redacted
- Email patterns masked: `a***@d***.com`
- UK postcodes masked
- Limits: max 10 context keys, 500 chars/value, 4KB total

### Web Vitals
- LCP > 2500ms, CLS > 0.1, INP > 200ms, TTFB > 800ms
- Reports only when threshold exceeded (silent if OK)
- Production only (disabled in dev)
- Reported on `visibilitychange` to `hidden`

### Rate Limiting (endpoint)
- 30 reports/minute per IP (hashed via `cf-connecting-ip`)
- Cloudflare KV with 60s TTL
- Graceful degradation if KV unavailable

## Env Vars

### Client-side (`import.meta.env`)

```
PUBLIC_SITE_ID=painless-removals
PUBLIC_DEPLOY_ID=abc123           # auto-set by CF Pages
```

### Server-side (Cloudflare bindings)

```
RESEND_API_KEY=re_xxxxx           # for CRITICAL email alerts
ERROR_SHEETS_WEBHOOK_URL=https://script.google.com/...
ERROR_EMAIL_TO=alerts@example.com
ERROR_ALERT_FROM=errors@example.com  # must be verified with Resend
RATE_LIMIT_KV=binding-name          # optional, for rate limiting
```

## Integration with Other Skills

- **astro-forms**: Use `FORM-*` codes in form submission handlers. `tracker-server.ts` catches and reports errors with full context.
- **tracking**: Independent systems. Error tracking monitors infrastructure health; tracking monitors user conversion behavior.
- **Business email alert failure**: If Resend fails for business notification in astro-forms, use `trackServerError('EMAIL-BOTH-001', ...)` to escalate via the error tracking pipeline.

## Limitations

- Client bundle ~4KB (no tree-shaking of tracker.ts)
- Offline queue max 20 items (older items purged)
- Session dedup resets on page reload (memory-only)
- Rate limit KV is eventually consistent
- Web Vitals require PerformanceObserver support (all modern browsers)
