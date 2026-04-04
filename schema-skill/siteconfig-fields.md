# siteConfig Fields Required for Schema

This documents which siteConfig fields the schema.ts bridge uses, and what to check before running schema assembly.

## Identity (all required)

| Field            | Used for                          | Validation                     |
|------------------|-----------------------------------|--------------------------------|
| `name`           | Business name in all entities     | Must match GBP exactly         |
| `legalName`      | LocalBusiness.legalName           | Must match Companies House     |
| `description`    | LocalBusiness.description         | Homepage meta description      |
| `url`            | Base URL for all @ids and URLs    | No trailing slash              |
| `locale`         | knowsLanguage derivation          | e.g. `en-GB`                   |
| `currency`       | Offer.priceCurrency               | e.g. `GBP`                     |
| `foundedYear`    | LocalBusiness.foundingDate        | Integer year                   |
| `schemaType`     | LocalBusiness @type               | Most specific subtype          |
| `googleMapsCid`  | hasMap + sameAs[0]                | `https://www.google.com/maps?cid=DECIMAL` |
| `priceRange`     | LocalBusiness.priceRange          | `£` to `££££`                  |
| `paymentAccepted`| LocalBusiness.paymentAccepted     | Actual methods accepted        |

### Finding googleMapsCid

The Google Maps CID is NOT the `g.page/business` short link. To find it:

1. Open Google Maps, find your business
2. URL contains something like `0x48718e13ad3bec67:0x8db3afbdd3f2b209`
3. Take the hex after the second `0x`: `8db3afbdd3f2b209`
4. Convert hex to decimal → that's your CID
5. Result: `https://www.google.com/maps?cid=10222747834737099273`

### Choosing schemaType

Use the most specific subtype from https://schema.org/LocalBusiness:

| Business type           | schemaType              |
|-------------------------|-------------------------|
| Removal company         | `MovingCompany`         |
| Beauty salon            | `BeautySalon`           |
| Plumber                 | `Plumber`               |
| Electrician             | `Electrician`           |
| Accountant              | `AccountingService`     |
| Lawyer                  | `LegalService`          |
| Dentist                 | `Dentist`               |
| Generic professional    | `ProfessionalService`   |

If no specific subtype exists, use `ProfessionalService`.

---

## People (min 1 required)

| Field      | Used for                          | Notes                          |
|------------|-----------------------------------|--------------------------------|
| `name`     | Person.name                       | Full name                      |
| `slug`     | @id generation + URL              | e.g. `jay-sheridan`            |
| `role`     | Display only (not in schema)      | Marketing-friendly title       |
| `jobTitle` | Person.jobTitle + hasOccupation   | Formal title for schema        |
| `image`    | Person.image                      | Path from site root            |
| `bio`      | Person.description                | Factual, not marketing         |
| `featured` | Determines founder link           | First featured person = founder|
| `sameAs`   | Person.sameAs                     | LinkedIn + Companies House officer |

### Person sameAs rules

Only include URLs that clearly identify THIS exact person:
- LinkedIn: must be their real profile URL
- Companies House officer: `https://find-and-update.company-information.service.gov.uk/officers/ID/appointments`
- No weak or doubtful URLs

---

## Contact (required)

| Field         | Used for                   |
|---------------|----------------------------|
| `phone`       | LocalBusiness.telephone    |
| `email`       | LocalBusiness.email        |

Phone must be E.164 format: `+441171234567`

---

## Address (required)

| Field      | Used for                          |
|------------|-----------------------------------|
| `street`   | PostalAddress.streetAddress        |
| `city`     | PostalAddress.addressLocality      |
| `region`   | PostalAddress.addressRegion        |
| `postcode` | PostalAddress.postalCode           |
| `country`  | PostalAddress.addressCountry       |
| `geo.lat`  | GeoCoordinates.latitude            |
| `geo.lng`  | GeoCoordinates.longitude           |

