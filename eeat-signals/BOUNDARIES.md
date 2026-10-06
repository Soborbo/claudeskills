# Boundaries & conflict map

`eeat-signals` is deliberately scoped to the **visible + crawler-visible signal
layer** so it composes with the rest of the family instead of overlapping it.
This file is the contract.

## Active skills — seams

| Skill | Owns | eeat-signals does NOT | Hand-off |
|-------|------|------------------------|----------|
| **schema** | Building **and** validating the JSON-LD graph from the site config (LocalBusiness/Person/Service/Article, `@id`, sameAs, knowsAbout), rich-result eligibility, AggregateRating rules, FAQ/Speakable rules, GBP↔schema alignment. | Generate, emit, validate or lint any JSON-LD. We check the *visible* side of the same facts. | When a visible signal needs markup (author, reviews, registration, accreditations), pass the data to `schema`. Any schema finding is `schema`'s; we only assert the human-visible counterpart exists. |
| **humanize-copy** | Copy voice/tone — making text sound like a real owner. | Rewrite or score tone. Our only copy touch is a tiny credibility check (does the bio state a *specific* credential vs. an adjective). | If the bio reads as fluff, fixing the *wording* is humanize-copy; we just flag the missing specificity. |
| **soborbo-astro-cloudflare** | Pre-release checklist (`references/audit-checklist.md`): build, types, secrets placement, images, a11y, deploy surface. | Build/perf/a11y/security. | Run `npm run audit` from this kit alongside that checklist. |
| **soborbo-tracking** (in `Soborbo/Serverside`) | GTM/GA4/Ads/Meta CAPI tracking + consent. | Anything tracking/analytics. | None — orthogonal. |
| **seo-onpage** | Keyword placement and ownership, titles/meta, H1, URL, service/area page planning, internal linking, indexing controls (noindex, robots, hreflang). | Keywords, titles or internal links. The information-gain question is an E-E-A-T (Experience) test, not keyword work. | Keyword or internal-link findings go to `seo-onpage`. |
| **astro-forms-v3** | Form capture, validation, spam, delivery. | Forms. | Contact-page existence is an EEAT trust check; the form itself is astro-forms. |

## Archived skills this supersedes (in `old/`)

These older skills are deprecated; `eeat-signals` absorbs the still-valid parts of
their **signal layer** and modernises the guidance:

- **old/llm-optimization** — superseded. Its only durably useful, testable artifact
  (allow AI crawlers in robots.txt) is reimplemented in `crawlers.ts`, modernised:
  retrieval-bot blocking now `fail`, training-bot blocking `warn`. Google-Extended is a
  training/grounding token, so it is in the `warn` group. Its Speakable-on-
  every-page and FAQ-as-AI-shortcut advice is explicitly rejected (see
  references/dont-forbidden.md), matching `schema`.
- **old/local-seo** — the on-page/local **trust** signals (NAP, registration, reviews,
  GBP completeness as a signal) live here, plus its direct review link, request
  templates and GBP-link UTM (references/reviews.md, without the invented response-rate
  figures and without the "if you were happy" gating wording). Map-pack ranking
  mechanics, category hacking, Q&A seeding and geotags are not revived.
- **old/astro-blog** — the information-gain question and the `experienceVerified` flag
  (now the `experience.verified` check) live here.
- **old/social-proof** — review *surfacing as a trust signal* is covered here; review
  *schema* is `schema`.
- **old/competitor-analysis**, **old/schema-patterns** — not revived by this kit.

## The one-line rule

> If it changes **markup**, it's a schema skill. If it changes **wording**, it's
> humanize-copy. If it changes **whether a human or an AI crawler can SEE the
> trust/experience signal at all**, it's this skill.

## Overlap risk register (where to be careful)

- **Author / Person** appears in `schema` *and* here. Split: `schema`
  checks the `Person` `@id`/`hasOccupation`/`sameAs`; we check the **visible byline +
  bio specificity**. No shared assertions.
- **Reviews / AggregateRating**: `schema` owns numbers-match-reality and self-
  serving-markup. We only check that recognised review/trust-mark signals are
  **surfaced on the page** (`business.accreditations`). 
- **FAQ / Speakable**: owned by `schema`. We do not check FAQ markup; we only
  reward an answer-first, fact-dense opening (`geo.answer-first`).
- **robots.txt**: classic crawl/index directives are `seo-onpage`'s; we
  only assert **AI-bot** access. Different user-agents, no collision.
