---
name: schema
description: Build, audit and debug schema.org JSON-LD for Soborbo's UK and Hungarian local-service lead-gen sites on Astro - one connected entity graph (LocalBusiness subtype, WebSite, Service, area and route Service, Person, Article, BreadcrumbList) generated from the site config by the leadgen-template-site generator, with fixed @id, sameAs and Google Business Profile alignment rules, every useful property filled from real data. Use when adding, reviewing or fixing JSON-LD, structured data, rich-result eligibility, entity graph or Knowledge Panel signals on a site, auditing someone else's markup, or deciding whether a page needs markup at all. Not for Zod, database or JSON Schema work, and not for the visible E-E-A-T signals on the page (eeat-signals).
---

# Schema (JSON-LD entity graph)

Structured data on a Soborbo site does two jobs: it makes the business one clear,
connected entity for Google (name, address, services, people, profiles), and it
makes the few pages that can earn a rich result (articles, breadcrumbs, video)
eligible for one. It does not rank a page by itself, and there is no special
markup for AI Overviews or AI Mode (Google says so explicitly, see
`references/perishable-facts.md`). Markup that says something the page does not
show is a guideline violation, and it is the usual way schema goes wrong.

## Always refresh from the source first

Google's structured-data rules change several times a year, and this skill was
written on a fixed date. Before you rely on a rule here for a type or property,
check the current source. It takes a minute and catches the cases where this
file is already out of date.

| What | Where |
|---|---|
| Which features Google still shows | Search Gallery: https://developers.google.com/search/docs/appearance/structured-data/search-gallery |
| Required / recommended properties of a type | The type's page under https://developers.google.com/search/docs/appearance/structured-data/ (e.g. `local-business`, `organization`, `article`, `breadcrumb`, `review-snippet`, `video`, `profile-page`) |
| General rules (visible content, placement) | https://developers.google.com/search/docs/appearance/structured-data/sd-policies |
| What changed recently | Search Central changelog: https://developers.google.com/search/updates |
| What a property means, which type accepts it | schema.org type page, e.g. https://schema.org/MovingCompany , https://schema.org/Service |
| Same, from Context7 | `/websites/developers_google_search_appearance_structured-data` (Google), `/schemaorg/schemaorg` (schema.org), `/google/schema-dts` (TypeScript types) |

If the live source contradicts this skill, the source wins. Update
`references/perishable-facts.md` with the date and link, so the next run does not
repeat the mistake.

## Where the code is

The canonical generator is **`Soborbo/leadgen-template-site`**, file
`src/config/jsonld.ts` (local clone `~/dev/leadgen`; read `origin/main` after
`git fetch`). The config shape is `src/config/site.schema.ts` (Zod), the per-site
data is `src/config/site.config.ts`, and the single JSON-LD `<script>` is rendered
in `src/layouts/BaseLayout.astro`. Pages call one generator each
(`homepageSchema`, `serviceSchema`, `areaServiceSchema`, `articleSchema`,
`personSchema`, `aboutPageSchema`, `contactPageSchema`, `collectionPageSchema`,
`calculatorSchema`) and push extras (`faqSchema`, `videoSchema`) into its
`@graph`.

Copy or adapt from there, never from this skill. The template does not yet match
every rule below; the dated list is in `references/perishable-facts.md`
("Template divergences"). When the two disagree, the rule here is the decision:
fix the template in its own repo with its own PR rather than copying the gap into
a client site.

A site that is not built from the template (WordPress, UNAS, an older Astro
build) still follows the same graph and rules. Build the same nodes by hand or
with the site's own generator.

## The graph in one picture

```
WebSite #website ──publisher──► <LocalBusiness subtype> #business ◄──provider── Service #service
                                  │ founder / employee                 (service page, area page,
                                  ▼                                      route page: each its own @id)
                      Person #person (author page) ◄──author── Article #article (blog post)
WebPage-type nodes (AboutPage, ContactPage, CollectionPage, ProfilePage) ──mainEntity──► business / person
```

