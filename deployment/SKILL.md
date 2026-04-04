---
name: deployment
description: Deployment workflow for Astro v6 sites on Cloudflare Workers + GitHub. Use before first deploy, when debugging 500 errors, build failures, wrangler config issues, or dependency compatibility problems. Triggers on deploy, deployment, Cloudflare Workers, wrangler, staging, production, 500 error on CF, build output, dist folder problems, worker errors, resend cloudflare, vite version conflict. Also use when pushing to GitHub, checking deploy status, or managing Cloudflare Workers via MCP.
---

# Deployment Skill — Astro v6 + Cloudflare Workers

This skill covers the full deploy pipeline for Astro v6 + Cloudflare Workers projects. Use it when:
- Setting up a new project for deployment
- Deploying to staging or production
- Debugging 500 errors, build failures, or wrangler issues after deploy
- Updating dependencies and checking compatibility
- A deploy that previously worked starts failing

The skill checks for Astro v6-specific pitfalls (removed APIs, Vite version conflicts, Node requirements), verifies dependency compatibility via living sources and GitHub/Cloudflare MCP, and defines the staging → production flow.

## ⚠ Critical Checks (run before every deploy)

### 1. No `context.locals.runtime.env`

Removed in Astro v6. Use `import { env } from "cloudflare:workers"` instead.

```bash
grep -r "locals.runtime" src/
# ANY results → fix before deploy
```

### 2. No `process.env` in server code

Cloudflare Workers has no `process` global. Use `cloudflare:workers` env. Client-side `import.meta.env.PUBLIC_*` is fine.

```bash
grep -r "process\.env" src/pages/api/ src/lib/ src/middleware*
# ANY results in server code → fix
```

### 3. Worker name must match dashboard

The `name` in wrangler config must exactly match the Worker name in Cloudflare Dashboard. Mismatch → deploy fails or creates a new Worker.

### 4. Vite version override

Astro v6 uses Vite 7. Packages like `@tailwindcss/vite` can hoist Vite 8, causing `require_dist is not a function` in workerd. Add to package.json: `"overrides": { "vite": "^7" }`

```bash
npm ls vite | head -20
# vite@8.x anywhere → add override
```

### 5. Node.js 22+

Astro v6 dropped Node 18/20. Set `NODE_VERSION=22` in Cloudflare build settings.

### 6. Build output

After `npm run build`, verify `dist/_worker.js/` (server) and `dist/client/` (static) exist.

---

## Blocking Conditions (STOP — fix before deploy)

