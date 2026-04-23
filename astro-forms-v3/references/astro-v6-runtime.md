# Astro v6 Runtime Access (Cloudflare)

Read this if the form submission pipeline runs through an **Astro SSR API route** (`src/pages/api/*.ts`) rather than a raw Cloudflare Worker. Astro v6 introduced breaking changes that cause silent 500s if you use the v5 pattern.

If you use the raw Worker pattern (`export default { fetch(request, env, ctx) }`), skip to section 3 for the deploy gotcha.

---

## 1. `Astro.locals.runtime.env` was removed

**WRONG (Astro v5 pattern, still widely documented):**

```ts
export const POST: APIRoute = async ({ locals }) => {
  const env = (locals as App.Locals).runtime?.env;
  const apiKey = env.RESEND_API_KEY;
  // ...
};
```

At runtime, Astro v6 throws:

```
Error: Astro.locals.runtime.env has been removed in Astro v6.
Use 'import { env } from "cloudflare:workers"' instead.
```

The handler crashes. Without a top-level try/catch (section 2), this surfaces as a bare 500 with no diagnostic info.

**RIGHT (Astro v6):**

```ts
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const apiKey = env.RESEND_API_KEY;
  // ...
};
```

`env` is a module-level import. No `locals` destructuring needed. Type it via a global `Env` interface in `src/env.d.ts`:

```ts
interface Env {
  RATE_LIMIT_KV?: KVNamespace;
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  GOOGLE_SHEET_ID?: string;
  // ... your bindings
}
```

The `cloudflare:workers` module picks up this global interface automatically.

---

## 2. Every API handler needs a top-level try/catch

**Why:** Any uncaught exception surfaces to the client as a bare `500` with **no body**, and Cloudflare Observability captures only a generic `Worker unhandled exception` — no stack trace, no context. Diagnosing the Astro v6 `locals.runtime.env` error took several hours in production because the failure was invisible without a try/catch.

**Pattern:**

```ts
import { errorResponse } from '../../lib/errors';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    // ... handler logic ...
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return errorResponse('SRV-FUNC-001', 'Server error, please try again later', 500, {
      context: {
        functionPath: '/api/<name>',
        errorMessage: err instanceof Error ? err.message : String(err),
      },
      extra: err,
    });
  }
};
```

`errorResponse` both logs (via `logCode`) and returns a structured JSON body (`{ error, code, retryable }`). The `errorMessage` in context goes to the log but not the response body — debugging info stays server-side.

**For emergency debugging**, add `extraBody: { debugMessage, debugStack }` to surface the error details in the client response. Remove once diagnosed.

---

## 3. Cloudflare Workers Builds deploy config (`--keep-vars`)

This applies to both Astro SSR and raw Worker setups.

**Default `wrangler deploy` rewrites all plaintext runtime env vars on every deploy** using `wrangler.jsonc`'s `vars` block. If that block has placeholder values (`REPLACE_WITH_...`), your real dashboard values get replaced with placeholders. The secrets (bindings created via `wrangler secret put`) survive, but plaintext vars are clobbered.

**Two supported approaches:**

### A. Dashboard is the source of truth (recommended)

1. Remove the `vars` block from `wrangler.jsonc` entirely.
2. Dashboard → Workers → <worker> → Build → Build configuration → **Deploy command**: `npx wrangler deploy --keep-vars`
3. Also set **Version command**: `npx wrangler versions upload --keep-vars`
4. Manage plaintext vars on the dashboard (Variables and Secrets → Add → Plaintext).

### B. Code is the source of truth

Put real values (not placeholders) in `wrangler.jsonc` `vars` block. Acceptable for truly public values (Turnstile site key, public API endpoints, `ALLOWED_ORIGINS`).

**Note**: `TURNSTILE_SITE_KEY` must be available at **build time** too (Astro reads it via `import.meta.env` to embed in static HTML). Add it separately in **Build → Variables and secrets** in addition to the runtime binding. Otherwise the widget never renders and every POST returns 400 `turnstile_missing`.

---

## 4. Trailing slash on API fetches

If `astro.config.mjs` has `trailingSlash: 'always'`, every frontend fetch to an API endpoint MUST include the trailing slash:

```ts
// ✅
await fetch('/api/callback/', { method: 'POST', ... });

// ❌ — 404 or 308 redirect that may drop POST body → silent 500
await fetch('/api/callback', { method: 'POST', ... });
```

Browsers follow 308 for POST but body preservation is inconsistent. Safer: match the canonical URL exactly.

---

## 5. Turnstile widget + hostname allowlist

When you register a Turnstile site in the Cloudflare dashboard, you must explicitly add every hostname where the widget will render:

- `yourdomain.com`
- `www.yourdomain.com`
- `<worker-name>.<subdomain>.workers.dev` (for preview/testing)
- `localhost` (for local dev)

Missing hostname → `TurnstileError: 110200` in the browser console → widget never renders → form can't acquire a token → every POST returns 400 `turnstile_missing`.

---

## Common failure modes checklist

| Symptom | Likely cause |
|---|---|
| Bare 500, no useful logs | Missing top-level try/catch **or** `locals.runtime.env` in Astro v6 |
| 404 on POST to `/api/name` | Missing trailing slash with `trailingSlash: 'always'` |
| Plaintext env vars reset to placeholders after deploy | Missing `--keep-vars` flag, placeholders in `wrangler.jsonc vars` |
| `TurnstileError: 110200` | Hostname not in Turnstile site's allowed list |
| Widget never renders (no `cf-turnstile` div in HTML) | `TURNSTILE_SITE_KEY` not in **build-time** env (only set at runtime) |
| 400 `turnstile_missing` but widget visible | User didn't complete challenge, or widget rendered in a hidden container |
