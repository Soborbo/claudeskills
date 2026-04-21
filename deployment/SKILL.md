---
name: deployment
description: Deployment workflow for Astro v6 sites on Cloudflare Workers + GitHub. Use before first deploy, when debugging 500 errors, build failures, wrangler config issues, or dependency compatibility problems. Triggers on deploy, deployment, Cloudflare Workers, wrangler, staging, production, 500 error on CF, build output, dist folder problems, worker errors, resend cloudflare, vite version conflict. Also use when pushing to GitHub, checking deploy status, managing Cloudflare Workers via MCP, setting up Workers Builds, or configuring preview deployments.
---

# Deployment Skill — Astro v6 + Cloudflare Workers

This skill covers the full deploy pipeline for Astro v6 + Cloudflare Workers projects. Use it when:
- Setting up a new project for deployment
- Connecting GitHub repo via Workers Builds (push-to-deploy)
- Deploying to preview or production
- Debugging 500 errors, build failures, or wrangler issues after deploy
- Updating dependencies and checking compatibility
- A deploy that previously worked starts failing

## Key Facts

- Astro v6 + `@astrojs/cloudflare` v13 targets **Workers only** (Pages support was removed from the adapter)
- `astro dev` runs on the real `workerd` runtime — if it works locally, it works in production
- Static assets served by Workers are **free and unlimited** — only SSR requests count against quota
- Astro v6 includes **Zod 4 built-in** (`import { z } from 'astro/zod'`) — no separate Zod dependency needed
- Astro Sessions auto-configure with **Workers KV** for multi-step form state persistence
- Use **Astro Actions** for type-safe form handling with built-in validation
- The `fix-wrangler.mjs` hack from Pages deployments is **no longer needed** — delete it

---

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

Astro v6 dropped Node 18/20. Set `NODE_VERSION=22` in Workers Builds settings.

### 6. `nodejs_compat` flag

Required in wrangler config for Resend/Brevo fetch calls and any Node.js API usage in server code. Without it, server endpoints that use Node APIs will 500.

### 7. Build output

After `npm run build`, verify `dist/_worker.js/` (server) and `dist/client/` (static) exist.

### 8. Silent-catch paths must use `console.error`

Cloudflare Workers production logs (wrangler tail, dashboard) only surface `console.log/warn/error`. A `logger.debug(...)` call inside a `.catch(() => false)` or fire-and-forget branch is effectively invisible in prod — the failure silently disappears and you waste hours chasing a "works locally, broken on CF" ghost.

Rule: any path that swallows a failure (catch block, early `return false`, `Promise.all().catch(() => null)`) MUST log with `console.error` so the error shows up in wrangler tail. Use `logger.debug` only for verbose dev-only diagnostics gated behind an env var — never for actual error paths.

```ts
// BAD — error disappears in prod
ctx.waitUntil(appendToSheet(row).catch((err) => logger.debug('sheets failed', err)));

// GOOD — visible in wrangler tail
ctx.waitUntil(
  appendToSheet(row).catch((err) => console.error('[sheets] append failed', err)),
);
```

---

## Deploy Flow — Workers Builds (primary)

Workers Builds is the recommended CI/CD. It provides GitHub push-to-deploy with automatic preview URLs — the same experience Pages had, but native to Workers.

### First-time setup

1. Cloudflare Dashboard → Workers & Pages → Create → Import from GitHub
2. Select repository and branch (`main` for production)
3. Build settings: command `npm run build`, deploy command `npx wrangler deploy`
4. Set `NODE_VERSION=22` in environment variables

### Day-to-day workflow

```
feature branch → push → Workers Builds → preview URL on PR comment
                                        → share with client for review
main branch    → push → Workers Builds → production deploy
```

Every pull request gets an automatic preview deployment with a unique URL. Build status shows as a GitHub check run. No need for a separate `staging` branch.

### Monorepo support

If multiple client sites live in one repo, configure watch paths in Workers Builds settings so only the relevant site rebuilds on push.

### CLI fallback (when Workers Builds isn't set up)

```bash
npx wrangler deploy --dry-run     # test without deploying
npx wrangler deploy               # deploy
npx wrangler tail                 # live logs
npx wrangler rollback             # undo last deploy
```

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
| Missing `nodejs_compat` flag | Check wrangler config `compatibility_flags` |

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
| Preview indexable | noindex meta when `MODE !== 'production'` |
| No client approval | Written confirmation required |

Fix in order: Tier 1 → 2 → 3. Don't move to the next tier until the current one is clear.

---

## 500 Error Debug (post-deploy)

