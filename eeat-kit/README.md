# eeat-kit — E-E-A-T signals auditor (Astro lead-gen)

A **standalone, test-backed** skill that audits the **visible** and **crawler-visible**
E-E-A-T signals on a built site, and the AI-search (GEO) readiness that lives in your
own HTML/robots. Schema generation and validation are intentionally **not** here — they
belong to `schema-entity-graph` and `schema-audit`. See [BOUNDARIES.md](./BOUNDARIES.md).

## Why it exists
E-E-A-T is not a ranking dial — it's the quality framework Google's systems approximate
via measurable signals, with **Trust** the load-bearing pillar and first-hand
**Experience** the asymmetric edge a real operator has over a bigger competitor. The
same signals that win local SEO also win AI citations. This kit turns "did we actually
put those signals on the page?" into a deterministic check with an exit code.

## Install & run
```bash
npm install
npm test                       # 41 unit + integration tests (vitest)
npm run typecheck              # tsc, strict
npm run test:security          # forbidden-pattern scanner
npm run audit -- --dir ./dist --market hu --robots ./dist/robots.txt
npm run audit -- --html ./dist/index.html --market uk
```
`--market` = `uk` | `hu` | `generic`. Exit code **1** if any check is `fail`, else `0`.
The auditor **reports only** — it never edits your site.

## Statuses
`pass` · `warn` (present-but-weak / recommended-missing) · `fail` (required missing or a
forbidden pattern) · `not_found` (not applicable — informational). Gaps are reported as
`observed_differences`, never "opportunities".

## Check catalogue
| Area | Check IDs | Severity of a miss |
|------|-----------|--------------------|
| Author | `author.visible-byline`, `author.bio-credentials` | fail on article / warn |
| Experience | `experience.first-hand` | warn on service/product |
| Trust pages | `trust-page.{about,contact,privacy,terms,returns}` | fail (about/contact/privacy/returns) / warn (terms) |
| Business trust | `business.{phone,address,registration,accreditations}` | warn / not_found |
| GEO | `geo.answer-first` | warn |
| AI crawlers | `ai-crawler.retrieval.*` (fail), `ai-crawler.training.*` (warn) | fail / warn |

## Layout
```
eeat-kit/
├── SKILL.md            # Claude Code skill (≤130 lines)
├── BOUNDARIES.md       # conflict/coordination map vs the family
├── src/eeat/           # auditor library (types, dom, checks, crawlers, markets, audit)
├── scripts/eeat-audit.ts   # CLI (tsx)
├── tests/{unit,integration,security,fixtures}/
├── references/         # DO / DON'T / AI / local / market-uk / market-hu
└── ci/eeat-kit-tests.yml   # copy into .github/workflows/
```

## Integrate
- Drop the folder into a project; `npm run audit` against `dist/` after build.
- Register it as an EEAT compliance step inside **astro-audit**'s pre-deploy gate.
- For any schema-expressed signal, hand off to **schema-entity-graph** (build) and
  **schema-audit** (validate). For copy tone, hand off to **humanise-copy**.

## Tests
`npm test` runs deterministic unit tests for every check plus an integration pass over a
**strong** fixture (0 fails) and a **weak** fixture (specific fails). CI workflow:
`ci/eeat-kit-tests.yml`.
