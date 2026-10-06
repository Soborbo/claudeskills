# Perishable facts

Everything here can change. Each item has the date it was checked and its source.
Review every six months (next: 2027-04), or as soon as something here contradicts
what the live Google page says. Refresh via the links, or Context7
`/websites/developers_google_search_appearance_structured-data` and
`/schemaorg/schemaorg`.

## Google features (checked 2026-10-06)

- **Search Gallery** (last updated 2026-06-15) lists 30 features. Relevant here:
  Article, Breadcrumb, Local business, Organization, Profile page, Review snippet,
  Video, Software app, Product. **Not listed:** FAQ, HowTo, Service, sitelinks
  search box. Speakable is still listed (news, beta).
  https://developers.google.com/search/docs/appearance/structured-data/search-gallery
- **FAQ rich result:** deprecation notice added 2026-05-08: "This feature will no
  longer appear in Google Search starting May 7, 2026." Documentation removed in
  June 2026. (Since 2023-08 it had only shown for government and health sites.)
  https://developers.google.com/search/updates
- **HowTo:** documentation removed 2023-09; no rich result on desktop or mobile.
  https://developers.google.com/search/updates
- **Breadcrumbs:** desktop only since 2025-01-22.
  https://developers.google.com/search/docs/appearance/structured-data/breadcrumb (updated 2026-09-08)
- **Retired 2025:** book actions (later returned to the gallery), course info,
  ClaimReview, estimated salary, learning video, special announcement, vehicle
  listing (announced 2025-06-12; docs removed 2025-09-09). Practice problem docs
  removed 2026-01-06. https://developers.google.com/search/updates
- **VideoObject:** `creator` property added and `interactionStatistic` clarified
  on 2026-09-24. https://developers.google.com/search/docs/appearance/structured-data/video
- **Preferred image:** since 2026-03-02 Google documents that it uses both
  schema.org image markup and `og:image` to pick thumbnails. https://developers.google.com/search/updates

## Type requirements (checked 2026-10-06)

- **LocalBusiness** (updated 2026-09-08): required `name`, `address`; recommended
  `aggregateRating` (only for sites reviewing other businesses), `department`,
  `geo` ("precision must be at least 5 decimal places"), `menu`,
  `openingHoursSpecification`, `priceRange` (<100 characters), `review`,
  `servesCuisine`, `telephone` (with country and area code), `url`. Multiple types
  as an array; `additionalType` not supported.
  https://developers.google.com/search/docs/appearance/structured-data/local-business
- **Organization** (updated 2026-09-08): no required properties; recommended
  `name`, `alternateName`, `url`, `logo` (≥112×112 px), `address`, `telephone`,
  `email`, `description`, `contactPoint`, `sameAs`, `vatID` ("an important trust
  signal"), `taxID`, `iso6523Code`, `duns`, `leiCode`, `naics`, `foundingDate`,
  `numberOfEmployees`, `hasMerchantReturnPolicy`, `hasShippingService`. Place on
  the homepage or one page describing the organisation; local businesses use a
  LocalBusiness subtype.
  https://developers.google.com/search/docs/appearance/structured-data/organization
- **Article** (updated 2026-09-08): no required properties; recommended `author`
  (+ `author.name`, `author.url`), `dateModified` / `datePublished` (ISO 8601,
  timezone recommended), `headline`, `image` (16:9, 4:3, 1:1; ≥50K pixels).
  https://developers.google.com/search/docs/appearance/structured-data/article
- **Breadcrumb** (updated 2026-09-08): `itemListElement`; ListItem `position`,
  `name`, `item` (optional on the last item).
- **Site names** (updated 2025-12-10): WebSite `name` + `url` required, on the
  homepage of the domain/subdomain only; `alternateName` recommended.
  https://developers.google.com/search/docs/appearance/site-names
- **Profile page** (updated 2026-09-08): valid for "employee pages on company
  websites" and author pages.
  https://developers.google.com/search/docs/appearance/structured-data/profile-page
- **Software app** (updated 2026-09-08): requires `name`, `offers.price`, and
  `aggregateRating` or `review`; a free quote calculator without ratings is not
  eligible. https://developers.google.com/search/docs/appearance/structured-data/software-app
- **General guidelines** (updated 2026-07-10): "Don't mark up content that is not
  visible to readers of the page"; markup on the page it describes; `@id` to link
  separate items. https://developers.google.com/search/docs/appearance/structured-data/sd-policies

## Reviews (checked 2026-10-06)

- Review snippet (updated 2026-09-08): if the reviewed entity controls the reviews
  about itself, its pages are ineligible for stars, whether the reviews are in the
  markup or "through an embedded third-party widget (for example, Google Business
  reviews or Facebook reviews widget)". "Don't rely on human editors to create,
  curate, or compile ratings information for local businesses." AggregateRating
  needs `ratingValue` and `ratingCount` or `reviewCount`; `bestRating` defaults to 5.
  A guideline on fake and undisclosed incentivised reviews was added 2026-07-24.
  https://developers.google.com/search/docs/appearance/structured-data/review-snippet
