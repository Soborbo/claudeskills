---
name: schema-entity-graph
description: Build and assemble a complete Schema.org entity graph for Astro lead-gen sites, driven from siteConfig. Use whenever a project needs JSON-LD structured data — new site setup, schema implementation, adding schema to existing pages, or when the user mentions entity graph, schema components, JSON-LD setup, structured data system, or knowledge graph. Also triggers when building a new Astro project that needs SEO schema, implementing service/area/blog schemas, or connecting business + person + service entities. Works with the schema-audit skill (audit validates rules; this skill builds the implementation). Always use this skill for schema assembly — never write schema components from scratch without it.
---

# Schema Entity Graph — Astro Implementation Skill

## Purpose

Assemble a complete, cross-linked Schema.org entity graph for UK local service business sites. All data derives from a single `siteConfig` — no hardcoded business data in schema files.

**This skill builds. The schema-audit skill validates.** Use both together.

---

## Architecture

```
src/config/
├── siteConfig.ts          ← Zod schema (type definitions + validation)
├── siteConfig.example.ts  ← Actual project data (single source of truth)
└── schema.ts              ← JSON-LD generators (derives everything from siteConfig)
```

**No data lives in schema.ts.** It imports siteConfig and transforms it into JSON-LD.
Every function takes `config: SiteConfig` as first argument.

---

## Entity Graph

```
                    ┌─────────────┐
                    │   WebSite   │
                    │  #website   │
                    └──────┬──────┘
                           │ publisher
                           ▼
┌──────────┐      ┌─────────────────┐      ┌──────────┐
│  Person  │◄─────│  LocalBusiness  │─────►│  Service  │
│ /#person │      │   #business     │      │ /url#svc  │
│          │      │                 │      │           │
│ worksFor─┼─────►│ founder         │      │ provider──┼──┐
└──────────┘      │ sameAs[]        │      │ areaServed│  │
     │            │ aggregateRating │      └───────────┘  │
     │            │ hasOfferCatalog─┼──────────────────────┘
     │            │ knowsAbout[]    │
     │            └─────────────────┘
     │                     ▲
     │            mainEntity│
     │            ┌────────┴────────┐
     │            │   AboutPage     │
     │            │   ContactPage   │
     │            └─────────────────┘
     │
     │  author
     │◄──────────┐
┌────┴─────┐  ┌──┴────────┐  ┌─────────────┐
│ProfilePage│  │  Article  │  │WebApplication│
│/#webpage  │  │/blog/...  │  │  /calc#app  │
└──────────┘  └───────────┘  └─────────────┘
```

---

## Core Rules

### 1. One entity, one @id, one declaration

| Entity         | @id pattern                              | Declared by           |
|----------------|------------------------------------------|-----------------------|
| Business       | `https://domain.com#business`            | `homepageSchema()`    |
| WebSite        | `https://domain.com#website`             | `homepageSchema()`    |
| Person/Author  | `https://domain.com/about/slug/#person`  | `personSchema()`      |
| Service        | `https://domain.com/slug/#service`       | `serviceSchema()`     |
| Area Service   | `https://domain.com/svc/area/#service`   | `areaServiceSchema()` |
| WebApplication | `https://domain.com/slug/#webapp`        | `calculatorSchema()`  |

Root-level entities (`#business`, `#website`) have no path before the hash — this is the actual output of the `id()` helper when path is `/`. Inner entities retain their path slash.

### 2. @id generation

The `id()` helper handles all @id generation:
- Always full URL + hash fragment
- Never bare `#fragment`
- Strips trailing slashes to prevent `//` in URLs
- Root path (`/`) resolves to `https://domain.com#fragment`

### 3. What derives automatically from siteConfig

| Schema field             | Derived from                              |
|--------------------------|-------------------------------------------|
| slogan                   | `tagline`                                 |
| sameAs (business)        | `googleMapsCid` + `social.*` + `reviews[Trustpilot/Yell].url` + `legal.companyNumber` |
| AggregateRating          | Weighted average across all `reviews[]`   |
| areaServed (homepage)    | `areas[].featured === true` + country from `address.country` + `serviceArea` GeoCircle if set |
| hasOfferCatalog          | `services[]` with @id per service         |
| knowsAbout               | `services[].serviceType \|\| name`        |
| knowsLanguage            | `locale.split('-')[0]`                    |
| openingHoursSpecification| `hours[]` (full day names)                |
| address / geo            | `address.*` direct mapping                |
| photo                    | `assets.heroImage` (if set)               |
| potentialAction          | `contact.bookingUrl` → ReserveAction (if set) |
| founder                  | First `people[].featured === true`        |
| Person.hasOccupation     | `people[].jobTitle` + `people[].role` as description |
| Person.sameAs            | `people[].sameAs[]`                       |
| Person.knowsAbout        | Same as business (from services)          |
| canonical URLs           | `seo.canonicalBase` (if set, otherwise `url`) |

### 4. Page → Generator map

| Page Type     | Generator function       | Includes breadcrumb? |
|---------------|--------------------------|----------------------|
| Homepage      | `homepageSchema()`       | No (single item)     |
| Contact       | `contactPageSchema()`    | Yes                  |
| About         | `aboutPageSchema()`      | Yes                  |
| Service Hub   | `collectionPageSchema()` | Yes                  |
| Service Page  | `serviceSchema()`        | Yes                  |
| Area Page     | `areaServiceSchema()`    | Yes                  |
| Blog Post     | `articleSchema()`        | Yes                  |
| Author Page   | `personSchema()`         | No — add manually     |
| FAQ section   | `faqSchema()`            | No (combine in @graph)|
| Video         | `videoSchema()`          | No (combine in @graph)|
| Calculator    | `calculatorSchema()`     | Yes                  |

