# Service and area pages

Local-service sites rank in two places: the map pack (driven by the Google Business Profile)
and organic results (driven by the site). The rules below keep the two telling the same story.

## One service list everywhere

Keep a single canonical service list in `siteConfig` (or the project's equivalent):

```ts
services: ['House Removals', 'Office Removals', 'Packing Service']
```

- The same services, in the same words, appear on the GBP, as service pages on the site, and
  in the schema (the schema skill reads them from the same config).
- A service that is not in the list is not on the GBP, not on the site and not in the schema.
  A service offered on the GBP without a page on the site gives Google nothing to rank.
- Name, address and phone are identical on the site footer, the GBP and the citations.

The GBP name is the real-world business name as on signage, invoices and the site. No
keywords, no town, no "Ltd" or "Kft." added for effect: Google's GBP rules list keywords in the
name as grounds for suspension. The legal name belongs in the schema `legalName` and the
footer, not in the GBP name. Service-area businesses hide their street address on the GBP.

## GBP service areas → area pages

Every service area listed on the GBP that the business actually wants work from gets an area
page, and the mapping is recorded:

```ts
areas: { bath: '/areas/bath/', gloucester: '/areas/gloucester/' }
```

Order of building:

1. The main city page (often the home page) first.
2. Other towns the GBP lists, ordered by the leads they bring (CRM data, GSC impressions).
3. Neighbourhood or postcode-district pages only after the city page ranks. For a postcode
   cluster, one page per cluster ("North Bristol: BS6, BS7, BS9, BS10") is safer than one per
   postcode.

Tag the GBP website link with UTM parameters
(`?utm_source=google&utm_medium=organic&utm_campaign=gbp`) so GBP visits are separable in GA4
while still counting as Organic Search (source `google` + medium `organic`). Check the GBP performance report's search queries: they show the words local
searchers use, and which ones are the wrong intent (job seekers, DIY).

## Making area pages different

This is where city pages turn into doorway pages. Google's spam policy names "pages targeted
at specific regions or cities that funnel users to one page" as doorway abuse, and generating
many near-identical pages as scaled content abuse (`perishable-facts.md`). A page that is the
same text with the town swapped falls under both, whatever tool wrote it.

Each area page needs things only that area has. Fill this matrix from real sources (jobs done,
reviews, the owner, CRM) before writing:

| Element | Bristol | Bath | Gloucester |
|---|---|---|---|
| Neighbourhoods actually served | | | |
| Postcode districts | | | |
| A real review from that area (named, dated) | | | |
| Local logistics (parking permits, access, narrow streets, distance from base) | | | |
| Typical jobs there and what they cost | | | |
| Landmark or reference point people use | | | |

An empty cell stays empty. Do not invent a review, a street or a job to fill it; if a town
yields nothing specific, that is a sign it should not have its own page yet and can be named on
a broader regional page instead. There is no word-count or "% unique" threshold: a short page
with true local detail beats a long one padded to a number.

The H1 and title follow the main rules (`service + area`, one dominant form). Mention the town
where it is true; repeating it in every heading adds nothing for the reader.
