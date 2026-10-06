# Perishable facts

Everything here can change with a release. Each line has its source and the date it was
checked. Review every six months, and whenever a project moves to a new major. If an
installed version disagrees, trust the installed version and update this file.

Last full check: **2026-10-06**.

## Versions (npm `latest`, checked 2026-10-06)

| Package | Version | Note |
|---|---|---|
| `astro` | 7.3.5 | depends on `vite ^8.0.13` (`npm view astro dependencies.vite`) |
| `@astrojs/cloudflare` | 14.3.3 | requires Astro 6+; Workers only, no Pages support |
| `tailwindcss` | 4.3.3 | CSS-first `@theme`, no `tailwind.config.*` needed |
| `wrangler` | 4.147.0 | `wrangler.jsonc` preferred for new projects |
| `vite` | 8.3.3 | Rolldown-based; Astro 6 used Vite 7 |

## Astro and the Cloudflare adapter

Source: https://docs.astro.build/en/guides/integrations-guide/cloudflare/ (checked 2026-10-06)

- `imageService` default is `'cloudflare-binding'` (changed from `'compile'` in Astro 6).
  `'compile'` = build-time processing on prerendered routes, passthrough on on-demand ones.
- `Astro.locals.runtime` removed in Astro 6. Env: `import { env } from 'cloudflare:workers'`;
  request metadata: `Astro.request.cf`; execution context: `Astro.locals.cfContext`.
- Wrangler `main` for the adapter: `@astrojs/cloudflare/entrypoints/server`.
- Session KV binding default name `SESSION`; rename with `sessionKVBindingName`.
- `prerenderEnvironment` default `'workerd'`; `'node'` if prerendering needs Node APIs.
- `_headers` in `public/` applies to static assets only, not Worker responses.

Source: https://docs.astro.build/en/reference/configuration-reference/ (Astro 7 docs, checked 2026-10-06)

- `build.inlineStylesheets`: `'always' | 'auto' | 'never'`, default `'auto'`.
- `image.responsiveStyles` default `false`; `image.layout` has no default.

Source: https://docs.astro.build/en/guides/fonts/ (checked 2026-10-06)

- Fonts API is stable; top-level `fonts` config; `<Font cssVariable preload />` from
  `astro:assets`; providers include `google`, `fontsource`, `local` and download/self-host
  the files; `subsets` option (e.g. `latin-ext`); automatic fallback metrics.

## Cloudflare Workers

Source: https://developers.cloudflare.com/workers/wrangler/configuration/ (checked 2026-10-06)

- `keep_vars` default `false`: deploy overwrites dashboard-set vars. Secrets are not deleted
  unless `wrangler secret delete`.
- `workers_dev` default `true` when no routes are configured; `preview_urls` defaults from
  `workers_dev` if never set.

Source: https://developers.cloudflare.com/workers/static-assets/headers/ (checked 2026-10-06)

- `_headers` is not applied to Worker-generated responses. Absolute-URL rules are
  supported (must start with `https`, no port). Documented example:
  `https://:version.:subdomain.workers.dev/*` → `X-Robots-Tag: noindex`.

Source: https://developers.cloudflare.com/workers/observability/logs/workers-logs/ (checked 2026-10-06)

- `observability.enabled` is on by default for newly created Workers.
  `head_sampling_rate` 0-1. Retention: 3 days (Free), 7 days (Paid). Free plan: 200,000
  log events per day.

Source: https://developers.cloudflare.com/workers/observability/traces/ (checked 2026-10-06)

- Automatic tracing is in early beta and off unless `observability.traces.enabled: true`.
  Traces count toward billable usage from **2026-12-01**; 7-day retention.

Source: https://developers.cloudflare.com/d1/platform/limits/ (checked 2026-10-06)

- Max 100 bound parameters per query; max SQL statement 100 KB; queries per Worker
  invocation: 50 (Free), 1,000 (Paid).

## Tailwind CSS

Source: https://tailwindcss.com/docs/theme (checked 2026-10-06)

- Only `@theme` variables generate utilities; namespaces `--color-*`, `--font-*`,
  `--text-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--breakpoint-*`.
- `--color-*: initial` removes the default palette. `@theme inline` when a value
  references another variable. Default palette is defined in `oklch()`.

## WCAG

Source: https://www.w3.org/TR/WCAG22/ (W3C Recommendation; current edition dated 2024-12-12, first published 2023-10-05; checked 2026-10-06)

- 2.4.11 Focus Not Obscured (Minimum), AA. 2.5.8 Target Size (Minimum), AA: 24×24 CSS px
  or equivalent spacing (size from the Understanding doc). 4.1.1 Parsing was removed in 2.2.

## Where to refresh

Context7: `/withastro/docs`, `/llmstxt/developers_cloudflare_workers_llms-full_txt`,
`/tailwindlabs/tailwindcss.com`. Or the URLs above.
