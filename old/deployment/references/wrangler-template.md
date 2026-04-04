# Wrangler Configuration Template

## Basic wrangler.toml

```toml
name = "project-name"
compatibility_date = "2024-01-01"
pages_build_output_dir = "dist"

[vars]
PUBLIC_SITE_NAME = "Business Name"

# NEVER put secrets here - use Cloudflare Dashboard
```

## With KV for Rate Limiting

```toml
name = "project-name"
compatibility_date = "2024-01-01"
pages_build_output_dir = "dist"

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "your-kv-namespace-id"

[vars]
PUBLIC_SITE_NAME = "Business Name"
```

## Creating KV Namespace

```bash
# Create namespace
npx wrangler kv:namespace create "RATE_LIMIT"

# Output will give you the ID to put in wrangler.toml
```

## What Goes Where

| Setting | Location | Why |
|---------|----------|-----|
| `PUBLIC_*` vars | wrangler.toml or Dashboard | Non-sensitive |
| API keys | Dashboard only | Secrets |
| KV bindings | wrangler.toml | Infrastructure |
| Build settings | Dashboard | UI managed |

## Forbidden in wrangler.toml

```toml
# ❌ NEVER DO THIS
TURNSTILE_SECRET_KEY = "xxx"
RESEND_API_KEY = "xxx"
DATABASE_URL = "xxx"
```

All secrets → Cloudflare Dashboard → Settings → Environment Variables
