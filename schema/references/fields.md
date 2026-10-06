# Properties per type

Checked 2026-10-06 against the Google type pages and schema.org. Before relying on
a "Google" column, open the current Google page (links in `perishable-facts.md`);
the lists change.

Column **Google**: R = required for the Google feature, Rec = listed as
recommended, - = not in Google's doc (schema.org only; harmless, helps the entity
graph if true). Column **Source**: where the leadgen template takes the value from
(`site.config.ts` field), or what to ask the owner for. Every row is conditional on
a real, visible value; if there is none, the property is left out.

## Business node (LocalBusiness subtype), homepage

| Property | Google | Source / note |
|---|---|---|
| `@type` | - | `schemaType`: the most specific subtype (`MovingCompany`, `Electrician`, `HVACBusiness`, `HousePainter`, `RoofingContractor`, `HomeAndConstructionBusiness`, `ProfessionalService`…). Array if several apply. |
| `name` | R | `name`: real-world name = GBP name = site name. |
| `address` | R | `address.*`. SAB: no `streetAddress`. |
| `url` | Rec | Homepage, canonical host. |
| `telephone` | Rec | `contact.phone`, E.164. |
| `geo` | Rec | `address.geo`, ≥5 decimals. Omit for a hidden SAB address. |
| `openingHoursSpecification` | Rec | `hours[]`, same as GBP. |
| `priceRange` | Rec | Only if true and short (<100 characters). A range like "£300-£2,500" from real prices is better than "££". No default. |
| `image` | - (in Google's LocalBusiness example) | 16:9, 4:3, 1:1 versions of a real photo of the business, crawlable. |
| `logo` | Rec (Organization) | `assets.logo`, ≥112×112 px, crawlable. |
| `email` | Rec (Organization) | `contact.email`. |
| `description` | Rec (Organization) | `description`: factual, as on the site. No "most trusted". |
| `legalName` | Rec (Organization) | Registered name (Companies House / cégjegyzék). |
| `alternateName` | Rec (Organization) | Only a name customers really use (acronym, old name). |
| `sameAs` | Rec (Organization) | See `conventions.md`. |
| `vatID` | Rec (Organization) | `legal.vatNumber` (UK `GB…`, HU `HU…`). |
| `taxID` | Rec (Organization) | HU adószám. UK: usually none to show; leave out. |
| `iso6523Code`, `duns`, `leiCode` | Rec (Organization) | Only if the business has one and you know the exact value and ICD scheme. Never guess the scheme. |
| `naics` | Rec (Organization) | US classification; not used for UK/HU businesses. |
| `foundingDate` | Rec (Organization) | ISO 8601 (`2009` or `2009-04-01`), from the register or the owner. Not "since 1978" family lore unless the company dates from then. |
| `numberOfEmployees` | Rec (Organization) | `QuantitativeValue`, only from the owner. |
| `contactPoint` | Rec (Organization) | Only when there are distinct lines (sales vs. customer service) with their own number or email. |
| `hasMap` | - | `googleMapsUri` from the Places API. |
| `areaServed` | - | See `conventions.md`. |
| `hasOfferCatalog` | - | `services[]`, each Offer → Service `@id` + `name`. |
| `knowsAbout` | - | Service types; real specialisms only. |
| `knowsLanguage` | - | Languages the business actually serves customers in. |
| `currenciesAccepted`, `paymentAccepted` | - | Real payment methods only; no template default. |
| `founder`, `employee` | - | Minimal Person node(s) pointing at author pages. |
| `memberOf` | - | Trade body as `Organization` with `name` + `url`, only with real membership. |
| `hasCredential` | - | Licences and accreditations as `EducationalOccupationalCredential` (`name`, `recognizedBy`), only verifiable ones. |
| `award` | - | Text, only real, nameable awards. |
| `identifier` | - | Company number / cégjegyzékszám as `PropertyValue`. |
| `slogan` | - | Only if it is the visible tagline and makes no unprovable claim. |
| `potentialAction` | - | `ReserveAction` with an `EntryPoint` when there is a real booking URL. |
| `department` | Rec | Only a business with separately listed departments. Rare for lead-gen sites. |
| `aggregateRating`, `review` | Rec only for sites reviewing *other* businesses | Not on the site's own business (see SKILL.md). |
| `additionalType` | not supported | Use an array `@type`. |

## WebSite, homepage only

| Property | Google | Note |
|---|---|---|
| `name` | R (site names) | The site name you want Google to show. |
| `url` | R (site names) | Canonical homepage of the domain or subdomain. |
| `alternateName` | Rec | Shorter or alternative name, if one exists. |
| `publisher` | - | Business `@id`. |
| `inLanguage` | - | `en-GB`, `hu-HU`. |

No `potentialAction` SearchAction: the sitelinks search box is gone.

## Service (service, area and route pages)

Google has no Service feature; these are schema.org properties that make the node
useful in the graph.

| Property | Note |
|---|---|
| `@id`, `name`, `url` | Always. |
| `serviceType` | Plain descriptor ("House removals"). |
| `description` | The page's own short description. |
| `provider` | Minimal business node. |
| `areaServed` | Service page: business coverage. Area: one Place. Route: both places. |
| `offers` | Only with a price visible on the page (see `patterns.md`). |
| `hasOfferCatalog` | Sub-services that have their own visible list. |
| `isSimilarTo` | Area/route Service → base Service `@id`. |
| `audience` | Only if the page targets a real segment ("Businesses", "Students"). |
| `image` | A real photo used on the page. |

Not used: `termsOfService` (no value), `brand` (the provider covers it).

## Person (author / team page)

| Property | Note |
|---|---|
| `@id`, `name`, `url` | `url` = the author page; Google recommends `author.url` on articles to identify the author. |
| `jobTitle`, `description` | As shown on the page. |
| `image` | Real photo. |
| `worksFor` | Minimal business node. |
| `sameAs` | LinkedIn, Companies House officer page, professional register. |
| `knowsAbout` | Their real specialisms, not a copy of the whole service list if they do not do all of it. |
| `hasCredential`, `memberOf`, `alumniOf`, `award` | Only verifiable ones. |
| `hasOccupation` | Optional; `jobTitle` usually covers it. |

## Article / BlogPosting

No required properties at Google; all of these are recommended or useful.

| Property | Note |
|---|---|
| `@id`, `url`, `mainEntityOfPage` | `<post URL>#article`; `mainEntityOfPage` → the post URL. |
| `headline` | The visible title. |
| `description` | Meta description or standfirst. |
| `image` | 16:9, 4:3 and 1:1, each ≥50,000 pixels (width × height). |
| `datePublished`, `dateModified` | ISO 8601 with timezone (`2026-03-10T09:00:00+00:00`). Change `dateModified` only on a real content edit. |
| `author` | Minimal Person node with `name` and `url`. |
| `publisher` | Minimal business node. |
| `isPartOf` | WebSite `@id`. |
| `inLanguage` | Site locale. |

## BreadcrumbList

`itemListElement` of `ListItem` with `position`, `name`, `item` (URL; optional on
the last item). It must match the visible trail; desktop-only display since 2025.

## Page nodes (WebPage, AboutPage, ContactPage, CollectionPage, ProfilePage)

`@id`, `url`, `name`, `isPartOf` (WebSite), `mainEntity` (business, person or
ItemList), `inLanguage`. ProfilePage: `mainEntity` Person with `name`; Google also
uses `dateCreated` / `dateModified`, `image`, `sameAs`, `description` when present.

## VideoObject (only where the video is on the page)

Google required: `name`, `thumbnailUrl`, `uploadDate`. Recommended: `description`,
`contentUrl` or `embedUrl`, `duration` (ISO 8601), `publisher`, `creator`/`author`.

## WebApplication (quote calculator)

`@id`, `name`, `url`, `description`, `provider`, `isPartOf`,
`applicationCategory`, `operatingSystem`, `offers` with `price: 0`. It earns no
rich result (software app needs a rating), which is fine; it is there for the graph.
