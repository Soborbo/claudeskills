# Hreflang Reference

Complete hreflang implementation guide for SEO-optimized multilingual sites.

## Hreflang Syntax

```html
<link rel="alternate" hreflang="language-region" href="absolute-url" />
```

### Language Codes (ISO 639-1)

| Code | Language |
|------|----------|
| en | English |
| hu | Hungarian |
| de | German |
| fr | French |
| es | Spanish |
| it | Italian |
| nl | Dutch |
| pl | Polish |
| pt | Portuguese |
| ro | Romanian |
| cs | Czech |
| sk | Slovak |

### Region Codes (ISO 3166-1 Alpha-2)

| Code | Region |
|------|--------|
| GB | United Kingdom |
| US | United States |
| HU | Hungary |
| DE | Germany |
| AT | Austria |
| CH | Switzerland |

### Combined Examples

```html
<!-- Language only -->
<link rel="alternate" hreflang="en" href="https://example.com/page" />

<!-- Language + Region -->
<link rel="alternate" hreflang="en-GB" href="https://example.com/en-gb/page" />
<link rel="alternate" hreflang="en-US" href="https://example.com/en-us/page" />
<link rel="alternate" hreflang="de-DE" href="https://example.com/de/page" />
<link rel="alternate" hreflang="de-AT" href="https://example.com/de-at/page" />
```

## x-default Explained

The `x-default` hreflang value signals a fallback page for users whose language/region isn't explicitly covered.

### Use Cases

1. **Language selector page**: Homepage with language picker
2. **Most common language**: Default to English for unmatched
3. **Geo-detection page**: Redirects based on IP/browser

### Implementation

```html
<!-- Standard x-default pointing to default locale -->
<link rel="alternate" hreflang="x-default" href="https://example.com/" />

<!-- All hreflang tags for a page -->
<link rel="alternate" hreflang="en" href="https://example.com/about" />
<link rel="alternate" hreflang="hu" href="https://example.com/hu/about" />
<link rel="alternate" hreflang="x-default" href="https://example.com/about" />
```

### x-default Decision Tree

```
Is there a language selector/splash page?
├── Yes → x-default = language selector URL
└── No
    └── What's the global default?
        ├── English (most common) → x-default = /en/ version
        └── Site's primary language → x-default = default locale URL
```

## Complete Hreflang Examples

### Scenario 1: Simple Bilingual Site (EN default, HU secondary)

**English page: `/about`**
```html
<link rel="canonical" href="https://example.com/about" />
<link rel="alternate" hreflang="en" href="https://example.com/about" />
<link rel="alternate" hreflang="hu" href="https://example.com/hu/about" />
<link rel="alternate" hreflang="x-default" href="https://example.com/about" />
```

**Hungarian page: `/hu/about`**
```html
<link rel="canonical" href="https://example.com/hu/about" />
<link rel="alternate" hreflang="en" href="https://example.com/about" />
<link rel="alternate" hreflang="hu" href="https://example.com/hu/about" />
<link rel="alternate" hreflang="x-default" href="https://example.com/about" />
```

### Scenario 2: Regional Variants (UK English, US English, German)

```html
<!-- UK English version -->
<link rel="canonical" href="https://example.com/en-gb/pricing" />
<link rel="alternate" hreflang="en-GB" href="https://example.com/en-gb/pricing" />
<link rel="alternate" hreflang="en-US" href="https://example.com/en-us/pricing" />
<link rel="alternate" hreflang="de" href="https://example.com/de/pricing" />
<link rel="alternate" hreflang="x-default" href="https://example.com/en-gb/pricing" />
```

### Scenario 3: Page Not Available in All Languages

If `/contact` only exists in English:

```html
<!-- Only English version exists -->
<link rel="canonical" href="https://example.com/contact" />
<link rel="alternate" hreflang="en" href="https://example.com/contact" />
<link rel="alternate" hreflang="x-default" href="https://example.com/contact" />
<!-- No Hungarian hreflang - page doesn't exist -->
```

## Critical Rules

### 1. Self-Referencing Required

Every page MUST include a hreflang tag pointing to itself:

```html
<!-- On /hu/about page -->
<link rel="alternate" hreflang="hu" href="https://example.com/hu/about" />
```

### 2. Bidirectional Linking

If page A links to page B via hreflang, page B MUST link back to A:

```
/en/about → hreflang="hu" → /hu/about
/hu/about → hreflang="en" → /en/about  ✓ Required!
```

### 3. Absolute URLs Only

```html
<!-- ✓ Correct -->
<link rel="alternate" hreflang="en" href="https://example.com/about" />

<!-- ✗ Wrong -->
<link rel="alternate" hreflang="en" href="/about" />
```

