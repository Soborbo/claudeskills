# Deployment Troubleshooting — Astro v6 + Cloudflare Workers

## First Step: Local Reproduction

Astro v6 `astro dev` runs on the real `workerd` runtime. If the bug reproduces locally, it's a code issue. If it works locally but fails on CF, it's almost always env vars/secrets or `nodejs_compat`.

---

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
Check that wrangler config `assets.directory` points to `./dist/client`.

### Missing `nodejs_compat` — Server Endpoints Crash

**Symptom:** Works locally in `astro dev`, but SSR endpoints return 500 on CF.
**Cause:** Missing `nodejs_compat` compatibility flag. Some Node.js APIs used by Resend, Brevo, or other libraries aren't available without it.
**Fix:** Add to wrangler config:
```jsonc
"compatibility_flags": ["nodejs_compat"]
```
Redeploy after adding.

---

## General Build Issues

```bash
# Always check locally first
npm run build
```

| Issue | Fix |
|-------|-----|
| Node version mismatch | Astro v6 needs Node 22+. Set `NODE_VERSION=22` in Workers Builds |
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
| Still pointing to old Pages project | Update DNS to point to Worker |

## Forms Not Sending

| Check | Solution |
|-------|----------|
| Turnstile key wrong | Different keys for prod/preview |
| CORS error | Check `PUBLIC_SITE_URL` matches domain |
| Email API error | Verify `RESEND_API_KEY` in dashboard |
| Resend version issue | Check https://github.com/resend/resend-node/issues?q=cloudflare |
| Missing nodejs_compat | Add flag to wrangler config, redeploy |

## Workers Builds Issues

| Issue | Fix |
|-------|-----|
| Build not triggering | Check GitHub App permissions, verify watch paths |
| Build succeeds, deploy fails | Check wrangler config `name` matches dashboard |
| Preview URL not posting to PR | Verify Workers Builds GitHub integration is connected |
| Wrong Node version in build | Set `NODE_VERSION=22` in build environment variables |

## Pages → Workers Migration Issues

| Issue | Fix |
|-------|-----|
| `fix-wrangler.mjs` still running | Delete script + remove `postbuild` from package.json |
| Old `_headers` / `_redirects` not working | Move to wrangler config or middleware — `_headers` is supported by Workers static assets, `_redirects` may need middleware |
| Env vars missing after migration | Re-add all vars in Worker settings (not carried over from Pages) |
| Custom domain still on Pages | Update DNS: remove Pages CNAME, add Worker route |

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
