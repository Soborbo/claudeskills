# Perishable facts (dated)

Everything in this file can change without notice. Each line has the source and the
date it was last checked. Re-check every six months, or before quoting one to a client.
When a fact here changes, update the line here first, then any check or reference that
depends on it.

Last full review: **2026-10-06**.

| Fact | Source | Checked |
|---|---|---|
| The current Search Quality Rater Guidelines edition is dated **11 September 2025**. Deception about the site or its creators (fake authors, invented credentials) is in **§4.5.3** ("Deceptive Page Purpose, Deceptive Information about the Website, Deceptive Design"). Low-effort, unoriginal content is in §4.6.6; copied content in §4.6.7; scaled content abuse in §4.6.5. | https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf (PDF cover: "September 11, 2025") | 2026-10-06 |
| Google: "E-E-A-T itself isn't a specific ranking factor"; raters do not directly influence ranking. | https://developers.google.com/search/docs/fundamentals/creating-helpful-content (last updated 2026-10-05) | 2026-10-06 |
| **Google-Extended** has no user agent of its own. It is a robots.txt control token for Gemini training and grounding (Gemini Apps, Vertex AI). Google: it "does not impact a site's inclusion in Google Search nor is it used as a ranking signal in Google Search." The auditor therefore treats it as a training token (`warn`), never as a retrieval bot. | https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers (last updated 2026-07-14) | 2026-10-06 |
| Other AI bots: OpenAI GPTBot = training, OAI-SearchBot = search, ChatGPT-User = user fetch. Anthropic ClaudeBot = training, Claude-SearchBot = search, Claude-User = user fetch. Perplexity PerplexityBot = index, Perplexity-User = user fetch. | https://developers.openai.com/api/docs/bots · https://support.claude.com/en/articles/8896518 · https://docs.perplexity.ai/guides/bots | 2026-10-02 (review 06, L9) |
| **FAQ rich results** stopped appearing in Google Search on **7 May 2026** (notice added 8 May 2026; documentation removed 15 June 2026). HowTo rich results were removed in 2023. Neither is a reason to add markup. | https://developers.google.com/search/updates | 2026-10-06 |
| `llms.txt`: Google says it is not required for Search and does not help or hurt ranking (AI optimization guide note, 15 June 2026). No other vendor has confirmed official use. | https://developers.google.com/search/updates | 2026-10-06 |
| **UK DMCCA 2024**, Schedule 20 para 13: fake reviews, concealed incentivised reviews and misleading presentation of reviews are banned outright since **6 April 2025**. CMA fines up to 10% of global turnover. CMA208 §4.5: "encouraging just those who are satisfied to leave reviews" counts as cherry-picking. | https://assets.publishing.service.gov.uk/media/67eeb64fe9c76fa33048c790/CMA208_-_Fake_reviews_guidance.pdf (CMA208, 4 April 2025) | 2026-10-06 |
| Google review policy: no incentives for reviews, no discouraging negative reviews, no "selectively solicit positive reviews". Asking every customer for an honest review is allowed. | https://support.google.com/contributionpolicy/answer/7400114 | 2026-10-06 |
| **Ekertv. 4. §** (2001. évi CVIII. tv.) lists the details a Hungarian online service must publish "közvetlenül és folyamatosan, könnyen hozzáférhető módon": (a) név, (b) székhely/telephely, (c) elérhetőség, különösen e-mail, (d) nyilvántartó bíróság/hatóság + nyilvántartási szám, (e) engedély, ha engedélyköteles, (f) adószám, ha áfaalany, (g) kamara/szakképesítés szabályozott szakmánál, (h) tárhelyszolgáltató adatai. | https://net.jogtar.hu/jogszabaly?docid=a0100108.tv (hatályos: 2026.X.1.-től) | 2026-10-06 |
| Hungarian postcodes: Budapest 1011–1239 (1 + kerület 01–23 + digit), elsewhere 2000–9999. | Magyar Posta postcode list (structure); encoded in `markets.ts` | 2026-10-06 |
| Princeton GEO study (Aggarwal et al., KDD 2024): adding statistics, quotations and cited sources raised visibility in their generative-engine benchmark by up to ~40%; keyword stuffing did not help. A lab benchmark, not a measurement of live engines. | https://arxiv.org/abs/2311.09735 | 2026-10-06 (not re-measured) |
