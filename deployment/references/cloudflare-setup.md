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
This installs the adapter, creates a wrangler config, and sets `output: 'server'` in astro.config.

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

Note: Astro auto-generates defaults if wrangler config is missing. The `main` field pointing to `dist/_worker.js/index.js` is set automatically by the adapter.

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

### 6. Local Development

```bash
# Runs on real workerd runtime — true dev/prod parity
npx astro dev
```

If it works in `astro dev`, it will work in production. This is new in Astro v6 — previous versions used Node.js locally and workerd only in production.

### 7. Deploy

**Option A: Workers Builds (recommended)**

1. Dashboard → Workers & Pages → Create → Import from GitHub
2. Select repo, set build command: `npm run build`
3. Set deploy command: `npx wrangler deploy`
4. Set `NODE_VERSION=22` in build environment variables
5. Every push to `main` → production deploy
6. Every PR → preview URL posted as GitHub comment

**Option B: CLI**

```bash
npx wrangler deploy
```

## Workers Builds Settings (GitHub CI/CD)

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Node version | 22 |
| Root directory | `/` (or subfolder for monorepo) |

### Monorepo configuration

If multiple sites in one repo, set watch paths so only the relevant site rebuilds:
- Root directory: `sites/client-name/`
- Workers Builds only triggers when files in that path change

### Preview deployments

Pull requests automatically get preview URLs. Share these with clients for review instead of maintaining a separate staging branch.

## Cost Model

- **Static asset requests**: Free and unlimited (HTML, CSS, JS, images)
- **SSR requests** (calculator submissions, API endpoints): Count against Workers quota
- **Free tier**: 100,000 SSR requests/day — more than enough for lead-gen sites
- **Workers KV** (sessions, rate limiting): Free tier includes 100,000 reads/day

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
4. Check Workers Builds status for recent deploys
