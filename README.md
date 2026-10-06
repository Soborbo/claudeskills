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
| [`astro-forms-v3`](./astro-forms-v3) | Form infrastructure: contact/booking/quote forms, Zod validation, email delivery (Resend/Brevo), rate limiting, Sheets, spam protection. |
| [`soborbo-astro-cloudflare`](./soborbo-astro-cloudflare) | Production-learned pitfalls and conventions for Astro on Cloudflare Workers: deploy/secrets, build-time image pipeline (points to leadgen-template-site), siteConfig → Tailwind 4 `@theme` tokens, fonts, preview noindex, observability, pre-release checklist. Use with the official `wrangler` / `workers-best-practices` / `web-perf` skills. Replaces `deployment`, `astro-performance`, `astro-audit`, `design-tokens`, `astro-images` (removed 2026-10). |
| [`schema-skill`](./schema-skill) | Build/assemble a complete Schema.org entity graph (JSON-LD) for Astro lead-gen sites, driven from `siteConfig`. |
| [`eeat-kit`](./eeat-kit) | Audit and strengthen visible E-E-A-T signals and AI-search (GEO) readiness. |
| [`error-pipeline`](./error-pipeline) | Per-site client tracker + Astro endpoint for the centralised error-pipeline workers (client JS errors via sendBeacon + server exceptions). |
| [`humanise-copy-skill.md`](./humanise-copy-skill.md) | Transform AI-sounding copy into human, business-owner voice (UK local service pages). |
| [`leadgen-starter-build`](./leadgen-starter-build) | Starter Astro lead-gen project scaffold. |

## Archive

[`old/`](./old) holds an extensive archive of earlier/experimental skills (blog
pipeline, SEO, i18n, components, etc.), kept for reference. Prefer the top-level
skills above for current work.
