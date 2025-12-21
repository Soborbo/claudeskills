---
name: astro-blog
description: Blog and content patterns for Astro sites. Article pages, listings, categories, author pages, SEO for content. Use for content marketing implementation.
---

# Astro Blog Skill

## Purpose

Provides blog/content patterns for lead generation sites with SEO-focused content marketing. Implements content collections, article pages, listing pages, and RSS feeds optimized for conversion and search visibility.

## Core Rules

1. **Lead gen focused** — Every article must have at least one CTA
2. **SEO optimized** — Proper schema.org markup, meta tags, heading hierarchy
3. **Fast loading** — Lazy load images, minimal JS, optimized formats (avif, webp)
4. **Shareable** — Open Graph and Twitter cards on all articles
5. **Scannable** — Clear headings, short paragraphs, bullet points
6. **Content-first** — No thin content, minimum 500 words per article
7. **Structured data** — Article schema on every post
8. **Reading time** — Calculate and display reading time (200 words/min)
9. **Related content** — Show 3 related posts by category
10. **RSS enabled** — Provide RSS feed for subscribers

## File Structure

```
src/
├── content/
│   ├── config.ts          # Content collection schema
│   └── blog/              # Blog posts (markdown)
│       └── post-slug.md
├── pages/
│   ├── blog/
│   │   ├── index.astro    # Listing page
│   │   ├── [slug].astro   # Article template
│   │   └── category/
│   │       └── [cat].astro
│   └── rss.xml.ts         # RSS feed
└── components/
    ├── PostCard.astro     # Blog card
    ├── RelatedPosts.astro
    ├── AuthorCard.astro
    └── CTABanner.astro
```

## Article Frontmatter Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | Yes | Under 60 chars for SEO |
| description | string | Yes | Max 160 chars |
| pubDate | date | Yes | Publication date |
| category | string | Yes | For filtering/related |
| author | string | No | Defaults to 'Team' |
| image | image | No | Featured image |
| tags | array | No | For tag pages |
| draft | boolean | No | Defaults to false |

## References

- [Content Collection Schema](references/content-collection.md) - Collection config and schema definition
- [Templates](references/templates.md) - Article page, listing page, post card, related posts components
- [RSS & Sitemap](references/rss-sitemap.md) - RSS feed implementation
- [Content Guidelines](references/content-guidelines.md) - Article structure, SEO checklist, writing best practices

## Forbidden

- Articles without CTA
- Missing meta description
- Stock images without customization
- Thin content (less than 500 words)
- Duplicate content
- Orphan pages (no internal links)
- Missing alt text on images
- Multiple H1 tags

## Definition of Done

- [ ] Content collection configured with proper schema
- [ ] Article template with schema.org markup
- [ ] Listing page with category filtering
- [ ] Category pages implemented
- [ ] Related posts component working
- [ ] RSS feed generated at /rss.xml
- [ ] Each article has at least one CTA
- [ ] Proper heading hierarchy (one H1, logical H2/H3)
- [ ] Images optimized (avif, webp formats)
- [ ] Reading time calculated and displayed
- [ ] Breadcrumbs on article pages
- [ ] Open Graph meta tags