### 4. Canonical Alignment

The canonical URL must match one of the hreflang URLs exactly:

```html
<!-- ✓ Correct: canonical matches self-referencing hreflang -->
<link rel="canonical" href="https://example.com/hu/about" />
<link rel="alternate" hreflang="hu" href="https://example.com/hu/about" />

<!-- ✗ Wrong: canonical differs from hreflang -->
<link rel="canonical" href="https://example.com/hu/about/" />  <!-- trailing slash -->
<link rel="alternate" hreflang="hu" href="https://example.com/hu/about" />
```

### 5. No Redirects or 404s

Hreflang URLs must be:
- Indexable (not noindexed)
- Not redirecting
- Not returning 404
- Not blocked by robots.txt

## Implementation Methods

### Method 1: HTML `<head>` Tags (Recommended for SSG)

```html
<head>
  <link rel="alternate" hreflang="en" href="https://example.com/page" />
  <link rel="alternate" hreflang="hu" href="https://example.com/hu/page" />
  <link rel="alternate" hreflang="x-default" href="https://example.com/page" />
</head>
```

**Pros**: Easy to implement, works with any static site
**Cons**: Increases HTML size

### Method 2: XML Sitemap

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://example.com/about</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://example.com/about"/>
    <xhtml:link rel="alternate" hreflang="hu" href="https://example.com/hu/about"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/about"/>
  </url>
  <url>
    <loc>https://example.com/hu/about</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://example.com/about"/>
    <xhtml:link rel="alternate" hreflang="hu" href="https://example.com/hu/about"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/about"/>
  </url>
</urlset>
```

**Pros**: Keeps HTML clean, centralized management
**Cons**: Google may not process as quickly as HTML

### Method 3: HTTP Headers (for PDFs, non-HTML)

```
Link: <https://example.com/doc.pdf>; rel="alternate"; hreflang="en",
      <https://example.com/hu/doc.pdf>; rel="alternate"; hreflang="hu",
      <https://example.com/doc.pdf>; rel="alternate"; hreflang="x-default"
```

**Pros**: Works for non-HTML files
**Cons**: Requires server configuration

## Common Mistakes

### 1. Missing Self-Reference

```html
<!-- ✗ Missing self-referencing tag on /hu/page -->
<link rel="alternate" hreflang="en" href="https://example.com/page" />
<!-- Where's hreflang="hu"? -->
```

### 2. One-Way Links

```html
<!-- ✗ /en/page links to /hu/page but /hu/page doesn't link back -->
```

### 3. Wrong Language Codes

```html
<!-- ✗ Wrong: 'uk' is Ukrainian, not United Kingdom -->
<link rel="alternate" hreflang="uk" href="..." />

<!-- ✓ Correct: en-GB for UK English -->
<link rel="alternate" hreflang="en-GB" href="..." />
```

### 4. Relative URLs

```html
<!-- ✗ Wrong -->
<link rel="alternate" hreflang="en" href="/page" />
```

### 5. Inconsistent Trailing Slashes

```html
<!-- ✗ Inconsistent -->
<link rel="canonical" href="https://example.com/page/" />
<link rel="alternate" hreflang="en" href="https://example.com/page" />
```

## Testing Tools

1. **Google Search Console**: International Targeting report
2. **Aleyda Solis Hreflang Generator**: https://www.aleydasolis.com/english/international-seo-tools/hreflang-tags-generator/
3. **Merkle Hreflang Testing Tool**: https://technicalseo.com/tools/hreflang/
4. **Screaming Frog**: Hreflang audit
5. **Browser DevTools**: View source, check `<head>`

## TypeScript Implementation

```typescript
interface HreflangConfig {
  locales: readonly string[];
  defaultLocale: string;
  xDefaultLocale: string;
  siteUrl: string;
}

interface HreflangTag {
  hreflang: string;
  href: string;
}

function generateHreflangTags(
  config: HreflangConfig,
  currentPath: string,
  availableLocales?: string[]
): HreflangTag[] {
  const { locales, xDefaultLocale, siteUrl, defaultLocale } = config;
  const activeLocales = availableLocales ?? locales;
  
  const tags: HreflangTag[] = activeLocales.map((locale) => ({
    hreflang: locale,
    href: locale === defaultLocale 
      ? `${siteUrl}${currentPath}`
      : `${siteUrl}/${locale}${currentPath}`,
  }));
  
  // Add x-default
  const xDefaultUrl = xDefaultLocale === defaultLocale
    ? `${siteUrl}${currentPath}`
    : `${siteUrl}/${xDefaultLocale}${currentPath}`;
    
  tags.push({
    hreflang: 'x-default',
    href: xDefaultUrl,
  });
  
  return tags;
}
```
