# Conventions

Examples use a made-up business, Example Removals Ltd at `https://example.co.uk`.
Paths follow the leadgen-template-site `routes` object in `src/config/jsonld.ts`;
a site with different routes changes them there, never by concatenating slugs
elsewhere.

## @id table

| Entity | @id | Full node on | Elsewhere |
|---|---|---|---|
| Business (LocalBusiness subtype) | `https://example.co.uk/#business` | Homepage | Minimal node: `@type`, `@id`, `name`, `url` |
| WebSite | `https://example.co.uk/#website` | Homepage | `{ "@id" }` in `isPartOf` is enough; Google only reads WebSite on the homepage |
| Service | `https://example.co.uk/services/house-removals/#service` | Its service page | `hasOfferCatalog` on the homepage lists it by `@id` + `name` |
| Area Service | `https://example.co.uk/areas/clifton/#service` | Its area page | `isSimilarTo` → the base service `@id` |
| Route Service | `https://example.co.uk/routes/bristol-to-london/#service` (whatever the route path is) | Its route page | - |
| Person | `https://example.co.uk/author/jane-doe/#person` | Author page (ProfilePage) | Minimal node: `@type`, `@id`, `name`, `url` (the author page URL) |
| Article | `https://example.co.uk/blog/slug/#article` | The post | - |
| Page nodes | `<page URL>#webpage` | That page | - |
| Calculator | `https://example.co.uk/quote/#webapp` | Quote page | - |

The trailing-slash form of the homepage (`/#business`) is the only form. The
template's `id()` builds `fullUrl(path) + '#' + fragment`, and the home route is
`/`, so this comes out right; a hand-built site must do the same.

## Page type → nodes

| Page | Nodes | Notes |
|---|---|---|
| Homepage | Business (full), WebSite, FAQPage if a Q&A block is visible | No breadcrumb (single item). |
| Service | Service, BreadcrumbList, FAQPage if visible | Offer only if the price is on the page. |
| Area page | Service with `areaServed` Place, BreadcrumbList | No LocalBusiness. |
| Route page | Service with both places in `areaServed`, BreadcrumbList | Removals-type sites. |
| Service / area / blog hub | CollectionPage + ItemList, BreadcrumbList | |
| Blog post | Article or BlogPosting, BreadcrumbList, VideoObject if a video is the main content | |
| Author / team member | ProfilePage + Person, BreadcrumbList | Google lists "employee pages on company websites" as a valid ProfilePage use. |
| About | AboutPage → business, BreadcrumbList | |
| Contact | ContactPage → business, BreadcrumbList | |
| Quote calculator | WebApplication (no rating, no rich result), BreadcrumbList | |
| Legal, privacy, impresszum | BreadcrumbList only | |
| Thank-you, 404, noindex, redirects | Nothing | |

## areaServed

- **Homepage business:** the base town, the hub towns the business really covers
  (`areas[].featured`), and the country. Do not list thirty suburbs; the area pages
  carry the detail. Use `City` only for a city's own name: "Bath" is a City with
  `containedInPlace` "Somerset" (`AdministrativeArea`), not a City named
  "Bath, Somerset".
- Pick one way to describe coverage: a list of places, or a `GeoCircle` around the
  base. Both at once describe two different areas.
- **Service page:** the same coverage as the homepage, not the bare country, unless
  the service really is nationwide.
- **Area page:** one `Place` with `containedInPlace`. A Wikipedia `sameAs` on the
  place is fine for towns and cities that have their own article; skip it for
  neighbourhoods.
- **Route page:** `areaServed` is an array of the two places.

## sameAs

Only the business's own, verified profiles: open each URL, check it is the same
business, and that it is not a redirect or a search result. Order does not matter
to Google; completeness and correctness do.

UK business:

- Google Maps link (see below)
- Companies House: `https://find-and-update.company-information.service.gov.uk/company/<number>`
- Facebook, Instagram, LinkedIn company page, YouTube, TikTok
- Trustpilot, Yell, Checkatrade, Which? Trusted Traders profile (if listed)
- Trade bodies where the business is a member (e.g. BAR for removals, NICEIC),
  only when the body gives the member a permanent profile URL. A register search
  result page is not one.

HU business:

- Google Maps link
- Facebook, Instagram, YouTube, TikTok, LinkedIn
- Árukereső shop page, if the business sells there
- The relevant chamber or professional body member page (e.g. a kamarai névjegyzék
  entry) when it has a stable URL
- Cégjegyzék / céginformáció pages: only if the URL opens the company page directly
  and does not depend on a session. Many of these do not; then leave them out and
  put the cégjegyzékszám in `identifier` instead.

Person: LinkedIn profile, Companies House officer page
(`…/officers/<id>/appointments`) for UK directors, a professional register entry.
Never a placeholder officer id.

Leave out: `g.page` short links and `maps.app.goo.gl` share links (redirects),
low-quality citation directories, any profile you could not open.

## Google Maps link (hasMap and sameAs)

Get it from the Places API, not from arithmetic:

1. Find the Place ID: https://developers.google.com/maps/documentation/places/web-service/place-id
   (Place ID Finder) or a Text Search request.
2. Place Details (New) with field mask `googleMapsUri` returns the canonical Maps
   URL for the place. That URL goes into `hasMap` and `sameAs`.
3. Without API access, the Maps URLs format
   `https://www.google.com/maps/search/?api=1&query=<url-encoded name>&query_place_id=<PLACE_ID>`
   is the documented way to link a specific place.

Do not derive a `?cid=` number from the hex pair in a Maps URL. The method is
undocumented, and the number shipped in the old skills and in the template demo
config (`10222747834737099273`) is not even the correct conversion of its own
example hex (`0x8db3afbdd3f2b209` = `10210698010018624009`).

## GBP alignment

Google's guidelines ask that structured data match the visible page and that the
Business Profile be kept current. Keeping the two identical avoids Google seeing
two versions of the business.

| Field | Rule |
|---|---|
| `name` | The real-world name used on signage, site and GBP. Not the legal name with "Ltd"/"Kft." unless that is how the business presents itself; the legal name goes in `legalName`. No keywords or taglines in either (GBP guidelines forbid them in the name). |
| `address` | Same as GBP. For a service-area business that hides its address in GBP: no `streetAddress`, no `geo`; keep `addressLocality`, `addressRegion`, `addressCountry`, and `postalCode` only if the site shows it. |
| `telephone` | Same number as GBP, in international form (`+44…`, `+36…`). |
| `openingHoursSpecification` | Same hours as GBP, full day names. Seasonal or holiday hours with `validFrom` / `validThrough`. |
| Services | Each GBP service or category maps to a service page with its Service node. |

## Hungarian address and identifiers

- `addressCountry: "HU"`, `postalCode` the four-digit irányítószám, `addressLocality`
  the town (for Budapest: "Budapest", district in `streetAddress` or as
  "Budapest, XI. kerület" only if the site writes it that way), `addressRegion` the
  vármegye if the site shows it.
- `taxID`: adószám `12345678-1-23`. `vatID`: közösségi adószám `HU12345678`.
- `identifier`: `{ "@type": "PropertyValue", "propertyID": "cégjegyzékszám", "value": "01-09-123456" }`.
  For an egyéni vállalkozó, the nyilvántartási szám in the same shape.
- `legalName`: the registered name, e.g. "Example Költöztetés Kft.".
