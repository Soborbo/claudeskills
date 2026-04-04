# Wrangler Configuration Template — Astro v6 + Cloudflare Workers

## Basic wrangler.jsonc

```jsonc
{
  // CRITICAL: must match Worker name in Cloudflare Dashboard exactly
  "name": "project-name",
  "compatibility_date": "2026-03-01",
  "compatibility_flags": ["nodejs_compat"],
  // Astro adapter generates the entry point:
  "main": "dist/_worker.js/index.js",
  "assets": {
    "directory": "./dist/client"
  }
}
```

## With KV (Sessions / Rate Limiting)

```jsonc
{
  "name": "project-name",
  "compatibility_date": "2026-03-01",
  "compatibility_flags": ["nodejs_compat"],
  "main": "dist/_worker.js/index.js",
  "assets": {
    "directory": "./dist/client"
  },
  "kv_namespaces": [
    {
      "binding": "SESSION",
      "id": "your-kv-namespace-id"
    }
  ]
}
```

Note: Astro's Cloudflare adapter auto-provisions a SESSION KV namespace on deploy if you use Astro Sessions.

## Creating KV Namespace

```bash
npx wrangler kv:namespace create "RATE_LIMIT"
# Output gives you the ID for wrangler config
```

## The `name` Field — WHY IT MATTERS

The `name` field controls which Worker gets updated on `npx wrangler deploy`.

| name in config | Worker in dashboard | Result |
|----------------|--------------------|---------| 
| `my-site` | `my-site` | ✅ Updates existing Worker |
| `my-site` | `my-site-prod` | ❌ Creates NEW Worker called `my-site` |
| `My-Site` | `my-site` | ❌ Case mismatch — creates new Worker |

**Always verify before first deploy.**

## What Goes Where

| Setting | Location | Why |
|---------|----------|-----|
| `name` | wrangler config | Must match dashboard |
| `compatibility_date` | wrangler config | Runtime behavior |
| `compatibility_flags` | wrangler config | Node.js compat etc. |
| `PUBLIC_*` vars | wrangler config `vars` or Dashboard | Non-sensitive |
| API keys / secrets | Dashboard only | Encrypted |
| KV/D1/R2 bindings | wrangler config | Infrastructure |
| `NODE_VERSION` | Dashboard build settings | Build environment |

## Forbidden in wrangler config

```jsonc
// ❌ NEVER put secrets here
{
  "vars": {
    "TURNSTILE_SECRET_KEY": "xxx",
    "RESEND_API_KEY": "xxx",
    "SUPABASE_SERVICE_ROLE_KEY": "xxx"
  }
}
```

All secrets → Dashboard → Worker → Settings → Variables and Secrets (encrypted)

## Accessing Env Vars in Astro v6 Server Code

```ts
// ✅ Correct — Astro v6 + Cloudflare Workers
import { env } from "cloudflare:workers";

export async function POST({ request }) {
  const supabaseUrl = env.SUPABASE_URL;
  const resendKey = env.RESEND_API_KEY;
  // ...
}
```

```ts
// ❌ WRONG — both will throw
const key = process.env.RESEND_API_KEY;           // no process global
const { env } = context.locals.runtime;            // removed in Astro v6
```
