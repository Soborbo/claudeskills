# Pitfalls that broke production

Each entry: what you see, why it happens, what to do. All of them happened on our sites;
none of them is covered by the official Cloudflare skills in this form.

## 1. Secrets at runtime, `PUBLIC_*` at build time

**Symptom:** a secret works locally but the deployed form fails, or a secret shows up in
the client bundle; or a `PUBLIC_*` value is empty in the browser.
**Cause:** Astro/Vite inlines every `import.meta.env.*` it can resolve **at build time**.
A secret placed in the build environment ends up baked into the Worker bundle. A wrangler
`vars` entry is a **runtime** binding, so a client script never sees it.
**Do:**
- Server secrets (`RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `CRM_WEBHOOK_SECRET`, ...) →
  Worker Variables and Secrets (`wrangler secret put NAME`), read via `cloudflare:workers`.
- Only `PUBLIC_*` goes to the build env (CI env, Workers Builds build variable, `.env`).
- If a value must be in both places, derive one from the other at build time, as the
  template's `astro.config.mjs` does for `PUBLIC_SITE_ID` (`vite.define` from wrangler vars).
- `.dev.vars` is gitignored and never committed.

## 2. `wrangler deploy` overwrites dashboard vars

**Symptom:** after a deploy, Turnstile/SMTP/tracking silently stop working.
**Cause:** without `keep_vars`, wrangler replaces the Worker's plain vars with what is in
the config file. Vars set only in the dashboard disappear. Secrets are not deleted.
**Do:** deploy through the project's script or CI workflow. If any plain var lives only in
the dashboard, the deploy command is `wrangler deploy --keep-vars` (or set
`"keep_vars": true` in the config). The leadgen template keeps every non-secret var in
`wrangler.jsonc`, so there the file is the source of truth; never "fix" a missing var by
adding it in the dashboard on such a project, put it in the file.

## 3. D1: at most 100 bound parameters per query

**Symptom:** a list page 500s once real data grows (Benolám: dashboard after 100+
customers).
**Cause:** `WHERE id IN (?, ?, ...)` built from an unbounded array exceeds the D1 limit.
**Do:** chunk any `.bind(...ids)` to about 90 per query and merge the results. Review every
repository function that spreads an array into `IN (...)`.

## 4. Stale Worker routes win over the new custom domain

**Symptom:** the apex works, but some paths (`/api/*`, `/instantquote/*`) return 530 or
someone else's page.
**Cause:** zone Worker **routes** are matched before a Custom Domain binding. A
transitional/legacy Worker that still owns `example.com/api*` hijacks those paths.
**Do:** after a cutover, list every Worker on the account and check its routes for the
hostname (Cloudflare MCP `workers_list`/`workers_get_worker`, or the dashboard). Delete the
legacy Worker or its routes; deleting the Worker removes its routes.

## 5. `not_found_handling = "404-page"` on a Worker with SSR routes

**Symptom:** an SSR route works with `curl` and `fetch`, but a browser gets the static 404.
**Cause:** for navigation requests (`Sec-Fetch-Dest: document`) the asset layer serves the
404 page itself and never invokes the Worker.
**Do:** do not set it when the project has a Worker with on-demand routes. Astro already
renders the project's 404 page for unknown routes. It is fine only on an assets-only project.

## 6. `cloudflare:workers` env, and a top-level try/catch in every handler

**Symptom:** API routes return an empty 405/500 with nothing in the logs (Astro 6
migration outage).
**Cause:** `Astro.locals.runtime` was removed in Astro 6, so `locals.runtime.env` is
undefined; the thrown error escaped the handler and produced no log entry.
**Do:** `import { env } from 'cloudflare:workers'`. Wrap each handler body in
`try { ... } catch (error) { console.error(JSON.stringify({ ... })); return errorResponse(...) }`
so the failure is logged as structured JSON and returns a controlled response.
`process.env` exists under `nodejs_compat` but does not reliably carry dashboard values;
do not use it for bindings.

## 7. No critical-CSS extractors

**Symptom:** after "inline critical CSS", `BaseLayout.css` shrinks to a few hundred bytes
and the layout breaks (carousels hidden, grids collapsed). Happened on two projects.
**Cause:** beasties/critters (also via `@playform/inline`, `astro-beasties`) prune
everything they think is below the fold, including Tailwind 4 responsive utilities.
**Do:** never add them. To remove the render-blocking stylesheet use
`build.inlineStylesheets: 'always'`; otherwise leave the default `'auto'`.

## 8. Count-up numbers: final value in the HTML

**Symptom:** crawlers and LLM bots read "1.0 ★ Google reviews".
**Cause:** the server HTML held the animation start value; only JS moved it to 4.9.
**Do:** render the real value as text; keep the start value in the script only.

## 9. Windows lockfile vs Linux CI

**Symptom:** `npm ci` on CI fails with `Missing: @emnapi/runtime from lock file` (or other
sharp optional deps).
**Cause:** npm writes a platform-filtered lockfile on Windows.
**Do:** regenerate in a clean directory (the project dir reuses cached resolution):
```bash
mkdir -p /tmp/lockgen && cp package.json /tmp/lockgen/ && cd /tmp/lockgen
npm install --os=linux --cpu=x64 --libc=glibc --include=optional --package-lock-only
cp package-lock.json /path/to/project/
```

## Smaller ones

- **Vite override follows the Astro major.** Do not pin a Vite major from memory: check the
  Vite range the installed Astro declares (`npm view astro@<ver> dependencies.vite`). Pinning
  the previous major breaks the build (symptom: `require_dist is not a function`). Vite 8
  uses Rolldown: do not re-add `@rollup/rollup-*` optional deps.
- **Build before deploy.** The adapter writes the real deploy config to
  `dist/server/wrangler.json`; `wrangler deploy` on a fresh checkout fails with "Missing
  entry-point". Do not hand-write `main` or an assets dir; the adapter owns them.
  `dist/_worker.js` is the old Pages layout, not a thing to check for.
- **Id-less `SESSION` binding.** The adapter wires a KV session driver even if sessions
  are unused, and an undeclared `SESSION` binding can block deploy. The template points it
  at an existing namespace with `sessionKVBindingName`.
- **`.wrangler/` in `.gitignore`.** A committed `.wrangler/deploy/config.json` silently
  redirects wrangler to a stale config.
- **Deploy from a clean tree.** Deploy scripts build the working tree, not `origin/main`.
  If sessions share a checkout, deploy from a fresh worktree of the commit you mean.
- **Workers Builds:** the Worker name in the dashboard must equal `name` in the config.
- **Populated D1 table rebuilds.** A migration that drops/recreates tables with
  `PRAGMA foreign_keys=OFF` fails under `d1 migrations apply` on a database with data,
  because the pragma is ignored inside the migrations transaction. Apply that migration with
  `wrangler d1 execute <db> --remote --file <migration.sql>`, then record it in
  `d1_migrations` (soborbo-crm: `scripts/apply-rebuild-migration.sh`). An empty dry-run DB
  does not catch it.
- **Rocket Loader off** on zones serving Astro sites; it rewrites script loading and
  breaks hydration and tag order.