**Tier 1 — deploy blocker (won't build/deploy):**

| Condition | Check |
|-----------|-------|
| Build fails | `npm run build` |
| Worker name mismatch | wrangler config `name` ≠ CF dashboard |
| Vite 8 hoisted | `npm ls vite` — must be ^7 |
| Node < 22 | `node -v` |
| TypeScript errors | `npx astro check` |
| Missing build output | `ls dist/_worker.js/ dist/client/` |
| Secret leak detected | Run secret leak detection checks below |

**Tier 2 — runtime crash (deploys but 500s):**

| Condition | Check |
|-----------|-------|
| `locals.runtime` in code | `grep -r "locals.runtime" src/` |
| `process.env` in server code | `grep -r "process\.env" src/pages/api/ src/lib/` |
| Missing env vars / secrets | Dashboard check, prod ≠ preview keys |
| Dependency compat unchecked | See living sources below |

**Tier 3 — quality (works but not ready):**

| Condition | Check |
|-----------|-------|
| Lighthouse < 90 | All categories |
| Forms broken | Test submission |
| Staging indexable | noindex meta when `MODE !== 'production'` |
| No client approval | Written confirmation required |

Fix in order: Tier 1 → 2 → 3. Don't move to the next tier until the current one is clear.

---

## 500 Error Debug (post-deploy)

If the site deploys but returns 500, start with `npx wrangler tail` — always the first step.

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| 500 on all SSR pages | `locals.runtime` or `process.env` usage | grep + fix, redeploy |
| 500 on specific API route | Missing env var / secret for that route | Check dashboard bindings |
| 500 only on production (staging OK) | Env var difference between environments | Compare prod vs preview vars |
| Build succeeds, instant 500 | Worker entry point broken / wrangler config wrong | Check `dist/_worker.js/`, verify `main` field |

---

## Secrets Rules

**Local:** `.dev.vars` only. **Production:** Dashboard or `wrangler secret put`. **wrangler.jsonc:** only secret names in `secrets.required`, never values.

### Secret leak detection (run before every deploy)

```bash
# .dev.vars must be in .gitignore
grep -q "\.dev\.vars" .gitignore || echo "FAIL: .dev.vars not in .gitignore"

# No secret values in wrangler config
grep -iE "(sk_|re_|key|secret|password|token).*[:=].*['\"][a-zA-Z0-9]" wrangler.* 2>/dev/null && echo "FAIL: possible secret value in wrangler config"

# No API keys hardcoded in source
grep -rnE "(sk_live|re_|supabase.*eyJ|RESEND_API_KEY\s*=\s*['\"]re_)" src/ && echo "FAIL: hardcoded API key in src/"

# No secret logged in server code
grep -rnE "console\.(log|info|warn|error).*\b(key|secret|token|password|api_key)\b" src/pages/api/ src/lib/ src/middleware* 2>/dev/null && echo "FAIL: possible secret in console.log"

# No secret rendered to client (Astro frontmatter leak)
grep -rnE "import\.meta\.env\.(?!PUBLIC_)" src/pages/ src/components/ 2>/dev/null | grep -v "frontmatter\|---" | grep -v "\.ts$\|\.js$" && echo "FAIL: non-PUBLIC_ env var may be exposed to client HTML"

# .dev.vars not tracked by git
git ls-files --error-unmatch .dev.vars 2>/dev/null && echo "FAIL: .dev.vars is tracked by git"
```

If any `FAIL` → **deployment BLOCKED**. Fix the leak before pushing.

---

## Dependency Compatibility Check (before first deploy)

**Do NOT hardcode version pins.** Check living sources, pin only if needed (with comment + issue link). Re-check every 2 months.

### Living sources

**Astro + Cloudflare adapter:**
- Adapter changelog: https://github.com/withastro/astro/blob/main/packages/integrations/cloudflare/CHANGELOG.md
- Adapter docs: https://docs.astro.build/en/guides/integrations-guide/cloudflare/

**Cloudflare runtime:**
- Workers changelog: https://developers.cloudflare.com/workers/platform/changelog/
- Compatibility flags: https://developers.cloudflare.com/workers/configuration/compatibility-flags/
- Wrangler releases: https://github.com/cloudflare/workers-sdk/releases

**Vite:** https://github.com/vitejs/vite/releases — check if Astro still pins Vite 7.

**Resend (or other email SDK):**
- Open issues: https://github.com/resend/resend-node/issues?q=is%3Aissue+cloudflare
- Releases: https://github.com/resend/resend-node/releases

**Brevo (transactional email):**
- Open issues: https://github.com/getbrevo/brevo-node/issues?q=is%3Aissue+cloudflare+OR+workers
- Releases: https://github.com/getbrevo/brevo-node/releases

**Sharp (image processing):**
- Open issues: https://github.com/lovell/sharp/issues?q=is%3Aissue+cloudflare+OR+workers+OR+wasm
- Note: Sharp uses native binaries — check if current version works in workerd or needs `@cloudflare/images` instead.

**@astrojs/sitemap:**
- Changelog: https://github.com/withastro/astro/blob/main/packages/integrations/sitemap/CHANGELOG.md
- Check compatibility with current Astro major version.

**astro-robots-txt:**
- Open issues: https://github.com/alextim/astro-lib/issues
- Releases: https://www.npmjs.com/package/astro-robots-txt?activeTab=versions

### Quick CLI check

```bash
npm ls vite                           # Vite version
npm ls @astrojs/cloudflare            # Adapter version
npx wrangler --version                # Wrangler version
npm ls 2>&1 | grep -i "WARN\|ERR"    # Peer dep warnings
```

---

## MCP Integration (GitHub + Cloudflare)

If GitHub or Cloudflare MCP is connected, prefer over CLI/manual checks.

### GitHub MCP — use for:

**Dependency compat check:**
- Search open issues in `resend/resend-node` for "cloudflare"
- Search open issues in `getbrevo/brevo-node` for "cloudflare" or "workers"
- Search open issues in `lovell/sharp` for "cloudflare" or "wasm" or "workers"
- Search open issues in `withastro/astro` for "cloudflare adapter"
- Search open issues in `cloudflare/workers-sdk` for "astro"
- Read adapter CHANGELOG.md in `withastro/astro`

**Deploy flow:** Push to `staging` → check CI → share staging URL → after approval, PR to `main` → merge deploys.

### Cloudflare MCP — use for:

**Pre-deploy:** Confirm Worker exists with correct name, check env vars/secrets, verify DNS.
**Post-deploy:** Check deployment status, tail logs for errors.

### CLI fallback

```bash
npx wrangler deploy --dry-run     # test without deploying
npx wrangler deploy               # deploy
npx wrangler tail                 # live logs
npx wrangler rollback             # undo
```

---

## Pre-Production (first deploy only)

Beyond blocking conditions, also verify: Lighthouse > 90, forms sending, GTM firing, no broken links, mobile tested on real device, 404 page exists, legal pages present, contact info correct, client approved staging, sitemap submitted to Search Console.

---

## References

- [cloudflare-setup.md](references/cloudflare-setup.md) — Initial CF Workers setup
- [troubleshooting.md](references/troubleshooting.md) — Common issues and fixes
- [wrangler-template.md](references/wrangler-template.md) — Config template
