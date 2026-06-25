---
name: eeat-signals
description: Audit and strengthen visible E-E-A-T signals and AI-search (GEO) readiness on Astro lead-gen sites. Use when a page or site needs Experience/Expertise/Authoritativeness/Trust signals, author credibility, first-hand-experience proof, trust pages (about/contact/privacy/returns), NAP + company registration display, review/trust-mark surfacing, AI-crawler access in robots.txt, or answer-first content for ChatGPT/Gemini/Perplexity/AI Overviews. Also triggers on "EEAT", "E-E-A-T", "GEO", "AEO", "AI search visibility", "get cited by AI", "trust signals", "author bio", "local trust", or making a small/niche business outrank larger competitors. Runs a deterministic auditor with runnable tests. Delegates JSON-LD generation to schema-entity-graph and JSON-LD validation to schema-audit; delegates copy voice to humanise-copy.
---

# E-E-A-T Signals — audit + strengthen (Astro)

Make a page **demonstrate** Experience, Expertise, Authoritativeness and Trust to
both humans and AI engines — and verify it with a runnable auditor. Trust is the
load-bearing pillar; first-hand Experience is the asymmetric edge a real operator
has over a larger competitor.

## Scope boundary (read before doing anything)

This skill owns the **human-visible + crawler-visible** signal layer. It does **not**:

- generate JSON-LD → that is **schema-entity-graph** (`schema-skill`);
- validate JSON-LD / `@id` wiring / rich-result eligibility → that is **schema-audit**;
- rewrite copy tone/voice → that is **humanise-copy**;
- do build/perf/a11y/Lighthouse → that is **astro-audit** (plug EEAT in as a compliance check).

See [BOUNDARIES.md](./BOUNDARIES.md) for the exact seams. When a signal also has a
schema form (author, reviews, sameAs, knowsAbout), check the **visible** side here
and leave the markup to the schema skills. Never duplicate their rules.

## The auditor (runnable)

```bash
npm install
npm test                 # 41 unit + integration tests
npm run audit -- --dir ./dist --market hu --robots ./dist/robots.txt
npm run audit -- --html ./dist/index.html --market uk
```

`--market` = `uk` | `hu` | `generic`. Exit code is **1** if any check is `fail`, else
`0`, so it can gate a deploy. The auditor only **reports** — it never edits the site.
Statuses: `pass` / `warn` / `fail` / `not_found` (not-applicable, non-blocking). Gaps
are surfaced as `observed_differences`, never as "opportunities".

## DO — signals to place (then verify)

- **Author**: visible named byline on articles + a bio with **specific** credentials
  (years in trade, dates, certifications, real numbers) — not adjectives. (`author.*`)
- **Experience**: first-hand proof — case study, before/after, captioned **own** photos,
  first-person job description, original data. The one thing a competitor can't fake.
- **Trust pages**: about, contact, privacy always; terms; **returns/refund/shipping**
  for product pages. (`trust-page.*`)
- **Business trust**: visible phone, postal address, and company registration
  (UK Companies House number / HU cégjegyzékszám + adószám), plus recognised
  trust-marks. (`business.*`)
- **GEO / AI**: answer-first opening (~40–360 chars) + numeric facts; allow AI
  **retrieval** crawlers in robots.txt. (`geo.*`, `ai-crawler.*`)

Full detail: [references/do-signals.md](./references/do-signals.md),
[references/ai-visibility.md](./references/ai-visibility.md).

## DON'T — forbidden (these fail the audit or the review)

- Fake authors, AI-generated headshots, invented credentials, exaggerated experience.
- Scaled/mass-generated content; paraphrase-only pages with no added first-hand value.
- Fake/incentivised reviews; **self-serving** review markup (defer detail to schema-audit).
- Fabricated stats/case studies; claims of expertise with nothing demonstrated.
- Blocking AI **retrieval** bots while expecting AI visibility.
- Speakable schema on a non-news site; schema that doesn't match visible content.

Full detail: [references/dont-forbidden.md](./references/dont-forbidden.md).

## Small business beats big competitor

Local + niche levels the field: genuine first-hand Experience, review velocity/recency,
narrow topical depth, and proprietary data beat a national brand's weak local execution.
Worked trapézlemez example: [references/local-and-small-beats-big.md](./references/local-and-small-beats-big.md).

## Market packs

- UK: Companies House number, Gas Safe / NICEIC / TrustMark / Checkatrade / FENSA /
  MCS / HETAS, UK directories. [references/market-uk.md](./references/market-uk.md).
- HU: cégjegyzékszám + adószám (validated, incl. adószám CDV checksum), Árukereső
  Megbízható Bolt, Cylex / Arany Oldalak; Hungarian-language AI is under-served =
  first-mover edge. [references/market-hu.md](./references/market-hu.md).

## Conflict precedence

EEAT is an **SEO-tier** concern. If a signal conflicts with Safety/Legal,
Accessibility, or Performance, those win (see the skills CONFLICT-MATRIX). Example:
don't ship heavy author-photo galleries that blow the LCP budget — optimise first.

## Workflow

1. Run `npm run audit` against the built site (or a page) with the right `--market`.
2. Fix every `fail`; weigh each `warn`; ignore `not_found`.
3. For any schema-expressed signal, hand off to schema-entity-graph / schema-audit.
4. Re-run until exit `0`. Then run `astro-audit` for the full pre-deploy gate.

## References

- [BOUNDARIES.md](./BOUNDARIES.md) — exact seams vs other skills
- [references/do-signals.md](./references/do-signals.md)
- [references/dont-forbidden.md](./references/dont-forbidden.md)
- [references/ai-visibility.md](./references/ai-visibility.md)
- [references/local-and-small-beats-big.md](./references/local-and-small-beats-big.md)
- [references/market-uk.md](./references/market-uk.md) · [references/market-hu.md](./references/market-hu.md)
