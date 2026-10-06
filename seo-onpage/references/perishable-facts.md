# Perishable facts

Google rules that this skill relies on. Each has its source and the date the page was checked
(the "Last updated" date is the one printed on the Google page). Review every six months, and
before quoting a rule to a client. Refresh with WebFetch on the URL, or Context7 if it indexes
Google Search Central.

Last full check: **2026-10-06**.

## Titles and snippets

Source: https://developers.google.com/search/docs/appearance/title-link
(page updated 2025-12-10, checked 2026-10-06)

- "There's no limit on how long a `<title>` element can be", but the title link is truncated
  "as needed, typically to fit the device width". Hence no character quota in this skill.
- Google builds title links from the `<title>`, the main visible title, `<h1>`, `og:title`,
  prominent text, anchor text of links to the page, and `WebSite` structured data.
- It rewrites titles that are keyword-stuffed, boilerplate repeated across pages, outdated,
  inaccurate, missing, or that repeat the site name redundantly.

Source: https://developers.google.com/search/docs/appearance/snippet
(page updated 2026-04-20, checked 2026-10-06)

- "Snippets are primarily created from the page content itself"; the meta description is used
  when it describes the page better for the query.
- No length limit on meta descriptions; truncated to device width. Descriptions should be
  unique per page and not strings of keywords.

Source: https://developers.google.com/search/docs/appearance/site-names
(page updated 2025-12-10, checked 2026-10-06)

- Site names are automated; `WebSite` structured data on the home page is the strongest way to
  state a preference. Works for domains and subdomains, not subdirectories.

## Rendering

Source: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
(page updated 2026-03-04, checked 2026-10-06)

- Pages wait in a render queue, "a few seconds, but it can take longer".
- "Server-side or pre-rendering is still a great idea ... and not all bots can run JavaScript."

## Links

Source: https://developers.google.com/search/docs/crawling-indexing/links-crawlable
(page updated 2025-12-10, checked 2026-10-06)

- Anchor text should be "descriptive, reasonably concise, and relevant".
- "Every page you care about should have a link from at least one other page on your site."
- "There's no magical ideal number of links a given page should contain."

## Spam policies (area pages)

Source: https://developers.google.com/search/docs/essentials/spam-policies
(page updated 2026-08-28, checked 2026-10-06)

- **Doorway abuse**: "sites or pages are created to rank for specific, similar search queries".
  Example: "multiple domain names or pages targeted at specific regions or cities that funnel
  users to one page".
- **Scaled content abuse**: "many pages are generated for the primary purpose of manipulating
  search rankings and not helping users", including with generative AI "without adding value".

## Helpful content

Source: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
(page updated 2026-10-05, checked 2026-10-06)

- Asks whether content gives "original information, reporting, research, or analysis" and
  analysis "beyond the obvious".
- On word counts: "Are you writing to a particular word count because you've heard or read
  that Google has a preferred word count? (No, we don't.)"

## Google Business Profile

Source: https://support.google.com/business/answer/3038177
(no update date shown on the page; checked 2026-10-06)

- The name is the real-world name used on signage, website and stationery. Keywords,
  locations, taglines, phone numbers and URLs in the name are not allowed.
- Service-area businesses should hide their address; the service area should not usually
  extend beyond about two hours' drive from the base.
- Choose the fewest categories that complete "this business IS a ...", not keywords.

## Tools (our setup)

Checked 2026-10-06 from László's notes, not from vendor docs.

- Ubersuggest MCP: Hungary `locId 2348` + `hu`, UK `locId 2826` + `en`; about three seed
  keywords per call is the reliable maximum.
- Google Keyword Planner estimates undercount phrase-match long tail (Lomtalanítás BP
  campaign: about 57 impressions/day estimated vs about 468/day actual, 2026).
