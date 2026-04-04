# Deployment Troubleshooting — Astro v6 + Cloudflare Workers

## 🔴 Astro v6 Specific Issues (Check These First)

### 500 Error After Deploy — `context.locals.runtime.env`

**Symptom:** Site builds fine, deploys fine, but every SSR page returns 500.
**Cause:** Astro v6 removed `context.locals.runtime`.
**Fix:** `import { env } from "cloudflare:workers";`
**Find:** `grep -rn "locals.runtime" src/`

### `require_dist is not a function` — Vite 8 Conflict

**Symptom:** Dev server or build crashes with `require_dist is not a function` in workerd.
**Cause:** A package (often `@tailwindcss/vite`) hoisted Vite 8 to top-level, but Astro v6 needs Vite 7.
**Fix:** Add to package.json: `"overrides": { "vite": "^7" }` then `rm -rf node_modules && npm install`
**Verify:** `npm ls vite` — should show only 7.x

### Worker Name Mismatch — Deploy Creates New Worker

**Symptom:** `npx wrangler deploy` succeeds but the existing Worker isn't updated. A new Worker appears.
**Cause:** `name` in wrangler config doesn't match the Worker name in CF dashboard.
**Fix:** Check dashboard Worker name, update wrangler config to match exactly.

### `process.env` Undefined

**Symptom:** `TypeError: Cannot read properties of undefined` on env var access.
**Cause:** Cloudflare Workers has no `process` global.
**Fix:** `import { env } from "cloudflare:workers";`
**Find:** `grep -rn "process\.env" src/pages/api/ src/lib/ src/middleware*`

### Build Output Wrong Structure

**Symptom:** Deploy succeeds but site shows 404 or default CF page.
**Cause:** Build output doesn't match wrangler config expectations.
**Fix:** Verify after build:
```bash
ls dist/_worker.js/    # Server entry
ls dist/client/        # Static assets
```
Check that wrangler config `main` and `assets.directory` point to these.

---

## General Build Issues

```bash
# Always check locally first
npm run build
```

| Issue | Fix |
|-------|-----|
| Node version mismatch | Astro v6 needs Node 22+. Set `NODE_VERSION=22` in CF |
| Missing dependencies | `rm -rf node_modules && npm ci` |
| TypeScript errors | `npx astro check` and fix |
| Import case sensitivity | Linux is strict about file name casing |

## Environment Variables Not Working

| Check | Solution |
|-------|----------|
| Not in dashboard | Add in Worker → Settings → Variables |
| Wrong environment | Separate Production/Preview values |
| Missing PUBLIC_ prefix | Client-side vars need `PUBLIC_` prefix |
| Using process.env | Use `import { env } from "cloudflare:workers"` |
| Just added | Trigger new deploy — vars aren't hot-reloaded |

## Custom Domain Not Working

| Issue | Fix |
|-------|-----|
| DNS not propagated | Wait up to 24h, check with `dig domain.com` |
| Not configured | Worker → Settings → Domains & Routes |
| SSL pending | Wait ~15 min for certificate provisioning |

## Forms Not Sending

| Check | Solution |
|-------|----------|
| Turnstile key wrong | Different keys for prod/preview |
| CORS error | Check `PUBLIC_SITE_URL` matches domain |
| Email API error | Verify `RESEND_API_KEY` in dashboard |
| Resend version issue | Check https://github.com/resend/resend-node/issues?q=cloudflare |

## Dependency Issues

Before debugging further, always check the living sources:
- Adapter: https://github.com/withastro/astro/blob/main/packages/integrations/cloudflare/CHANGELOG.md
- Workers: https://developers.cloudflare.com/workers/platform/changelog/
- Resend: https://github.com/resend/resend-node/issues?q=cloudflare

## Rollback

```bash
npx wrangler rollback
```

If CLI fails: Dashboard → Worker → Deployments → Previous → Rollback
