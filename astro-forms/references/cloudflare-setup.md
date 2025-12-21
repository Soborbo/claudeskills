# Cloudflare Setup

## Overview

| Service | Purpose |
|---------|---------|
| Turnstile | Invisible CAPTCHA |
| KV | Rate limiting storage |
| Pages | Hosting + Functions |

---

## Turnstile (CAPTCHA)

### 1. Create Widget

1. Cloudflare Dashboard → Turnstile
2. Add Site → Choose "Invisible" mode
3. Copy Site Key + Secret Key

### 2. Frontend

```html
<!-- In form, before submit button -->
<div class="cf-turnstile" data-sitekey="0x4AAAAAAA..."></div>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

### 3. Backend Verification

```typescript
// src/lib/forms/turnstile.ts
interface TurnstileResult {
  success: boolean;
  error?: string;
}

export async function verifyTurnstile(token: string, ip: string): Promise<TurnstileResult> {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: import.meta.env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip,
    }),
  });
  
  const result = await response.json();
  
  return {
    success: result.success === true,
    error: result['error-codes']?.[0],
  };
}
```

### 4. Usage in API

```typescript
// In form handler
const turnstile = await verifyTurnstile(
  body['cf-turnstile-response'],
  request.headers.get('CF-Connecting-IP') || ''
);

if (!turnstile.success) {
  return json({ error: 'CAPTCHA failed' }, 400);
}
```

---

## KV (Rate Limiting)

### 1. Create Namespace

```bash
npx wrangler kv:namespace create "RATE_LIMIT"
# Output: id = "xxxxxxxx"
```

### 2. Configure wrangler.toml

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "your-namespace-id"
preview_id = "your-preview-id"  # For local dev
```

### 3. Rate Limit Implementation

```typescript
// src/lib/forms/rate-limit.ts
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const LIMITS = {
  submit: { max: 5, windowMs: 3600000 },  // 5/hour
  lookup: { max: 20, windowMs: 60000 },   // 20/min
};

export async function checkRateLimit(
  kv: KVNamespace,
  action: keyof typeof LIMITS,
  identifier: string
): Promise<RateLimitResult> {
  const key = `rate:${action}:${identifier}`;
  const limit = LIMITS[action];
  
  const current = await kv.get(key, 'json') as { count: number; resetAt: number } | null;
  const now = Date.now();
  
  if (!current || now > current.resetAt) {
    // New window
    await kv.put(key, JSON.stringify({
      count: 1,
      resetAt: now + limit.windowMs
    }), { expirationTtl: Math.ceil(limit.windowMs / 1000) });
    
    return { allowed: true, remaining: limit.max - 1, resetAt: now + limit.windowMs };
  }
  
  if (current.count >= limit.max) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }
  
  // Increment
  await kv.put(key, JSON.stringify({
    count: current.count + 1,
    resetAt: current.resetAt
  }), { expirationTtl: Math.ceil((current.resetAt - now) / 1000) });
  
  return { 
    allowed: true, 
    remaining: limit.max - current.count - 1, 
    resetAt: current.resetAt 
  };
}
```

### 4. Usage

```typescript
// In API handler
const limit = await checkRateLimit(
  context.env.RATE_LIMIT_KV,
  'submit',
  request.headers.get('CF-Connecting-IP') || 'unknown'
);

if (!limit.allowed) {
  return json({ 
    error: 'Too many requests',
    retryAfter: Math.ceil((limit.resetAt - Date.now()) / 1000)
  }, 429);
}
```

---

## Pages Functions

### Directory Structure

```
functions/
└── api/
    ├── submit.ts      # Form submission
    └── postcode.ts    # Postcode lookup
```

### Environment Variables

```bash
# Set via Cloudflare Dashboard or wrangler
npx wrangler pages secret put TURNSTILE_SECRET_KEY
npx wrangler pages secret put RESEND_API_KEY
npx wrangler pages secret put GOOGLE_SHEETS_WEBHOOK_URL
```

### Local Development

```bash
# .dev.vars file (gitignored)
TURNSTILE_SECRET_KEY=0x...
RESEND_API_KEY=re_...
GOOGLE_SHEETS_WEBHOOK_URL=https://...
```

```bash
# Run with secrets
npx wrangler pages dev ./dist --kv=RATE_LIMIT_KV
```

---

## Environment Variables Summary

| Variable | Where | Purpose |
|----------|-------|---------|
| `TURNSTILE_SITE_KEY` | Frontend | Widget display |
| `TURNSTILE_SECRET_KEY` | Backend | Verification |
| `RATE_LIMIT_KV` | Binding | KV namespace |
| `RESEND_API_KEY` | Backend | Email |
| `BREVO_API_KEY` | Backend | Email fallback |
| `GOOGLE_SHEETS_WEBHOOK_URL` | Backend | Lead storage |

---

## Checklist

- [ ] Turnstile widget created (invisible mode)
- [ ] Site key in frontend
- [ ] Secret key in environment
- [ ] KV namespace created
- [ ] KV binding in wrangler.toml
- [ ] Rate limiting implemented
- [ ] Local .dev.vars configured
- [ ] Production secrets set