`astro dev` runs on the real `workerd` runtime in Astro v6. If the site works locally, the 500 is almost certainly an env var / secret issue, not a code issue. Start with `npx wrangler tail`.

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| 500 on all SSR pages | `locals.runtime` or `process.env` usage | grep + fix, redeploy |
| 500 on specific API route | Missing env var / secret for that route | Check dashboard bindings |
| 500 only on production (preview OK) | Env var difference between environments | Compare prod vs preview vars |
| Build succeeds, instant 500 | Worker entry point broken / wrangler config wrong | Check `dist/_worker.js/`, verify `main` field |
| Works locally, 500 on CF | Missing `nodejs_compat` flag or env var | Check wrangler config + dashboard |

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

## Astro v6 Server Patterns

### Env vars in server code

```ts
// ✅ Correct
import { env } from "cloudflare:workers";
const key = env.RESEND_API_KEY;

// ❌ Wrong — both throw
const key = process.env.RESEND_API_KEY;
const { env } = context.locals.runtime;
```

### Astro Actions (form handling)

Use Astro Actions for type-safe server endpoints with built-in Zod validation:

```ts
// src/actions/index.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';  // built-in, no install needed

export const server = {
  submitLead: defineAction({
    input: z.object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
    }),
    handler: async (input) => {
      // Resend email, Google Sheets, etc.
      return { success: true };
    },
  }),
};
```

### SSR endpoints (selective)

Keep pages static by default. Only opt into SSR where needed:

```ts
// src/pages/api/calculate.ts
export const prerender = false;  // this endpoint runs on Workers

export async function POST({ request }) {
  // calculator logic
}
```

### Sessions (multi-step form state)

Astro Sessions auto-configure with Workers KV:

```ts
// In any server endpoint
const session = await Astro.session;
session.set('step1Data', formData);
// Persists across requests via Workers KV
```

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

**Resend (email):**
- Open issues: https://github.com/resend/resend-node/issues?q=is%3Aissue+cloudflare
- Prefer direct `fetch()` to Resend REST API over the npm package to avoid bundling issues in Workers.

**Brevo (fallback email):**
- Open issues: https://github.com/getbrevo/brevo-node/issues?q=is%3Aissue+cloudflare+OR+workers

**Image processing:**
- Astro v6 defaults to Cloudflare Images binding — prefer over Sharp.
- Sharp uses native binaries that may not work in `workerd`.

**@astrojs/sitemap:**
- Changelog: https://github.com/withastro/astro/blob/main/packages/integrations/sitemap/CHANGELOG.md

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
- Search open issues in `withastro/astro` for "cloudflare adapter"
- Search open issues in `cloudflare/workers-sdk` for "astro"
- Read adapter CHANGELOG.md in `withastro/astro`

### Cloudflare MCP — use for:

**Pre-deploy:** Confirm Worker exists with correct name, check env vars/secrets, verify DNS, check Workers Builds status.
**Post-deploy:** Check deployment status, tail logs for errors, verify preview URLs.

The Cloudflare MCP server exposes the full Cloudflare API (2,500+ endpoints) via `search()` and `execute()` tools. It can create, configure, and deploy Workers directly.

---

## Pre-Production (first deploy only)

Beyond blocking conditions, also verify: Lighthouse > 90, forms sending, GTM firing, no broken links, mobile tested on real device, 404 page exists, legal pages present, contact info correct, client approved preview, sitemap submitted to Search Console.

---

## Migration from Pages (existing sites)

For sites currently on Cloudflare Pages with the `fix-wrangler.mjs` hack:

1. Delete `fix-wrangler.mjs` and any `scripts/` related to it
2. Remove the `postbuild` script from `package.json` that called it
3. Update `@astrojs/cloudflare` to v13+
4. Replace wrangler config with the minimal Workers template (see references/wrangler-template.md)
5. Add `"nodejs_compat"` to `compatibility_flags`
6. Create a new Worker in CF Dashboard (or connect via Workers Builds)
7. Move env vars/secrets from Pages project to Worker settings
8. Update DNS: custom domain → Worker instead of Pages project
9. Test with `astro dev` (runs on real `workerd`)
10. Deploy and verify

Estimated time per site: 15–30 minutes. Code, components, routing, and Tailwind don't change.

---

## References

- [cloudflare-setup.md](references/cloudflare-setup.md) — Initial CF Workers setup + Workers Builds
- [troubleshooting.md](references/troubleshooting.md) — Common issues and fixes
- [wrangler-template.md](references/wrangler-template.md) — Config templates (basic, KV, D1)
