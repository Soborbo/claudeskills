# SEO Audit Checks

## Page-Level Requirements

Every page MUST have:

| Element | Requirement |
|---------|-------------|
| `<title>` | Unique, 50-60 chars, keyword + brand |
| `meta description` | Unique, 150-160 chars, CTA included |
| `canonical` | Self-referencing or correct target |
| `h1` | Exactly one per page |
| `lang` | On `<html>` element |
| OG tags | title, description, image, url |

## Technical SEO

```bash
# Check all pages have titles
for file in src/pages/*.astro; do
  grep -L "<title>" "$file" && echo "Missing title: $file"
done

# Check for duplicate titles
grep -rh "<title>" src/ | sort | uniq -d

# Check canonical URLs
grep -rn "canonical" src/layouts/

# Check robots meta
grep -rn "noindex" src/
```

## Structured Data

Required schemas:

| Page Type | Schema |
|-----------|--------|
| Homepage | LocalBusiness, Organization |
| Service page | Service, FAQPage |
| Contact | ContactPage |
| About | AboutPage |

```bash
# Check for schema markup
grep -rn "application/ld+json" src/
grep -rn "itemtype\|itemscope" src/
```

## URL Structure

**Rules:**
- Lowercase only
- Hyphens, no underscores
- No trailing slashes (or consistent)
- No query params for content
- Max 3 levels deep

```bash
# Check for uppercase in URLs
find src/pages -name "*[A-Z]*"

# Check for underscores
find src/pages -name "*_*"
```

## Image SEO

```bash
# All images need alt text
grep -rn "<img" src/ | grep -v "alt="
grep -rn "<Image" src/ | grep -v "alt="
grep -rn "<Picture" src/ | grep -v "alt="

# Check for descriptive filenames
ls src/assets/images/
# Bad: IMG_1234.jpg
# Good: bristol-office-team.jpg
```

## Internal Linking

```bash
# Find broken internal links
grep -rn 'href="/' src/ --include="*.astro" | head -20

# Check for orphan pages
# Every page should be linked from at least one other page
```

## Sitemap & Robots

```bash
# Verify sitemap config
grep -A5 "sitemap" astro.config.mjs

# Check robots.txt
cat public/robots.txt

# Required robots.txt content:
# User-agent: *
# Allow: /
# Sitemap: https://example.com/sitemap-index.xml
```

## Mobile SEO

```bash
# Check viewport meta
grep -rn "viewport" src/layouts/

# Required:
# <meta name="viewport" content="width=device-width, initial-scale=1">
```

## Page Speed Factors

| Factor | Check |
|--------|-------|
| LCP image | `fetchpriority="high"` on hero |
| Font loading | `font-display: swap` |
| CSS | Critical CSS inlined |
| JS | Deferred/async loading |
| Images | Lazy loaded below fold |

## Pre-Launch SEO Checklist

- [ ] All pages have unique title + description
- [ ] H1 on every page (exactly one)
- [ ] Canonical URLs set
- [ ] OG + Twitter cards on all pages
- [ ] Schema markup validated (Google Rich Results Test)
- [ ] Sitemap generating correctly
- [ ] robots.txt allows crawling
- [ ] No accidental noindex on production
- [ ] 301 redirects for old URLs (if migration)
- [ ] Mobile-friendly test passed
- [ ] Core Web Vitals green
