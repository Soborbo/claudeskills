# AI search / LLM visibility (GEO / AEO)

How ChatGPT, Gemini/AI Overviews, Perplexity and Claude select and cite sources — and
what a small business can actually do about it. This is the off-page complement to the
on-page checks; the auditor covers the parts that live in your own HTML/robots.

## What actually moves AI citations (evidence-backed)
- **Brand mentions / "share of model"** is the strongest measured predictor. AI systems
  weight **unlinked** brand mentions across forums, reviews and communities. Being
  *talked about* beats on-site optimisation.
- **Third-party domains dominate**: ~85% of brand mentions in AI answers come from
  external domains, not your own site. Prioritise getting referenced elsewhere.
- **Sources LLMs lean on**: Reddit, Wikipedia, YouTube, LinkedIn, major press, and
  review aggregators (G2/Trustpilot-style; in HU: Árukereső, gyakorikérdések). ChatGPT
  skews Wikipedia; Google AI skews Reddit/YouTube; Perplexity skews Reddit/LinkedIn.
- **Princeton GEO study (KDD 2024)**: adding **statistics** and **direct quotations**,
  citing authoritative sources, and fluent/authoritative phrasing raised visibility
  ~30–40% on their metrics; **keyword stuffing hurt**. Lower-ranked pages gained the
  most (up to +115%) — structure and fact-density let small sites punch above rank.
- Word count is ~uncorrelated with citation; many AI-cited pages are <1,000 words.

## On-page (what the auditor checks)
- **Answer-first**: the first ~40–360 chars directly answer the page's core question.
- **Fact density**: specific numbers, dates, named quotes throughout (`geo.answer-first`).
- **Self-contained passages**: each section readable out of context (AI lifts chunks).
- **Clean semantic HTML + SSR/SSG** (Astro default) so crawlers get full content.

## robots.txt policy (the testable lever — `ai-crawler.*`)
- **Allow retrieval bots** if you want AI visibility: OAI-SearchBot, ChatGPT-User,
  PerplexityBot, Perplexity-User, Claude-SearchBot, Claude-User, Google-Extended.
  Blocking any of these = `fail`.
- **Training bots** (GPTBot, ClaudeBot, CCBot, Applebot-Extended): allow for long-term
  brand familiarity, or block as a deliberate policy choice = `warn`, not `fail`.
- Keep admin/checkout/account paths blocked for everyone. Note Perplexity-User and some
  bots have ignored robots.txt — Cloudflare WAF is the real enforcement layer.
- `llms.txt`: low cost, no strong evidence it changes retrieval in 2026 — optional.

## Off-page playbook (not auto-testable — do it anyway)
1. Earn unlinked brand mentions: relevant directories, genuine forum/Reddit/gyakori
   participation, supplier listings, local/industry PR.
2. Publish ≥1 piece of proprietary data others will cite.
3. Keep entity identity consistent so engines resolve "who you are" confidently
   (the schema side is schema-entity-graph/schema-audit).
4. Benchmark: test 10–20 buyer-intent prompts across engines; track citation frequency
   before/after. If on-page is done but citations stay flat, shift effort off-page.
