---
name: astro-seo
description: Technical SEO implementation for Astro lead generation websites. Use when adding meta tags, Schema.org markup, sitemaps, or any search engine optimization. Works with astro-architecture for base setup.
---

# Astro SEO Skill

Technical and on-page SEO for lead generation sites. No keyword research, no content strategy, no link building — pure technical implementation.

## Core Rules (Non-Negotiable)

Every indexable page MUST have:

1. **Unique `<title>`** — 50-60 chars, primary keyword near start
2. **Unique `<meta description>`** — 150-160 chars, includes CTA hint
3. **Self-referencing canonical** — Points to itself, absolute URL
4. **Exactly one `<h1>`** — Matches page intent
5. **Indexable content without JS** — Content in initial HTML
6. **At least one internal link pointing to it** — No orphan pages
7. **Schema.org markup** — Minimum: Organization or LocalBusiness

## URL & Crawl Policy

- URLs MUST be lowercase
- URLs MUST NOT have trailing slash (pick one, be consistent)
- One URL = one intent (no duplicate content)
- Query parameter URLs MUST be noindex or canonicalized
- Faceted/filter URLs MUST be noindex
- Pagination page 2+ SHOULD be noindex, canonical to page 1
- Paginated pages MUST NOT canonicalize to page 1 unless intentionally consolidated

## HTTP Status Code Policy

| Code | Use For |
|------|---------|
| 200 | Indexable content only |
| 301 | Permanent redirects (content moved forever) |
| 302 | Temporary redirects (campaigns, A/B tests) |
| 404 | Non-existing content |
| 410 | Intentionally removed content |

Never return 200 for error states or empty pages.

## Internal Linking Rules

- No indexable page may be orphaned (FAIL if unreachable)
- Breadcrumbs REQUIRED for hierarchical pages (service > sub-service)
- Anchor text MUST be descriptive (❌ "click here", ❌ "read more")
- Footer links don't count as primary internal links

## Forbidden (STOP)

STOP and fix if any of these occur:

- ❌ Duplicate `<title>` across pages
- ❌ Duplicate `<meta description>` across pages
- ❌ Missing or wrong canonical URL
- ❌ Multiple `<h1>` tags on page
- ❌ Orphan page (no internal links pointing to it)
- ❌ Indexable page with only JS-rendered content
- ❌ Hydration that changes indexable content (client-side content swap)
- ❌ Soft 404 (200 status with no real content)
- ❌ Placeholder/thin content on indexable URLs
- ❌ Schema.org validation errors
- ❌ Missing OG image
- ❌ Broken internal links (404s)
- ❌ Query string URLs indexed
- ❌ Staging/dev URLs indexed
- ❌ Review schema without real reviews
- ❌ Auto-generated schema spam

## Structured Data Rules

### Mandatory (Every Site)

| Schema | Where |
|--------|-------|
| Organization OR LocalBusiness | Homepage |
| WebSite | Homepage |
| BreadcrumbList | All pages except homepage |

### Conditional

| Schema | When |
|--------|------|
| FAQPage | If FAQ section exists |
| Service | Service pages |
| Article | Blog posts |
| Product | E-commerce (rare for lead gen) |

### Forbidden

- Review/AggregateRating without real reviews
- Schema that doesn't match visible content
- Excessive schema (more than 3-4 types per page)

## Required Elements Per Page

| Element | Location | Required |
|---------|----------|----------|
| `<title>` | `<head>` | ✓ Always |
| `<meta name="description">` | `<head>` | ✓ Always |
| `<link rel="canonical">` | `<head>` | ✓ Always |
| `<meta property="og:*">` | `<head>` | ✓ Always |
| `<meta name="twitter:*">` | `<head>` | ✓ Always |
| Schema.org JSON-LD | `<head>` or `<body>` | ✓ Always |
| hreflang | `<head>` | If multi-lang |
| `<meta name="robots">` | `<head>` | If noindex needed |

## OG Image Spec

| Property | Value |
|----------|-------|
| Size | 1200 × 630px |
| Format | JPG or PNG |
| Max file size | 300KB |
| Content | Logo + tagline + brand colors |
| Location | `/public/og-image.jpg` |

Create page-specific OG images for key landing pages.

## References

### Required (Always Read)

- [meta.md](references/meta.md) — Meta tags, OG, Twitter implementation
- [schema.md](references/schema.md) — All Schema.org components

### Conditional

- [sitemap.md](references/sitemap.md) — Sitemap + robots.txt setup
- [validation.md](references/validation.md) — Testing and validation tools

## Definition of Done

SEO is complete when ALL are true:

### Meta & Content (Zero Tolerance)
- [ ] 0 duplicate `<title>` tags
- [ ] 0 duplicate `<meta description>` tags
- [ ] 0 pages with multiple `<h1>`
- [ ] 0 orphan pages
- [ ] 0 broken internal links

### Technical
- [ ] Lighthouse SEO score = 100
- [ ] Every page has self-referencing canonical
- [ ] Content renders without JavaScript
- [ ] OG image exists and is 1200×630px
- [ ] Sitemap contains only indexable URLs
- [ ] robots.txt exists with sitemap reference
- [ ] No query parameter URLs in sitemap

### Schema
- [ ] Homepage has LocalBusiness + WebSite schema
- [ ] All pages have BreadcrumbList (except homepage)
- [ ] FAQ sections have FAQPage schema
- [ ] 0 schema validation errors (test at schema.org validator)
- [ ] 0 errors in Google Rich Results Test

### Multi-Language (if applicable)
- [ ] hreflang on every page including x-default
- [ ] Each language has own sitemap or sitemap entries

### Pre-Launch
- [ ] Staging has noindex
- [ ] Production has index
- [ ] Sitemap submitted to Search Console

### Monitoring (Required)
- [ ] Google Search Console configured for production domain
- [ ] Index coverage errors reviewed before launch
