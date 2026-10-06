# AI search / LLM visibility (GEO / AEO)

How ChatGPT, Gemini/AI Overviews, Perplexity and Claude select and cite sources — and
what a small business can actually do about it. This is the off-page complement to the
on-page checks; the auditor covers the parts that live in your own HTML/robots.

## What plausibly moves AI citations

Most published "AI visibility" numbers are vendor studies or unsourced. Treat the points
below as working assumptions, not measured facts. Dated sources:
[perishable-facts.md](./perishable-facts.md).

- **Being talked about elsewhere.** AI answers draw heavily on third-party pages:
  forums, review platforms, directories, press (in HU: Árukereső, gyakorikérdések).
  Getting genuinely mentioned there matters more than on-site tweaks.
- **Statistics, quotations, cited sources.** The Princeton GEO study (KDD 2024) found
  these raised visibility by up to ~40% in its benchmark, and keyword stuffing did not
  help. It is a lab benchmark, not a measurement of live engines.
- **Google:** AI Overviews and AI Mode use the normal Search index and Googlebot. No
  special markup or file (llms.txt) is needed for them.

## On-page (what the auditor checks)
- **Answer-first**: the first ~40–360 chars directly answer the page's core question.
- **Fact density**: specific numbers, dates, named quotes throughout (`geo.answer-first`).
- **Self-contained passages**: each section readable out of context (AI lifts chunks).
- **Clean semantic HTML + SSR/SSG** (Astro default) so crawlers get full content.

## robots.txt policy (the testable lever — `ai-crawler.*`)
- **Allow retrieval bots** if you want AI visibility: OAI-SearchBot, ChatGPT-User,
  PerplexityBot, Perplexity-User, Claude-SearchBot, Claude-User.
  Blocking any of these = `fail`.
- **Training bots and tokens** (GPTBot, ClaudeBot, CCBot, Applebot-Extended,
  Google-Extended): allow for long-term brand familiarity, or block as a deliberate
  policy choice = `warn`, not `fail`. It is the site owner's call.
- **Google-Extended is not a search crawler.** It is a robots.txt token for Gemini
  training and grounding. Blocking it does not remove the site from Google Search or AI
  Overviews (those follow Googlebot and snippet controls such as `nosnippet`).
- Keep admin/checkout/account paths blocked for everyone. Note Perplexity-User and some
  bots have ignored robots.txt — Cloudflare WAF is the real enforcement layer.
- `llms.txt`: Google says it neither helps nor hurts Search; no other engine has
  confirmed using it. Optional, low priority.

## Off-page playbook (not auto-testable — do it anyway)
1. Earn unlinked brand mentions: relevant directories, genuine forum/Reddit/gyakori
   participation, supplier listings, local/industry PR.
2. Publish proprietary data others will cite, when you genuinely have it.
3. Keep entity identity consistent so engines resolve "who you are" confidently
   (the schema side is the `schema` skill).
4. Benchmark: test 10–20 buyer-intent prompts across engines; track citation frequency
   before/after. If on-page is done but citations stay flat, shift effort off-page.
