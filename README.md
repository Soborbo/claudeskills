# Claude Skills

A collection of skills for building, optimizing, and operating Astro.js lead-gen
sites on Cloudflare Workers. Each top-level directory with a `SKILL.md` is a skill.

## Tracking & analytics

| Skill | Status | What it does |
|---|---|---|
| [`soborbo-tracking`](./soborbo-tracking) | ➡️ **Moved to Serverside** | The canonical lead-gen tracking package (Astro client lib + event-gateway onboarding) was **consolidated INTO the engine repo** on 2026-07-21: `github.com/Soborbo/Serverside` → `soborbo-tracking/`. One repo, one `src/events.json`, no vendored copy. This directory is a pointer stub only. |
| [`tracking`](./tracking) | ⛔ **Deprecated** → `soborbo-tracking` (in Serverside) | Legacy Meta-only `/api/track` version. Kept for reference only. |
| [`tracking-kit`](./tracking-kit) | ⛔ **Deprecated** → `soborbo-tracking` (in Serverside) | Older kit with in-app Meta CAPI + GA4 MP routes (obsolete — the server is now the event-gateway worker). |
| [`old/analytics-measurement`](./old/analytics-measurement) | ⛔ **Deprecated** → `soborbo-tracking` (in Serverside) | Legacy analytics skill, kept for reference only. |

> **For all new GA4 + Meta + Google Ads tracking work, use the `soborbo-tracking`
> package in `github.com/Soborbo/Serverside` (`soborbo-tracking/`).** It moved out of
> this repo on 2026-07-21; the stub here just points there. The three deprecated
> skills above are superseded by it and remain only for migration reference.

## Astro site skills

| Skill | What it does |
|---|---|
| [`astro-audit`](./astro-audit) | Full pre-deploy code audit: build, deps, performance, security, a11y, SEO, browser compat, form testing. |
| [`astro-forms-v3`](./astro-forms-v3) | Form infrastructure: contact/booking/quote forms, Zod validation, email delivery (Resend/Brevo), rate limiting, Sheets, spam protection. |
| [`astro-images`](./astro-images) | Width-based responsive images: build-time processing, per-format quality (AVIF/WebP/JPG/PNG), art direction, OG generation, image SEO. |
| [`astro-performance`](./astro-performance) | Core Web Vitals tuning: LCP preloading, font strategy, critical path, third-party scripts, Cloudflare Tag Gateway. |
| [`deployment`](./deployment) | Deployment workflow for Astro on Cloudflare Workers + GitHub: wrangler config, build failures, 500s, preview deployments. |
| [`design-tokens`](./design-tokens) | Design-system foundation: color scales, typography, spacing from `siteConfig`. No raw values in components. |
| [`schema-skill`](./schema-skill) | Build/assemble a complete Schema.org entity graph (JSON-LD) for Astro lead-gen sites, driven from `siteConfig`. |
| [`eeat-kit`](./eeat-kit) | Audit and strengthen visible E-E-A-T signals and AI-search (GEO) readiness. |
| [`error-pipeline`](./error-pipeline) | Per-site client tracker + Astro endpoint for the centralised error-pipeline workers (client JS errors via sendBeacon + server exceptions). |
| [`humanize-copy-uk`](./humanize-copy-uk) | Write or review English (UK) customer-facing copy so it reads like the owner wrote it: only real facts, British English, no AI tells or dashes, superlatives and reviews only with evidence (CAP Code, DMCCA). |
| [`humanize-copy-hu`](./humanize-copy-hu) | The same for Hungarian customer copy: formal "Ön" address, natural Hungarian, Hungarian AI tells and calques, AkH 12 typography with László's house rules, Fttv. |
| [`leadgen-starter-build`](./leadgen-starter-build) | Starter Astro lead-gen project scaffold. |

## Archive

[`old/`](./old) holds an extensive archive of earlier/experimental skills (blog
pipeline, SEO, i18n, components, etc.), kept for reference. Prefer the top-level
skills above for current work.
