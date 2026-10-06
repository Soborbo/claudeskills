---
name: soborbo-astro-cloudflare
description: Soborbo's production-learned rules for building, deploying and checking Astro sites and apps on Cloudflare Workers (@astrojs/cloudflare, Tailwind 4, D1/KV) - the pitfalls that broke live sites (wiped dashboard vars, secrets baked into the bundle, D1 parameter limit, stale Worker routes, not_found_handling hiding SSR routes, beasties eating Tailwind CSS, Windows lockfile), the build-time image pipeline of Soborbo/leadgen-template-site, siteConfig to Tailwind @theme tokens, fonts, preview noindex and the pre-release check. Use when setting up, deploying, debugging a 500/404, adding images or fonts, changing brand colours, tuning Core Web Vitals, or reviewing a PR in a Soborbo/László Astro repo. Use it next to the official wrangler, workers-best-practices and web-perf skills, which own generic Cloudflare and measurement knowledge. Not for forms (astro-forms-v3), tracking/consent (Soborbo/Serverside soborbo-tracking), JSON-LD content (schema skill), copywriting, or non-Astro Workers.
---

# Soborbo Astro on Cloudflare

This skill holds what we learned the hard way on live Soborbo sites (lead-gen sites from
`Soborbo/leadgen-template-site`, and app-like projects such as the CRM and fitapp). It does
**not** repeat generic Cloudflare or Astro knowledge. For that, load the official skills:

| Need | Load |
|---|---|
| Wrangler commands, config keys, secrets, environments, rollback | `wrangler` |
| Worker code review, compat date, `nodejs_compat`, observability basics | `workers-best-practices` |
| Measuring CWV/Lighthouse, network chains, trace analysis | `web-perf` |
| Product choice, Static Assets, Workers Builds docs | `cloudflare` |
| Turnstile | `turnstile-spin` |

When this skill and an official skill seem to disagree, the official one is right about
Cloudflare's general behaviour and this one is right about our projects' history. Check the
version-sensitive facts in `references/perishable-facts.md` against the project's own
`package.json` before applying them: our repos are not all on the same majors.

## First, look at the project

Before changing anything, read these. Each one changes what the right answer is.

- **`package.json`**: Astro and `@astrojs/cloudflare` major, Tailwind major, and the
  `scripts` (`build` may run the image pipeline first; `deploy` may wrap wrangler).
- **`wrangler.jsonc` / `wrangler.toml`**: which vars live in the file, bindings,
  `routes`/custom domain, `assets`, `observability`, `tail_consumers`, `workers_dev`.
- **Project `CLAUDE.md`**: the deploy mode (CI workflow, Workers Builds, or a manual
  script). Our fleet is mixed on purpose; do not assume one. If it is not written down, ask.
- **`astro.config.mjs`**: `output`, `adapter(...)` options (`imageService`,
  `sessionKVBindingName`), `fonts`, `build.inlineStylesheets`, integrations.

## The pitfalls that broke production

Full symptom → cause → fix for each is in `references/pitfalls.md`. One line each here so
you recognise them:

1. **Secrets are runtime, `PUBLIC_*` is build time.** Server secrets go to the Worker's
   Variables and Secrets (`wrangler secret put`); only `PUBLIC_*` belongs in the build env,
   because Vite inlines it into the bundle. A wrangler `vars` entry never reaches the browser.
2. **A plain `wrangler deploy` wipes dashboard-set vars.** Use the project's deploy script;
   if any var lives only in the dashboard, deploy with `--keep-vars` (or `keep_vars: true`).
3. **D1 allows at most 100 bound parameters per query.** Chunk `IN (...)` lists (about 90).
4. **Old Worker routes beat a new custom domain.** Delete the legacy Worker or its routes.
5. **`not_found_handling = "404-page"` hides SSR routes from browsers** (curl still works).
6. **Env comes from `cloudflare:workers`**, not `Astro.locals.runtime`, and every API
   handler has a top-level `try/catch` that logs; otherwise you get an empty 500 with no log.
7. **No beasties/critters/@playform/inline.** They strip Tailwind 4 media-query utilities.
   Use `build.inlineStylesheets` instead.
8. **Animated counters render the final value in HTML**, never the animation start value.
9. **A Windows-generated lockfile fails `npm ci` on Linux CI** (sharp/emnapi). Regenerate
   it in a clean dir with Linux flags.

Also in `pitfalls.md`: Vite override per Astro major, the adapter's id-less `SESSION`
binding, build-before-deploy, populated-D1 table rebuilds (`d1 execute --file`), deploy from
a clean worktree.

## Images

Lead-gen sites process images at **build time**: `imageService: 'compile'` must be set
explicitly, because the adapter default is now `cloudflare-binding` (runtime, billed). The
canonical code is in `Soborbo/leadgen-template-site`: `src/components/images/*`,
`src/config/image-patterns.ts`, `scripts/optimize-images.mjs`, `scripts/generate-og-images.ts`,
`scripts/check-og-images.ts`. Copy from there; this skill does not carry a second copy.

Open `references/images.md` when adding or reviewing images: pattern choice, per-format
quality (why AVIF q50 beats WebP q60), art direction, OG cards, face focus, alt text, the
`/public/` preprocessor and its `--clean` trap, and the post-build image check every site
should have.

## Design tokens and components

Brand colours and fonts come from `siteConfig`; components never hold raw hex values.
Open `references/design-tokens.md` when changing brand colours, generating a scale,
adding a component variant, or fixing contrast.

## Performance

Measure with `web-perf` first. Then open `references/performance.md` for our own decisions:
Astro Fonts API (self-hosted, `latin-ext` for Hungarian), no Google Fonts CDN, Tag Gateway
`/ry2s/` scripts, review-logo SVG CLS, `_headers` caching, which page types to test, and what
not to chase.

## Deploy, preview, observability

Open `references/deploy-and-preview.md` before a first deploy, a domain cutover, a preview
for a client, or when a 500 has no log. It covers the release order, preview noindex that
actually works (hostname-based, not `MODE`), Cloudflare Access for client review, Workers
Logs/Traces config, and when Sentry is worth it.

## Before release or PR review

`references/audit-checklist.md` is the short list we run before shipping: build/type/test,
secrets placement, image check, a11y (WCAG 2.2 AA, including 2.4.11 and 2.5.8), JSON-LD `<`
escaping, preview/noindex and live-route checks. It replaces the old `astro-audit` skill;
fixed Lighthouse or byte thresholds are deliberately not in it (put a budget in the project
`CLAUDE.md` if a client needs one).

## Keeping this skill current

Version numbers, defaults, limits and dates live only in `references/perishable-facts.md`,
each with a source link and a check date. Refresh them from the official docs or Context7
(`/withastro/docs`, `/llmstxt/developers_cloudflare_workers_llms-full_txt`,
`/tailwindlabs/tailwindcss.com`) when a
project moves to a new major, and at least every six months. If a fact there contradicts what
you see in a project's installed version, trust the installed version and update the file.
