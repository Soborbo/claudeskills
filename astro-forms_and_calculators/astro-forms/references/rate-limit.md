# Rate Limiting Reference

## Cloudflare KV Setup

```toml
# wrangler.toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "your-kv-namespace-id"
```

Create namespace:
```bash
wrangler kv:namespace create "RATE_LIMIT_KV"
```

## Rate Limit Function

```typescript
// src/lib/forms/rate-limit.ts

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

declare const RATE_LIMIT_KV: KVNamespace;

const LIMITS = {
  submit: { perMinute: 5 },
  postcode: { perMinute: 30 },
};

export async function checkRateLimit(
  type: keyof typeof LIMITS,
  identifier: string
): Promise<RateLimitResult> {
  const limit = LIMITS[type].perMinute;
  const minuteKey = `${type}:${identifier}:${Math.floor(Date.now() / 60000)}`;
  
  try {
    const current = parseInt(await RATE_LIMIT_KV.get(minuteKey) || '0', 10);
    
    if (current >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: Math.ceil(Date.now() / 60000) * 60000,
      };
    }
    
    await RATE_LIMIT_KV.put(minuteKey, String(current + 1), {
      expirationTtl: 60,
    });
    
    return {
      allowed: true,
      remaining: limit - current - 1,
      resetAt: Math.ceil(Date.now() / 60000) * 60000,
    };
  } catch (error) {
    // Fail open if KV errors
    console.error('Rate limit error:', error);
    return { allowed: true, remaining: -1, resetAt: 0 };
  }
}

export function getRateLimitHeaders(result: RateLimitResult) {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetAt),
  };
}
```

## Usage in API

```typescript
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress || 'unknown';
  
  const rateLimit = await checkRateLimit('submit', ip);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { 
        status: 429, 
        headers: getRateLimitHeaders(rateLimit) 
      }
    );
  }
  
  // ... process request
};
```

## Structured Logging

```typescript
// src/lib/forms/logger.ts
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createLogger(context: { requestId: string; ip?: string }) {
  return {
    info: (msg: string, data?: object) => 
      console.log(JSON.stringify({ level: 'info', msg, ...context, ...data })),
    error: (msg: string, error?: unknown) => 
      console.error(JSON.stringify({ level: 'error', msg, error, ...context })),
  };
}
```