If service-area business hiding address on GBP: still include in config, the schema bridge maps it directly. If you need to hide streetAddress from schema output, modify `buildAddress()`.

Geo coordinates must have minimum 4 decimal places and be exact.

---

## Legal

| Field           | Used for                              |
|-----------------|---------------------------------------|
| `companyNumber` | Auto-generates Companies House sameAs |

The Companies House URL is built automatically:
`https://find-and-update.company-information.service.gov.uk/company/${companyNumber}`

---

## Assets

| Field      | Used for                          |
|------------|-----------------------------------|
| `logo`     | LocalBusiness.logo (ImageObject)   |
| `ogImage`  | LocalBusiness.image (ImageObject)  |
| `ogWidth`  | ImageObject.width                  |
| `ogHeight` | ImageObject.height                 |

All paths are relative to site root. The bridge prepends `config.url`.

---

## Reviews (min 1 required)

| Field      | Used for                              |
|------------|---------------------------------------|
| `platform` | Trustpilot/Yell → added to sameAs     |
| `rating`   | Weighted average for AggregateRating   |
| `count`    | Total reviewCount                      |
| `url`      | Trustpilot/Yell sameAs                 |

AggregateRating is auto-calculated:
- `ratingValue` = weighted average (rating × count / totalCount)
- `reviewCount` = sum of all counts

Rules:
- Numbers must match real review counts
- Visible page must state aggregation with breakdown
- Update at every deploy

---

## Services (min 1 required)

| Field              | Used for                          |
|--------------------|-----------------------------------|
| `name`             | Service.name + OfferCatalog       |
| `slug`             | @id generation + URL              |
| `shortDescription` | Service.description               |
| `serviceType`      | Service.serviceType               |

`serviceType` is the schema.org descriptor, NOT the marketing name:
- "House Moving Service" not "House Removals"
- "Commercial Moving Service" not "Office Removals"

If `serviceType` is missing, falls back to `name`.

---

## Areas (min 1 required)

| Field              | Used for                              |
|--------------------|---------------------------------------|
| `name`             | Place.name in areaServed               |
| `slug`             | URL generation                         |
| `county`           | AdministrativeArea in containedInPlace  |
| `featured`         | Included in homepage areaServed        |

Only `featured: true` areas appear on the homepage entity. All areas are available for area page schema.

`county` maps to `AdministrativeArea` (not City) in containedInPlace.

---

## Hours (min 1 required)

| Field   | Used for                              |
|---------|---------------------------------------|
| `days`  | OpeningHoursSpecification.dayOfWeek    |
| `opens` | OpeningHoursSpecification.opens        |
| `closes`| OpeningHoursSpecification.closes       |

Days must be full names: `Monday`, `Tuesday`, etc. (not abbreviations).
Times in HH:mm format.
Must match GBP hours exactly.

---

## Social

| Field       | Used for              |
|-------------|-----------------------|
| `facebook`  | sameAs                |
| `instagram` | sameAs                |
| `linkedin`  | sameAs                |
| `youtube`   | sameAs                |
| `tiktok`    | sameAs                |
| `google`    | NOT used in sameAs (use googleMapsCid instead) |

Only populated social profiles are included in sameAs. The bridge skips `undefined` values.

---

## Pre-flight Checklist

Before running schema assembly, verify:

- [ ] `name` matches GBP character-for-character
- [ ] `schemaType` is the most specific LocalBusiness subtype
- [ ] `googleMapsCid` is set (not a g.page link)
- [ ] `address` matches GBP including formatting
- [ ] `geo` has min 4 decimal places, exact location
- [ ] `hours` match GBP exactly
- [ ] `people[0]` has `slug`, `jobTitle`, `sameAs`
- [ ] `services[]` all have `serviceType`
- [ ] `reviews[]` numbers match real verifiable counts
- [ ] `legal.companyNumber` is set
- [ ] All social URLs resolve and are real business profiles