The rules that hold this together, and why:

- **One real-world thing, one `@id`.** The business is `https://example.co.uk/#business`
  everywhere, with the slash before the hash. `https://example.co.uk#business` is a
  different string, and JSON-LD compares identifiers as strings, so the two would be
  two businesses. Page-level entities use the page URL: `…/services/house-removals/#service`,
  `…/blog/slug/#article`, `…/author/slug/#person`, `…/about/#webpage`. Every area
  page and route page Service gets its own `@id` too, so other nodes can point at it.
- **Full declaration once, a minimal declaration everywhere else.** The homepage
  carries the full business node. Every other page that refers to the business, the
  author or the website includes a small node with `@type`, `@id`, `name` and `url`,
  not a bare `{ "@id": … }`. Google parses each page on its own; a bare reference to
  a node declared on another page is an empty node on this one.
- **One subtype, never a second Organization.** `MovingCompany` already is an
  `Organization`. A separate `Organization` node for the same company creates two
  conflicting entities. If the business really is several things, use an array
  type (`["Electrician", "Plumber"]`); Google does not support `additionalType`.
- **One emitter.** Plugins, themes and hand-written code all like to output
  `Organization`. Before adding markup to an existing site, view the rendered HTML
  and remove every other source.
- **Absolute URLs, the canonical host.** `@id`, `url` and `sameAs` are built from
  one origin (`seo.canonicalBase` or `url`). Mixing `www` and bare host breaks every
  cross-reference silently.

`references/conventions.md` has the page-type map, the `sameAs` lists for UK and
HU, area and route modelling, and the GBP alignment table.

## Fill every useful property, never an invented one

László's rule: on each node, fill every property that Google or schema.org uses
for that type **and** that has a real, verified value the visitor can also see on
the site. That gives Google the most complete entity it can get. The opposite
mistake is worse: a made-up founding year, a guessed price range, a placeholder
company number or a rating copied from another platform is a false statement
about the business, and some of it is unlawful (fake or misleading reviews under
the UK DMCC Act 2024; misleading commercial practice in Hungary).

So for each property:

1. Is it listed for this type in the Google doc, or valid on schema.org for it?
   (`references/fields.md` has the list per type, checked 2026-10-06.)
2. Is there a real value, from the owner, Companies House / e-cegjegyzék, GBP or
   the site itself? Ask the owner when it is missing; do not fill a default.
3. Is it visible somewhere on the site (page, footer, impresszum)? If not, either
   show it or leave the property out.

No to any of the three: the property is omitted. An empty string, `"N/A"`,
`XXXX` or a template default is never emitted. The template's `isConfigured()`
gate filters placeholder `sameAs` URLs; apply the same thinking to every field.

Three values people tend to get wrong:

