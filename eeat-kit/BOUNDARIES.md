# Boundaries & conflict map

`eeat-signals` is deliberately scoped to the **visible + crawler-visible signal
layer** so it composes with the rest of the family instead of overlapping it.
This file is the contract.

## Active skills — seams

| Skill | Owns | eeat-signals does NOT | Hand-off |
|-------|------|------------------------|----------|
| **schema-entity-graph** (`schema-skill`) | Building the JSON-LD graph from `siteConfig` (Organization/LocalBusiness/Person/Service/Product, `@id`, sameAs, knowsAbout, AggregateRating). | Generate or emit any JSON-LD. | When a visible signal needs markup (author, reviews, registration, accreditations), pass the data to this skill. |
| **schema-audit** | Validating JSON-LD: `@id` resolution, duplicate entities, rich-result status, AggregateRating correctness, FAQ/Speakable rules, GBP↔schema alignment. | Validate or lint JSON-LD. We check the *visible* side of the same facts. | Any schema FAIL/WARN is schema-audit's; we only assert the human-visible counterpart exists. |
| **humanise-copy** | Copy voice/tone — making text sound like a real owner. | Rewrite or score tone. Our only copy touch is a tiny credibility check (does the bio state a *specific* credential vs. an adjective). | If the bio reads as fluff, fixing the *wording* is humanise-copy; we just flag the missing specificity. |
| **astro-audit** | Pre-deploy gate: build, TypeScript, Lighthouse perf/a11y, security, deps, forms. Has a "Skill Compliance" section. | Build/perf/a11y/security. | Register `npm run audit` from this kit as an EEAT compliance step inside astro-audit. |
| **tracking-kit** | GTM/GA4/Ads/Meta CAPI tracking + consent. | Anything tracking/analytics. | None — orthogonal. |
| **astro-forms-v3** | Form capture, validation, spam, delivery. | Forms. | Contact-page existence is an EEAT trust check; the form itself is astro-forms. |

## Archived skills this supersedes (in `old/`)

These older skills are deprecated; `eeat-signals` absorbs the still-valid parts of
their **signal layer** and modernises the guidance:

- **old/llm-optimization** — superseded. Its only durably useful, testable artifact
  (allow AI crawlers in robots.txt) is reimplemented in `crawlers.ts`, modernised:
  retrieval-bot blocking now `fail`, training-bot blocking `warn`. Its Speakable-on-
  every-page and FAQ-as-AI-shortcut advice is explicitly rejected (see
  references/dont-forbidden.md), matching schema-audit.
- **old/local-seo** — the on-page/local **trust** signals (NAP, registration, reviews,
  GBP completeness as a signal) live here; map-pack ranking mechanics are out of scope.
- **old/social-proof** — review *surfacing as a trust signal* is covered here; review
  *schema* is schema-entity-graph/schema-audit.
- **old/competitor-analysis**, **old/schema-patterns** — not revived by this kit.

## The one-line rule

> If it changes **markup**, it's a schema skill. If it changes **wording**, it's
> humanise-copy. If it changes **whether a human or an AI crawler can SEE the
> trust/experience signal at all**, it's this skill.

## Overlap risk register (where to be careful)

- **Author / Person** appears in schema-audit (W3/W4) *and* here. Split: schema-audit
  checks the `Person` `@id`/`hasOccupation`/`sameAs`; we check the **visible byline +
  bio specificity**. No shared assertions.
- **Reviews / AggregateRating**: schema-audit owns numbers-match-reality and self-
  serving-markup. We only check that recognised review/trust-mark signals are
  **surfaced on the page** (`business.accreditations`). 
- **FAQ / Speakable**: owned by schema-audit. We do not check FAQ markup; we only
  reward an answer-first, fact-dense opening (`geo.answer-first`).
- **robots.txt**: classic crawl/index directives are astro-audit/schema-audit's; we
  only assert **AI-bot** access. Different user-agents, no collision.