**Author page breadcrumb:** `personSchema()` does not include breadcrumb because the path varies. Add it manually:

```astro
---
const schema = personSchema(config, 'jay-sheridan');
schema['@graph'].push(breadcrumbSchema(config, [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about/' },
  { name: 'Jay Sheridan', path: '/about/jay-sheridan/' },
]));
---
<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

### 5. Entity cross-references

| From             | Property          | To                 |
|------------------|-------------------|--------------------|
| WebSite          | publisher         | LocalBusiness @id  |
| LocalBusiness    | founder           | Person @id         |
| LocalBusiness    | hasOfferCatalog   | Service @ids       |
| Service          | provider          | LocalBusiness @id  |
| Article          | author            | Person @id         |
| Article          | publisher         | LocalBusiness @id  |
| Article          | isPartOf          | WebSite @id        |
| Person           | worksFor          | LocalBusiness @id  |
| ProfilePage      | mainEntity        | Person @id         |
| ProfilePage      | isPartOf          | WebSite @id        |
| AboutPage        | mainEntity        | LocalBusiness @id  |
| ContactPage      | mainEntity        | LocalBusiness @id  |
| WebApplication   | provider          | LocalBusiness @id  |
| WebApplication   | isPartOf          | WebSite @id        |
| VideoObject      | publisher         | LocalBusiness @id  |

---

## Assembly Process

### Step 1: Verify siteConfig has required schema fields

Read [siteconfig-fields.md](./siteconfig-fields.md) for the full list.

Key fields that must be present in siteConfig for schema to work:

- `schemaType` — most specific LocalBusiness subtype
- `googleMapsCid` — Google Maps CID URL (not g.page link)
- `people[].slug` + `people[].sameAs` + `people[].jobTitle`
- `services[].serviceType` — schema.org descriptor
- `reviews[]` — at least one platform with real numbers
- `legal.companyNumber` — for Companies House sameAs
- `address.geo` — lat/lng with min 4 decimals
- `hours[]` — must match GBP exactly

If any are missing from the project's siteConfig, add them first.

### Step 2: Create schema.ts

Read [schema.ts](./schema.ts) and add it to the project at `src/config/schema.ts`.

It imports siteConfig and exports generator functions. Adapt URL patterns if the project uses non-standard routes (e.g. `/services/house-removals/` instead of `/house-removals/`).

### Step 3: Wire up in Astro pages

Each page calls the appropriate generator and renders the JSON-LD:

```astro
---
import { config } from '@/config/siteConfig.example';
import { homepageSchema } from '@/config/schema';
---
<head>
  <script type="application/ld+json" set:html={JSON.stringify(homepageSchema(config))} />
</head>
```

For pages that combine multiple schemas (e.g. service + FAQ):

```astro
---
import { config } from '@/config/siteConfig.example';
import { serviceSchema, faqSchema, breadcrumbSchema } from '@/config/schema';

const schema = serviceSchema(config, 'house-removals');
// Add FAQ to the existing @graph
schema['@graph'].push(faqSchema(faqData));
---
<head>
  <script type="application/ld+json" set:html={JSON.stringify(schema)} />
</head>
```

### Step 4: Validate

- [ ] Google Rich Results Test — zero errors per page
- [ ] Schema.org Validator — zero errors
- [ ] Every @id reference resolves to a declared entity
- [ ] No duplicate entity types per page
- [ ] Schema content matches visible page content
- [ ] Business info matches GBP exactly

---

## sameAs — Auto-generated

`buildSameAs()` automatically assembles business sameAs from siteConfig:

1. `googleMapsCid` (if present)
2. `social.facebook`, `.linkedin`, `.youtube`, `.instagram`, `.tiktok`
3. `reviews[]` where platform is Trustpilot or Yell
4. Companies House URL from `legal.companyNumber`

**Note:** `social.google` (the g.page link) is NOT included in sameAs. Use `googleMapsCid` instead — the CID URL is the canonical Maps identifier that Google uses for entity matching.

Person sameAs comes from `people[].sameAs[]` — LinkedIn + Companies House officer.

No manual sameAs list to maintain.

---

## AggregateRating — Auto-calculated

`buildAggregateRating()` computes weighted average from `reviews[]`:

```
totalCount = sum of all review counts
avgRating = sum(rating × count) / totalCount
```

Rules:
- The visible page must state reviews are aggregated with platform breakdown
- Numbers must match real, verifiable counts
- If accuracy cannot be maintained: remove `reviews[]` from siteConfig

---

## Area Pages — Critical Rule

`areaServiceSchema()` models area pages as: same service, different area served.
Uses `Service + provider → #business + areaServed → Place`.

`containedInPlace` uses `AdministrativeArea` for county (not City).

Does NOT put LocalBusiness on area pages.

---

## FAQ Schema — 2026 Status

FAQ rich results were fully removed in January 2026. FAQ schema still significantly increases AI search visibility — implement where genuine Q&A content exists on the page. Text must match visible content word-for-word.

---

## Forbidden

- Hardcoding business data in schema.ts (must come from siteConfig)
- Re-declaring full LocalBusiness on inner pages
- Separate Organization entity alongside LocalBusiness subtype
- LocalBusiness on area pages
- Schema content not matching visible page
- Fake/unverifiable reviews
- Relative URLs in schema
- Bare #fragment @ids
- `termsOfService` field on Service (noise, not SEO value)

---

## References

- [schema.ts](./schema.ts) — JSON-LD generators (add to project as `src/config/schema.ts`)
- [siteconfig-fields.md](./siteconfig-fields.md) — Required siteConfig fields for schema
- [siteConfig.ts](./siteConfig.ts) — Zod schema (type definitions + validation)
- [siteConfig.example.ts](./siteConfig.example.ts) — Example project data
