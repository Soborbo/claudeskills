# DON'T — forbidden signals & anti-patterns

Doing any of these triggers a `fail` in the auditor or a hard stop in human review.
The line Google draws is **unhelpful/scaled output and fabricated trust** — not the
tool used to make content.

## Fake E-E-A-T (Lowest-rating triggers, QRG Jan 2025 §4.5.3)
- Invented author identities; AI-generated author headshots; fabricated credentials.
- Exaggerated or overstated experience/expertise — even if not wholly fake.
- Claiming expertise the page does not actually demonstrate.

## Scaled / unhelpful content
- Mass-produced pages (AI, human, or hybrid) made primarily for search — "scaled
  content abuse". Don't publish at machine speed.
- Paraphrase-only pages that restate sources with no added first-hand value (QRG 4.6.6/7).
- Thin or near-duplicate location pages (doorway pages).

## Review & trust-mark abuse
- Fake, incentivised, or gated reviews.
- **Self-serving** review/AggregateRating markup (a business marking up reviews about
  itself) — ineligible for rich results since Sep 2019 and a manual-action risk.
  (Detection/validation of this is **schema-audit's** job; don't add it as a "win".)

## Fabrication
- Invented statistics, fake case studies, made-up test results, citing summaries of
  summaries. If it can't be verified, omit it.

## Schema misuse (owned by schema-audit — do not reintroduce)
- **Speakable** schema on a non-news site → remove.
- Markup that doesn't match visible page content.
- FAQ markup treated as an AI shortcut or a SERP-appearance lever — FAQ rich results
  were removed; keep FAQ only where genuine visible Q&A exists.

## AI-visibility self-sabotage
- Blocking AI **retrieval** crawlers in robots.txt while expecting AI citations.
- JS-only rendering of primary content (Astro SSG avoids this — keep it that way).
- Keyword stuffing / meta-manipulation: negative-EV in classic search **and** in the
  Princeton GEO study.

## Conflict reminder
EEAT is SEO-tier. Never sacrifice Safety/Legal, Accessibility, or Performance to add a
trust signal (e.g., un-optimised hero/author imagery that breaks the LCP budget).
