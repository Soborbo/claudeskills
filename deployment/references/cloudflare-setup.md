# Cloudflare Workers Setup — Astro v6

## Prerequisites
- Cloudflare account
- GitHub repository
- Node.js 22+
- Astro v6 with `@astrojs/cloudflare` adapter v13+

## Setup Steps

### 1. Add Cloudflare Adapter
```bash
npx astro add cloudflare
```
This installs the adapter and creates a wrangler config. It sets `output: 'server'` in astro.config. Add `imageService: 'compile'` for build-time image processing (Sharp doesn't run on Cloudflare Workers at runtime):

```js
// astro.config.mjs — with build-time image processing
export default defineConfig({
  // 'server' if you have API routes / forms, 'static' for pure static sites
  output: 'server',
  adapter: cloudflare({ imageService: 'compile' }),
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' }
  }
});
```

### 2. Verify wrangler.jsonc

```jsonc
{
  "name": "your-project-name",   // MUST match CF dashboard Worker name
  "compatibility_date": "2026-03-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "./dist/client"
  }
}
```

The `name` field is critical — if it doesn't match the Worker name in the Cloudflare Dashboard, deploy will fail or create a duplicate Worker.

### 3. Add Vite Override

```json
// package.json
{
  "overrides": { "vite": "^7" }
}
```

Required to prevent Vite 8 hoisting from packages like `@tailwindcss/vite`.

### 4. Environment Variables

Set in Cloudflare Dashboard → Worker → Settings → Variables and Secrets:
- `NODE_VERSION=22` (required for build)
- All project-specific secrets (API keys etc.)

### 5. Custom Domain
1. Dashboard → Worker → Settings → Domains & Routes
2. Add custom domain
3. Cloudflare handles DNS + SSL automatically if domain is on CF

### 6. Deploy

```bash
# Local test (runs in workerd — same as production)
npx astro preview

# Deploy
npx wrangler deploy
```

Or connect GitHub repo for automatic deploys via Workers Builds.

## Build Settings (if using Workers Builds / CI)

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Node version | 22 |

## Monitoring (Required)

| Type | Tool | Required |
|------|------|----------|
| Analytics | Cloudflare Analytics | ✅ |
| Uptime | Cloudflare or UptimeRobot | ✅ |
| Search | Google Search Console | ✅ |
| Errors | `npx wrangler tail` or Sentry | Recommended |

## MCP Verification

If Cloudflare MCP is available:
1. `workers_list` — verify Worker exists
2. Check Worker name matches wrangler config
3. After deploy: `workers_get` to confirm latest version
