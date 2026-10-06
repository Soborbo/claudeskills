---
name: seo-onpage
description: On-page SEO rules for Soborbo's UK and Hungarian local-service and lead-gen sites - one target keyword per page and where it must appear (title, URL slug, H1, first sentence, meta description), the title formula, keyword ownership across the site to stop cannibalisation, service and area pages tied to the Google Business Profile, internal linking, server-rendered indexable content and indexing controls (noindex, preview, hreflang). Use when planning a site's page/keyword map, writing or reviewing a page's title, meta description, H1, URL or internal links, building service or area pages, or diagnosing why a page underperforms in Search Console. Not for JSON-LD or structured data (schema skill), wording, tone or making copy sound human (humanize-copy), trust and authorship signals, reviews or AI-search readiness (eeat-signals), or Core Web Vitals and deploys (soborbo-astro-cloudflare).
---

# On-page SEO

These are László's own on-page rules, written down because they were repeated across
projects (Painless Removals, trapezlemezes.hu, Nemes Ventilátorház, olcsokontenerhaz.hu) and
because sites rebuilt with Claude lost rankings when the rules were skipped. The skill
covers what goes on a page and how pages relate to each other. Everything Google-specific
that can change (how titles are shown, spam policies) lives in
`references/perishable-facts.md` with the date it was checked.

| Need | Open |
|---|---|
| Which page owns which keyword, cannibalisation | `references/keyword-ownership.md` |
| Service list, GBP, area/city pages | `references/area-pages.md` |
| Internal links, orphan pages, blog and calculator links | `references/internal-linking.md` |
| Google rules with dates and links | `references/perishable-facts.md` |

## First, look at the project

- **Is there a keyword map?** Look for a keyword-ownership table in the repo (`docs/`,
  `SEO*.md`, project `CLAUDE.md`) or in the project memory. If one exists, it wins over
  anything you would pick yourself. If it does not, build it before writing pages.
- **What does Search Console say?** Queries and pages with impressions show what Google
  already associates with each URL. A page that ranks 8-20 for its target is a better bet
  than a new page.
- **What is the rendering mode?** In Astro: `output` in `astro.config.mjs` and
  `prerender` per page. On UNAS or WordPress, check the raw HTML (`curl`), not the browser.
- **Is this a migration?** If old URLs exist, get the old URL list and titles first
  (WP dump, sitemap, GSC pages report). See "Never rename a live URL" below.

## Keyword data: measure, do not guess

The old keyword-research skill picked keywords without search volume. Do not repeat that.
When a number is needed, take it from a tool and say which tool and when:

1. **Google Search Console** (the GSC connector) first: real queries, impressions,
   position and the page Google shows for each query. Best source for existing sites and
   for spotting cannibalisation.
2. **Ubersuggest** for volume and keyword ideas. Location: Hungary `locId 2348`, `hu`;
   UK `locId 2826`, `en`. Send at most about three seed keywords per call; larger
   batches have failed.
3. **Google Ads** (the Ads MCP or Keyword Planner) when a campaign account exists; its
   ranges and the search-terms report show real demand, including long tail that the
   planners undercount.

If none of these is available, say so and list the candidate keywords without numbers.
An invented volume is worse than none: it decides which page gets built.

Searcher wording beats brand wording. Example from the Hungarian hoarder project: the
brand angle ("gyűjtögető") had no measurable demand; the real searches were trigger
events ("lakáskiürítés", "lomtalanítás"). Target the trigger, use the angle in the copy.

## One keyword, one page

Each indexable page targets **one** primary keyword, and each primary keyword belongs to
**one** page. Two pages aimed at the same query split clicks and links, and Google
alternates between them, so neither settles. Record the decision in the ownership table
(`references/keyword-ownership.md`) and check it before creating or retitling any page.

Painless Removals is the model case: `bristol removals company` → `/`,
`home removals bristol` → `/home-removals-bristol/`, and no separate `/removals-bristol/`
hub, because it would compete with both.