- **`geo`**: at least five decimal places (Google's minimum), taken from the GBP
  pin or Maps, not from a postcode centroid. A service-area business that hides its
  address in GBP gets no `geo` and no `streetAddress`; publishing them would reveal
  what GBP deliberately hides.
- **`hasMap` / Maps `sameAs`**: use the `googleMapsUri` returned by the Places API
  (Place Details, New). Never compute a CID by hand from the hex in a Maps URL;
  both old schema skills shipped a wrongly converted number. Details in
  `references/conventions.md`.
- **`vatID` / `taxID`**: Google calls `vatID` an important trust signal. UK: VAT
  number with the `GB` prefix in `vatID`. HU: the EU VAT number (`HU12345678`) in
  `vatID`, the domestic adószám (`12345678-1-23`) in `taxID`. Both only when the
  business really is registered and the number is shown on the site.

## Ratings: none on the business by default

No `aggregateRating` and no `review` on the site's own LocalBusiness or
Organization node. Google's review-snippet rules make a business that controls
the reviews about itself (on its own pages, including an embedded Google or
Facebook widget) ineligible for stars, and forbid compiling ratings for local
businesses. A weighted average of Google + Trustpilot + Facebook is exactly that
compilation. The review counts can still be shown on the page as text; they just
do not go into markup. Adding a rating to the business is a deliberate decision
by László, made knowing it earns no stars, and then only with the number visible
on the same page.

## What not to mark up

| Don't | Why |
|---|---|
| Treat FAQPage as required or as a goal | The FAQ rich result has been shown to no one since 2026-05-07, and Google removed its documentation. Markup for a visible Q&A block is harmless and the template emits it from the same array the page renders, but nothing is gained by adding Q&A to get it. |
| HowTo | No rich result since 2023-09. |
| Speakable, SearchAction / sitelinks search box | News-only beta; the search box is gone. |
| Product or Offer-as-product for a service | Misrepresents a service as goods; merchant features then expect stock, returns, shipping. |
| LocalBusiness on every page, or on area pages | One business, declared on the homepage. Area pages are a Service with `areaServed`. |
| A price the page does not show | Offer data must match visible text. |
| Markup on noindex, redirecting or 404 pages | Google ignores it, and it hides real errors in audits. |
| "Schema for AI" (special markup, llms.txt) | Google states no special markup is needed for AI features and that llms.txt neither helps nor harms in Search. |
| Software-app rich result for the quote calculator | It requires a rating or review; `WebApplication` stays as a plain graph node. |

Service markup has no rich result at all. It stays because it ties each service
and area page into the business entity; keep it short and factual.

## Writing it into a page

The JSON-LD goes in one `<script type="application/ld+json">` in the `<head>`,
server-rendered. Escape `<` when serialising, otherwise a `</script>` inside any
string (a review quote, an FAQ answer) ends the script early and becomes markup
injection:

```astro
<script type="application/ld+json"
  set:html={JSON.stringify(schema).replace(/</g, '\\u003c')} />
```

The template's `BaseLayout.astro` does not escape yet (see Template divergences).

Visible content and markup come from the same data. Breadcrumbs: the template's
`trail.*` feeds both the visible trail and `BreadcrumbList`. FAQ: the same array
renders the accordion and `faqSchema()`. Do the same for any new markup, so the
two cannot drift apart.

## Hungarian sites

The Hungarian e-commerce act (Ekertv., 2001. évi CVIII. tv. 4. §) requires a
directly and permanently available impresszum: name, seat, contact email,
registering court and company registration number, licence if any, adószám,
professional chamber data for regulated trades, and the hosting provider. Most of
these map straight onto the business node (`legalName`, `address`, `email`,
`taxID`, `vatID`, `identifier` for cégjegyzékszám), so the impresszum page and the
homepage markup should be generated from the same config fields. HU `sameAs` and
address formats are in `references/conventions.md`.

## Auditing an existing site

- Read the **rendered** HTML. `curl` and `web_fetch` miss JSON-LD injected by
  JavaScript (common on WordPress plugins and UNAS), so a "no schema found" from
  them may be wrong. Use the Rich Results Test (it renders) or a real browser.
- Look for: duplicate business entities or emitters, `@id` variants with and
  without the slash, bare references with no minimal node, self-serving ratings,
  invented or placeholder values, markup that the page does not show, prices that
  do not match, `sameAs` URLs that 404, address/phone/hours different from GBP.
- Validate with the Rich Results Test (https://search.google.com/test/rich-results)
  for Google eligibility and the Schema Markup Validator (https://validator.schema.org/)
  for vocabulary errors; after launch, Search Console's enhancement reports.

## References

- `references/conventions.md` - @id table, page-type map, area and route Service,
  `sameAs` for UK and HU, Google Maps link, GBP alignment, service-area businesses.
- `references/fields.md` - per-type property list (Google status, config source,
  when to leave it out). Open it when building or extending a node.
- `references/patterns.md` - JSON snippets: Offer variants, area and route Service,
  minimal reference nodes, Person, Article, HU business node.
- `references/perishable-facts.md` - dated Google facts with sources, and the
  current gaps between this skill and the template generator.
