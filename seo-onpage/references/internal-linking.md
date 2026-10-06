# Internal linking

Internal links tell Google which pages matter and how they relate, and they are the only links
fully under our control. On sites with few backlinks (most of ours) they decide which page gets
the authority the home page has.

## Rules

**No orphan pages.** Every indexable page has at least one link from another indexable page,
in the content or navigation, not only in the sitemap. An orphan is a bug to fix before
release, not a warning. Google's own guidance: every page you care about should have a link
from at least one other page.

**Blog posts link to their service page early.** Each article links to the main service page
it supports within the first three paragraphs, with an anchor that names the service. Blog
posts exist to answer questions and pass that attention on; a link at the end, after the
reader has left, does neither.

**The calculator / quote page gets many links.** It is where leads happen, so link to it from
the home page, every service page and every area page, plus relevant articles. On the
calculator page itself keep outbound links few, so the visitor finishes the quote.

**New page, new links in.** When a page is published, add links to it from the existing pages
that are most related (the service page for a new area page, the area pages for a new
service). Publishing a page without updating old ones creates an orphan.

**Area and service pages cross-link.** A service page lists the areas it covers (linking to
the area pages); an area page links to the services offered there.

## Anchors

Descriptive, short, and true to the target page ("house removals in Bath", "trapézlemez
árak"). Vary them naturally; the same phrase repeated mechanically reads as generated. There is
no quota on exact-match internal anchors and no per-page link budget: those were backlink
heuristics wrongly applied to internal links. If a page has so many links that a reader would
not use them, there are too many.

Generic anchors ("click here") waste the signal; descriptive ones help the reader and Google.

## Checking

- Build a link graph from the built site (`dist/` HTML or a crawl) and list pages with zero
  inbound links from content.
- For each money page, list the pages that link to it. The calculator and the main service
  pages should be near the top.
- After a migration, compare inbound internal links per key URL with the old site. A page
  that lost its links in the rebuild often lost its ranking with them.