Per page, pick **one dominant form** of the keyword for the title and H1 (e.g. "house
removals", not also "movers" and "moving company"). Synonyms and variants go in the body,
H2s and image alt text where they read naturally.

## The five places

The target keyword appears in all five, every time:

1. **Title** (`<title>`)
2. **URL slug**
3. **H1**
4. **The start of the first sentence** of the main content
5. **Meta description**

Why: each is a separate signal about what the page is for, and László's audit of his own
underperforming pages kept finding them pointed at different words (trapéz:
`/trapezlemez-arak/` had "árak" in the title and "Milyen trapézlemezt válasszak?" as H1).
When you review an existing page, check these five first and report them as a five-row
table with the current text and the proposed text.

Slug: the keyword, lower case, hyphenated, no year, no stop-word padding. Hungarian slugs
drop accents (`trapezlemez-arak`).

"Near me" is never in the title, URL or any heading. Searchers type it; Google resolves it
from their location, not from the page. It can appear in body text or an FAQ answer if it
reads naturally.

## Title

Formula for bottom-of-funnel (service, quote, price) pages:

```
Keyword | benefit or the searcher's goal | Brand
```

`House Removals Bristol | Instant Online Quote | Brand` (illustration; the benefit must be
true for the business)

- **Vary the structure across the site.** Colon, dash, keyword mid-title, question form.
  Ninety titles built on one template look generated, and Google rewrites boilerplate
  titles.
- **No character quota.** Google sets no limit on `<title>` and cuts by pixel width per
  device, and it rewrites titles it considers stuffed or boilerplate. So instead of
  counting characters: put the keyword and the benefit first, the brand last, and make
  sure that wherever the title is cut, the visible part still makes sense on its own.
- The title says what the page delivers. A promise the page does not keep gets rewritten
  by Google and costs trust with the visitor who clicked.
- Home page: the brand plus the main money keyword. The site name shown in results comes
  mostly from `WebSite` structured data (schema skill), not from the title.

## Meta description

Unique per page, describes this page, contains the keyword, and gives one concrete reason
to click (price shown, area covered, same-day option). No length quota: Google writes most
snippets from page content anyway and uses the description only when it fits the query
better. A description that matches the page is the one that gets used.

## H1 and headings

One H1, containing the keyword in its dominant form. H2s cover what the searcher needs to
decide (price, what is included, area, process, proof), not keyword variants stacked for
their own sake. Place names belong where they are true (area covered, local detail); a
heading that repeats the town name only to repeat it reads as spam to people first.

## Indexable content is server-rendered

Hard rule: anything that should be indexed is in the HTML the server sends (static or
SSR), never added by client-side JavaScript. Google can render JS, but rendering is
queued and can lag, and many other crawlers, including most AI crawlers, do not run JS at
all. What they read is the raw HTML.

Real example (Painless, 2026-06): an animated rating badge had `1.0` in the HTML and
counted up to 4.9 in JS. Every non-JS reader saw a one-star business. Rule that follows:
numbers, prices, ratings, headings and body text are final in the HTML; JS may animate or
enhance, not supply content.

Check with `curl -s URL | grep -i "<target text>"`, not with the browser.

## Never rename a live URL

A URL that has history in Search keeps it only while the URL stays. On a rebuild, keep
existing URLs; add new structure through navigation, not by renaming (Nemes lesson: one
rebuild already collapsed the shop's rankings). When a URL must go, 301 it to the page that
serves the same need. For product URLs, match by product type in the old slug, not by
brand: a "végszerelő készlet" URL goes to the end-fitting category, not to the brand page.

## Service and area pages

The service list is one list: the same services on the Google Business Profile, on the
site and in the schema. Every GBP service area that matters gets its own area page, and
each area page must be different for real local reasons, not by swapping the town name.
Details, the differentiation matrix and the doorway-page risk: `references/area-pages.md`.

## Internal linking

Orphan pages are a bug. Blog posts link to their main service page early (within the
first three paragraphs). The calculator/quote page gets links from everywhere it is
relevant. There is no anchor-text quota and no per-page link budget. Details:
`references/internal-linking.md`.

## Indexing controls

- **Thank-you / confirmation pages**: `noindex` meta, and **not** blocked in robots.txt.
  A robots-blocked page is never fetched, so the `noindex` is never seen.
- **Preview and staging**: `X-Robots-Tag: noindex` header decided by hostname, not by
  build mode (every `astro build` is production mode). Implementation:
  soborbo-astro-cloudflare skill.
- **Do not disallow query parameters** in robots.txt (`Disallow: /*?*`). It blocks every
  landing URL with `gclid` or UTM parameters; use canonical tags instead.
- **Sitemap**: indexable canonical URLs only. `priority` and `changefreq` are ignored by
  Google; leave them out.
- **Platform canonicals** (UNAS merged base products, WP variants): read the canonical
  tag before counting duplicates. A duplicate-content count that ignores canonicals is
  wrong (it happened on the Nemes audit).
- **hreflang** only when the same content exists in two languages or markets. Separate
  UK and HU businesses on separate domains do not need it. When used: self-reference,
  return links both ways, absolute URLs, `x-default` chosen per page pair.

## Reviewing a page or a site

Report in this order, so the most valuable fix is first:

1. Keyword ownership conflicts (two pages, one keyword) and orphan pages.
2. The five places, per page, as a table.
3. Content that is not in the server HTML.
4. Indexing mistakes (robots-blocked noindex, blocked parameters, missing pages in the
   sitemap).
5. Titles that share a template or lead with the brand.

Split the output into quick fixes (titles, meta, links, headings) and bigger work (new or
merged pages, redirects). If GSC data was not available, say which conclusions depend on
it.

## Not in this skill, on purpose

These were in the old SEO skills and were removed because they produce generated-looking
pages or rest on myths. Do not bring them back:

- Character counts for titles and descriptions; word-count minimums; "% unique" thresholds.
- Geo-modifier quotas (town name N times per heading or per 500 words).
- Anchor-text quotas ("exact match max 3") and internal link budgets.
- Photo geotags as a ranking factor.
- Seeding GBP Q&A from friendly accounts; choosing GBP categories for keywords.
- Keyword stuffing in the GBP business name (it risks suspension).

## Hand-offs

| Task | Skill |
|---|---|
| JSON-LD, `WebSite` site name, `areaServed`, LocalBusiness | schema |
| Wording, tone, making copy sound human (UK or HU) | humanize-copy |
| Author bios, reviews, trust pages, AI-crawler access | eeat-signals |
| Preview noindex header, performance, deploy | soborbo-astro-cloudflare |

## Keeping this current

Google's documentation changes often. Before quoting a Google rule, check the page in
`references/perishable-facts.md` (WebFetch, or Context7 if it indexes Search Central) and
update the date there. Review the file every six months.