- Fake reviews and concealed incentivised reviews are banned in UK consumer law
  (DMCC Act 2024, Schedule 20, in force from 2025-04-06). Check
  https://www.legislation.gov.uk/ukpga/2024/13/schedule/20 before quoting it.

## AI features (checked 2026-10-06)

- AI features doc (updated 2025-12-10): "You don't need to create new machine
  readable files, AI text files, or markup to appear in these features. There's
  also no special schema.org structured data that you need to add."
  https://developers.google.com/search/docs/appearance/ai-features
- AI optimization guide (updated 2026-07-10): llms.txt and similar files "will
  neither harm nor help your site's visibility or rankings in Google Search";
  "Structured data isn't required for generative AI search … it's a good idea to
  continue using it … as it helps with being eligible for rich results". It lists
  "overfocusing on structured data" among unnecessary tactics. Changelog note on
  llms.txt: 2026-06-15.
  https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Vendor statistics that circulated in older skills ("3× AI Overview rate",
  "+19.72 %", "FAQ 3.2×") were either not traceable or vendor case studies without
  control groups (review 06, 2026-10-02). Do not cite them.

## Google Business Profile (checked 2026-10-06)

- Name must be the real-world name; marketing taglines, store codes, special
  characters and "irrelevant legal terms (e.g. LLC, LTD, INC)" are not allowed
  unless on real signage. A service-area business run from a residence "should hide
  your business address". https://support.google.com/business/answer/3038177
  (the page shows no update date).

## Google Maps link (checked 2026-10-06)

- Place Details (New) returns `googleMapsUri`; it is billed in the Place Details
  Pro SKU. https://developers.google.com/maps/documentation/places/web-service/place-details
- Maps URLs: `query_place_id` links a specific place.
  https://developers.google.com/maps/documentation/urls/get-started
- The hex-to-CID shortcut is undocumented; `0x8db3afbdd3f2b209` =
  10210698010018624009 (`python3 -c "print(int('8db3afbdd3f2b209',16))"`), not the
  10222747834737099273 the old skills shipped.

## Hungary (checked 2026-10-06)

- Ekertv. (2001. évi CVIII. tv.) 4. § (1) a)-h), hatályos állapot 2026-10-01: név;
  székhely, telephely; elérhetőség, különösen e-mail; nyilvántartó bíróság/hatóság
  és nyilvántartási szám; engedélyező hatóság (ha engedélyköteles); adószám (ha
  áfaalany); szabályozott szakmák adatai; tárhelyszolgáltató adatai. Quote the exact
  text from https://net.jogtar.hu/jogszabaly?docid=a0100108.tv , not from here.

## Template divergences (leadgen-template-site `origin/main` 8595c8c, checked 2026-10-06)

Where `src/config/jsonld.ts` and friends do not yet follow this skill. Fix in the
template repo, one PR, not in client sites.

Already right in the template: `/#business` with the slash, no AggregateRating on
the business, Article `@id` + `mainEntityOfPage`, URLs from `routes`, area Service
with its own `@id`, breadcrumbs from the shared `trail`, placeholder `sameAs`
filtered by `isConfigured()`, founder as a minimal Person node.

Open gaps:

1. `src/layouts/BaseLayout.astro:245`: `JSON.stringify(schema)` without
   `.replace(/</g, '\\u003c')`.
2. `buildAddress()`: always emits `streetAddress`; no `address.hideStreet` (SAB)
   flag, and `geo` is emitted even when the address should be hidden.
3. `legal.vatNumber` exists in the config but is not emitted as `vatID`; no `taxID`
   or `identifier` (company number / cégjegyzékszám) field.
4. Bare `{ "@id" }` references to the business (`provider`, `publisher`,
   `worksFor`) and to the author (`Article.author`) instead of minimal nodes with
   `@type`, `name`, `url`.
5. `faqSchema()` comment still says "No rich results since Jan 2026 but
   significantly increases AI search visibility" - both wrong (2026-05-07; no AI
   effect documented).
6. Defaults emit unverified values: `priceRange` default `'££'`, `paymentAccepted`
   default `'Cash, Credit Card, Bank Transfer'`, and `foundedYear` is required, so
   every site states a founding year whether or not it is known.
7. `buildAreaServed()` names cities "Bath, Somerset" as `City`, and mixes a city
   list, the country and a `GeoCircle`; `serviceSchema()` uses only the country.
8. The Maps link is the `googleMapsCid` field (used for `hasMap` and `sameAs`); it
   should be the Places API `googleMapsUri`. No HU `sameAs` sources.
9. `src/config/site.config.ts` demo data is a real client (Painless Removals) with
   the wrong CID, four-decimal `geo`, placeholder officer id, real-looking ratings
   and testimonials. It should be a made-up business with obvious placeholders.
10. No `inLanguage` on page nodes; no WebSite `alternateName`; no `memberOf` /
    `hasCredential` on the business.
