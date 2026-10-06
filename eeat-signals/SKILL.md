---
name: eeat-signals
description: Audit and strengthen the visible trust and E-E-A-T signals on Soborbo's Astro lead-gen sites (UK and Hungarian) - named authors with real credentials, first-hand evidence, company registration and legally required business details (HU impresszum, Ekertv. 4. §), trust pages, honestly requested and displayed reviews, and AI-crawler access in robots.txt. Runs a deterministic auditor (npm run audit) that can gate a deploy. Use for E-E-A-T, trust signals, author bios, review requests, impresszum, or AI-bot robots.txt questions. Not for JSON-LD or schema markup, on-page keyword placement or titles, or copywriting and tone.
---

# E-E-A-T Signals — audit + strengthen (Astro)

Make a page **demonstrate** Experience, Expertise, Authoritativeness and Trust to
both humans and AI engines — and verify it with a runnable auditor. Trust is the
load-bearing pillar; first-hand Experience is the asymmetric edge a real operator
has over a larger competitor.

## Scope boundary (read before doing anything)

This skill owns the **human-visible + crawler-visible** signal layer. It does **not**:

- generate or validate JSON-LD / `@id` wiring / rich-result eligibility → that is **schema**;
- place keywords, write titles/meta, plan pages or internal links → that is **seo-onpage**;
- rewrite copy tone/voice → that is **humanize-copy**;
- do build/perf/a11y/Lighthouse → that is **soborbo-astro-cloudflare** (its audit checklist) and **web-perf**.

See [BOUNDARIES.md](./BOUNDARIES.md) for the exact seams. When a signal also has a
schema form (author, reviews, sameAs, knowsAbout), check the **visible** side here
and leave the markup to `schema`. Never duplicate their rules.

## The auditor (runnable)

```bash
npm install
npm test                 # unit + integration tests
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
  Before writing, ask what the page adds that the top 10 results don't (information
  gain). Unverified case data (`data-experience-verified="false"`, `[PLACEHOLDER]`) fails
  the audit (`experience.verified`), because AI drafts invent plausible numbers.
- **Trust pages**: about, contact, privacy always; terms; **returns/refund/shipping**
  for product pages. (`trust-page.*`)
- **Business trust**: visible phone, postal address, and company registration
  (UK Companies House number / HU cégjegyzékszám + adószám), plus recognised
  trust-marks. (`business.*`)
- **HU impresszum**: the Ekertv. 4. § details are a legal duty, so a missing field on
  the impresszum page is a `fail`; a page without an impresszum link is a `warn`.
  (`business.impresszum*`, see market-hu.md)
- **Reviews**: ask every customer, with a direct review link; never gate, reward or
  write them. In the UK fake and cherry-picked reviews are banned outright under the
  DMCCA 2024. Templates and the rules: [references/reviews.md](./references/reviews.md).
- **GEO / AI**: answer-first opening (~40–360 chars) + numeric facts; allow AI
  **retrieval** crawlers in robots.txt. (`geo.*`, `ai-crawler.*`) Training bots and the
  Google-Extended token only `warn` when blocked: Google-Extended is a Gemini
  training/grounding switch, not a search crawler, so blocking it is the owner's call.

Full detail: [references/do-signals.md](./references/do-signals.md),
[references/ai-visibility.md](./references/ai-visibility.md).

## DON'T — forbidden (these fail the audit or the review)

- Fake authors, AI-generated headshots, invented credentials, exaggerated experience.
- Scaled/mass-generated content; paraphrase-only pages with no added first-hand value.
- Fake, incentivised or gated reviews; GBP Q&A seeding; **self-serving** review markup
  (defer detail to `schema`).
- Fabricated stats/case studies; claims of expertise with nothing demonstrated.
- Blocking AI **retrieval** bots while expecting AI visibility.
- Speakable schema on a non-news site; schema that doesn't match visible content.
  Nothing here requires FAQ, HowTo or Speakable markup (FAQ rich results are gone).

Full detail: [references/dont-forbidden.md](./references/dont-forbidden.md).

## Small business beats big competitor

Local + niche levels the field: genuine first-hand Experience, review velocity/recency,
narrow topical depth, and proprietary data beat a national brand's weak local execution.
Worked trapézlemez example: [references/local-and-small-beats-big.md](./references/local-and-small-beats-big.md).
Open it when planning how a small client competes locally.

## Market packs

- UK: Companies House number, Gas Safe / NICEIC / TrustMark / Checkatrade / FENSA /
  MCS / HETAS, UK directories. [references/market-uk.md](./references/market-uk.md).
- HU: cégjegyzékszám + adószám (validated, incl. adószám CDV checksum), postcode +
  town address, Ekertv. 4. § impresszum, Árukereső Megbízható Bolt, Cylex / Arany
  Oldalak. [references/market-hu.md](./references/market-hu.md).

## Conflict precedence

EEAT is an **SEO-tier** concern. If a signal conflicts with Safety/Legal,
Accessibility, or Performance, those win (see the skills CONFLICT-MATRIX). Example:
don't ship heavy author-photo galleries that blow the LCP budget — optimise first.

## Workflow

1. Run `npm run audit` against the built site (or a page) with the right `--market`.
2. Fix every `fail`; weigh each `warn`; ignore `not_found`.
3. For any schema-expressed signal, hand off to `schema`.
4. Re-run until exit `0`. Then run the pre-release checklist of `soborbo-astro-cloudflare`.

## References

- [BOUNDARIES.md](./BOUNDARIES.md) — exact seams vs other skills
- [references/do-signals.md](./references/do-signals.md)
- [references/dont-forbidden.md](./references/dont-forbidden.md)
- [references/ai-visibility.md](./references/ai-visibility.md)
- [references/local-and-small-beats-big.md](./references/local-and-small-beats-big.md)
- [references/market-uk.md](./references/market-uk.md) · [references/market-hu.md](./references/market-hu.md)
- [references/reviews.md](./references/reviews.md) — review requests, direct link, GBP UTM, DMCCA
- [references/perishable-facts.md](./references/perishable-facts.md) — dated Google/legal
  facts (QRG edition, Google-Extended, FAQ removal, DMCCA, Ekertv.). Check it before
  quoting any of them; Google rules change, so refresh from
  https://developers.google.com/search/updates when it is more than six months old.
