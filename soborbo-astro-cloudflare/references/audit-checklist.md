# Before release or PR review

Not a ceremony: run what applies to the change, and say what you skipped. Thresholds
(Lighthouse scores, byte budgets) are project decisions and live in the project
`CLAUDE.md`, not here.

## Build and code

- `npx astro check && npm test && npm run build` pass from a clean install (`npm ci`).
- `npm audit --audit-level=high`; fix or note each finding.
- API routes: env from `cloudflare:workers`, top-level `try/catch` with a structured log.
- No `siteConfig.example`/sample import in production code; no leftover template
  placeholders (`replace-with-...`, `GTM-XXXXXXX`, `REPLACE_WITH_...`).
- D1 queries that bind arrays are chunked (≤ ~90 parameters).

## Secrets

- Secret **values** are not in the repo, `wrangler` config or the build env; only
  `PUBLIC_*` in the build env. Variable **names** such as `env.RESEND_API_KEY` in code are
  fine; a scan that flags names is noise.
- `.dev.vars` is gitignored and not tracked: `git ls-files .dev.vars` prints nothing.
- For the actual scan use GitHub secret scanning or gitleaks rather than hand-written
  greps.

## Images

The post-build image check from `images.md` passes (files exist, width/height, alt, size,
hero not lazy), and `check-og-images` passes.

## Accessibility (WCAG 2.2 AA)

The `design:accessibility-review` skill covers the general audit, but it is written for
WCAG 2.1; add the 2.2 criteria our layouts actually trip:

- **2.4.11 Focus Not Obscured (Minimum):** a focused element must not be fully hidden by the
  sticky header, the mobile CTA bar or the cookie banner. Tab through a page with them
  visible; fix with `scroll-padding-top` (header height) and by not covering the focus.
- **2.5.8 Target Size (Minimum):** pointer targets at least 24×24 CSS px, or spaced so a
  24px circle around each does not overlap another target. Watch footer link lists,
  carousel dots, close buttons, star ratings and inline icon buttons.
- Contrast of the generated colour pairs (`design-tokens.md`, the contrast trap).
- Keyboard: every form and the calculator usable without a mouse; skip link present.

## SEO and structured data

- JSON-LD is serialised with `<` escaped, otherwise a `</script>` inside any string (a
  review, a FAQ answer) breaks out of the script tag:
  ```astro
  <script type="application/ld+json" set:html={JSON.stringify(schema).replace(/</g, '\\u003c')} />
  ```
  Content and correctness of the graph belong to the schema skill.
- Count-up numbers show the final value in the server HTML.
- `robots.txt` does not block `/_astro/` or image dirs; the sitemap leaves out noindex pages.

## Deploy surface

- Preview/`workers.dev` hosts send `X-Robots-Tag: noindex` (check with
  `curl -sI https://<preview-host>/ | grep -i x-robots`), or are switched off.
- Live: each SSR route opens in a real browser; no other Worker owns routes on the
  hostname; `observability.enabled` is in the config; no `error-notifier` tail consumer
  on a site you just touched.
- Test the page types listed in `performance.md`, on mobile.
