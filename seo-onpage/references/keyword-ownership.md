# Keyword ownership

One primary keyword belongs to one page. The ownership table is where that is decided and
remembered, so that a new blog post, area page or retitle does not quietly start competing
with an existing page.

## The table

Keep it in the repo (`docs/seo/keyword-ownership.md` or the project `CLAUDE.md`), one row per
indexable page that targets a search query. The two rows below are László's Painless
decisions of 2026-08-26:

| Keyword (dominant form) | Owner URL | Page type | Source of demand | Variants used in body |
|---|---|---|---|---|
| bristol removals company | `/` | home | (tool + month) | removal company bristol |
| home removals bristol | `/home-removals-bristol/` | service | (tool + month) | house removals, house move |

- **Source of demand** names the tool and month (GSC, Ubersuggest, Keyword Planner). No
  invented volumes; "no data" is a valid entry.
- **Variants** are words this page may use in body text and H2s. They are not separate
  targets; if a variant deserves its own page, it gets its own row and its own owner.
- A page with no row is either not meant to rank for anything (contact, privacy, thank-you)
  or a gap. Say which.

Page-type patterns that have worked: home and main service page = `service + location`;
area page = `service + area`; article = the question or topic phrase people search.

## Finding cannibalisation

From Search Console (the GSC connector), pull queries with the page dimension for the last
three months. A query where two or more URLs from the same site get impressions, and the
position swaps between them over time, is cannibalised. Also check:

- the same keyword in two H1s or two titles (grep the built HTML or the source);
- a blog post whose title targets a money keyword (e.g. "House Removals Costs in Bristol"
  next to the service page that owns "house removals bristol");
- a sister site targeting the same query (Nemes Ventilátorház and szelloztessokosan.hu run a
  dual-brand strategy whose rules exist precisely to keep them from competing; read that
  project's rules before touching either site).

## Fixing it

Pick one owner per keyword, then for each other page choose one of:

1. **Retarget**: give it a different, real query of its own and change the five places
   (title, slug only if the page is new, H1, first sentence, meta description).
2. **Merge**: move its useful content into the owner and 301 the old URL to it.
3. **De-optimise**: keep the page for users but take the keyword out of its title and H1, and
   link from it to the owner with a descriptive anchor.

Prefer the page that already ranks or already has links as the owner, even if another URL
looks tidier. Changing an owner's URL to make the structure prettier throws away its history.

## When rebuilding a site

Before migration, export the old site's titles, H1s and URLs (WP dump, crawl, or GSC pages
report) and map each old URL to its new owner. László observed that every site moved from
WordPress to Astro dropped after the move, and suspects weaker titles and internal links in
the rebuilt versions (his hypothesis, not proven). Carrying over the ownership map and the old
titles where they worked is the cheap insurance against that.
