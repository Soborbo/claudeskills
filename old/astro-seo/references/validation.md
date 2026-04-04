# SEO Validation & Testing

## Required Tools

| Tool | Purpose | URL |
|------|---------|-----|
| Google Rich Results Test | Schema validation | https://search.google.com/test/rich-results |
| Schema.org Validator | Schema syntax | https://validator.schema.org/ |
| Facebook Sharing Debugger | OG tags | https://developers.facebook.com/tools/debug/ |
| Twitter Card Validator | Twitter cards | https://cards-dev.twitter.com/validator |
| Google PageSpeed Insights | Performance | https://pagespeed.web.dev/ |
| Google Search Console | Indexing | https://search.google.com/search-console |

## Pre-Launch Checklist

### Meta Tags
- [ ] Every page has unique `<title>`
- [ ] Every page has unique `<meta description>`
- [ ] Title is 50-60 characters
- [ ] Description is 150-160 characters
- [ ] No duplicate titles across site
- [ ] No duplicate descriptions across site

### Canonical & Indexing
- [ ] Every page has `<link rel="canonical">`
- [ ] Canonical points to correct URL
- [ ] No self-referencing canonical issues
- [ ] Thank you pages have `noindex`
- [ ] Staging/dev has `noindex`

### Open Graph
- [ ] `og:title` present
- [ ] `og:description` present
- [ ] `og:image` present
- [ ] `og:url` present
- [ ] OG image is 1200×630px
- [ ] OG image under 300KB
- [ ] Test in Facebook Debugger

### Twitter Cards
- [ ] `twitter:card` = "summary_large_image"
- [ ] `twitter:title` present
- [ ] `twitter:description` present
- [ ] `twitter:image` present
- [ ] Test in Twitter Validator

### Schema.org
- [ ] Homepage has LocalBusiness schema
- [ ] Homepage has WebSite schema
- [ ] FAQ sections have FAQPage schema
- [ ] Service pages have Service schema
- [ ] All pages validate without errors
- [ ] Test in Rich Results Test

### Sitemap & robots.txt
- [ ] sitemap-index.xml exists
- [ ] robots.txt exists
- [ ] robots.txt references sitemap
- [ ] Sitemap submitted to Search Console
- [ ] No important pages blocked

### Links
- [ ] No broken internal links (use Screaming Frog or similar)
- [ ] No orphan pages
- [ ] External links have `rel="noopener"`

## Common Errors & Fixes

### "Missing field 'image'" in Schema
```javascript
// Always include image in LocalBusiness
"image": new URL('/og-image.jpg', Astro.site).href
```

### Duplicate Title Tags
Check that each page sets its own title:
```astro
<SEO title="Unique Page Title" />
```

### OG Image Not Showing
1. Check image URL is absolute
2. Check image is publicly accessible
3. Clear Facebook cache via Debugger

### Schema Errors
1. Use JSON.stringify for data
2. Ensure all required fields present
3. Use correct @type values

## Automated Testing

Add to CI/CD:

```bash
# Check for broken links
npx broken-link-checker https://example.com --recursive

# Validate HTML
npx html-validate dist/**/*.html

# Check meta tags
npx seo-checker https://example.com
```

## Google Search Console Setup

1. Verify domain ownership
2. Submit sitemap
3. Check for indexing issues
4. Monitor Core Web Vitals
5. Fix any errors in Coverage report

## Monitoring

After launch, regularly check:
- [ ] Search Console for errors
- [ ] PageSpeed scores
- [ ] Indexing status
- [ ] Rich results appearance
- [ ] Broken links
