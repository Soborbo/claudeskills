# Wrangler Configuration Template — Astro v6 + Cloudflare Workers

## Minimal wrangler.jsonc

```jsonc
{
  // CRITICAL: must match Worker name in Cloudflare Dashboard exactly
  "name": "project-name",
  "compatibility_date": "2026-03-01",
  "compatibility_flags": ["nodejs_compat"]
  // Note: Astro adapter auto-generates `main` and `assets` fields at build time.
  // You only need to specify them if overriding defaults.
}
```

This is all you need for most lead-gen sites. The adapter handles entry point and asset directory configuration.

## Explicit config (if auto-generation fails)

```jsonc
{
  "name": "project-name",
  "compatibility_date": "2026-03-01",
  "compatibility_flags": ["nodejs_compat"],
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
  "kv_namespaces": [
    {
      "binding": "SESSION",
      "id": "your-kv-namespace-id"
    }
  ]
}
```

Note: Astro Sessions auto-provision a KV namespace if you use `Astro.session` and the adapter detects the Cloudflare environment. You may not need to configure this manually.

## With D1 Database

```jsonc
{
  "name": "project-name",
  "compatibility_date": "2026-03-01",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_id": "your-d1-database-id",
      "database_name": "your-database-name"
    }
  ]
}
```

## Creating KV Namespace

```bash
npx wrangler kv:namespace create "RATE_LIMIT"
# Output gives you the ID for wrangler config
```

## Creating D1 Database

```bash
npx wrangler d1 create your-database-name
# Output gives you the database_id for wrangler config
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
| `NODE_VERSION` | Dashboard build settings (Workers Builds) | Build environment |

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

## Pages-specific fields to REMOVE if migrating

If you're converting a Pages wrangler config to Workers, **delete** these fields:
- `pages_build_output_dir`
- Any reference to `functions/` directory
- The `fix-wrangler.mjs` postbuild script

These are Pages-only concepts that don't apply to Workers.
