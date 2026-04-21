---
name: astro-performance
description: Core Web Vitals and performance optimization for Astro sites. LCP preloading, font strategy, image patterns, critical path, third-party scripts, Cloudflare Tag Gateway. Use for performance tuning.
version: 2.0.0
---

# Astro Performance Skill

## Purpose

Achieve 90+ Lighthouse mobile scores and pass Core Web Vitals on every page. Direct impact on SEO rankings, crawl priority, and conversion rates.

## Core Web Vitals Targets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤2.5s | 2.5–4s | >4s |
| **INP** (Interaction to Next Paint) | ≤200ms | 200–500ms | >500ms |
| **CLS** (Cumulative Layout Shift) | ≤0.1 | 0.1–0.25 | >0.25 |

## Critical Path Rule

**The critical rendering path must be max 3 hops:** HTML → CSS → LCP image.

Anything that adds a 4th hop (font in CSS chain, extra CSS file, unpreloaded image) adds 150–500ms to LCP on mobile. This is the #1 cause of poor mobile scores.

```
GOOD:  HTML (150ms) → Layout.css (150ms) → Hero image (preloaded, parallel)
       Total: ~300ms to FCP, ~500ms to LCP

BAD:   HTML (150ms) → Layout.css (150ms) → italic font (350ms) → Hero image (discovered late)
       Total: ~650ms to FCP, ~2000ms+ to LCP
```

## Core Rules

### 1. LCP Preloading (Biggest Impact)

**Every page MUST pass its hero image to BaseLayout for preloading:**

```astro
<BaseLayout
  preloadImage="/img/hero-480w.avif"
  title="Page Title"
>
```

BaseLayout renders: `<link rel="preload" as="image" href="..." type="image/avif" fetchpriority="high">`

- The `preloadImage` prop auto-detects MIME type from extension
- Each page passes its OWN hero image — never hardcode a single image for all pages
- Only ONE `fetchpriority="high"` per page (the preload + the `<img>` tag)

**Responsive hero trap:** `<link rel="preload" as="image" href="...">` preloads ONE URL. If the hero `<img>` uses `srcset` + `sizes`, the browser picks a DIFFERENT file at runtime — the preloaded one is wasted and the LCP image arrives later. For responsive heroes, preload MUST use `imagesrcset` + `imagesizes` with the same widths and `sizes` value as the `<img>`:

```html
<link rel="preload" as="image"
  imagesrcset="/img/hero-480w.avif 480w, /img/hero-960w.avif 960w, /img/hero-1600w.avif 1600w"
  imagesizes="(min-width: 768px) 50vw, 100vw"
  type="image/avif" fetchpriority="high">
```

Rule: the `imagesrcset` + `imagesizes` on the preload must match the `<img srcset>` + `sizes` byte-for-byte.

### 2. Font Strategy

**Primary fonts (body, headings):** `font-display: swap` + preload in `<head>`
**Non-critical variants (italic, display, decorative):** `font-display: optional` + lazy CSS

```html
<!-- Primary: preload + swap (in <head>) — font from siteConfig.fonts -->
<link rel="preload" as="font" type="font/woff2" href="/fonts/body-font.woff2" crossorigin>

<!-- Non-critical: lazy load (NOT in <head> as blocking) -->
<link rel="stylesheet" href="/fonts/body-font-italic.css" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="/fonts/body-font-italic.css"></noscript>
```

**Why:** A font in the main CSS adds it to the critical path chain (HTML → CSS → font = +300–500ms). Moving non-critical fonts to lazy CSS removes them from the chain entirely.

**Never preload non-critical fonts** — that defeats the lazy loading.

### 3. Images

**Use the `<Picture>` component from astro-images skill** with pattern-based srcset.
See [images reference](references/images.md) for details.

Key rules:
- Three formats always: AVIF → WebP → JPG (never PNG fallback for photos)
- 480w variant in every pattern
- `loading="eager"` on hero and above-fold only
- `loading="lazy"` on everything below-fold
- Never `loading="lazy"` on hero. Never `loading="eager"` on below-fold.
- Explicit `width`/`height` on ALL images including SVGs
- `width`/`height` must match delivered dimensions, not original source

### 4. Third-Party Scripts

**Defer everything that isn't essential for first render.**

```astro
<!-- GTM ID comes from siteConfig.tracking.gtmId — only deferGtmMs is a prop -->
<BaseLayout title="Page Title" deferGtmMs={2000}>

<!-- FB Pixel: always setTimeout if loaded directly -->
<!-- Tag Gateway: managed in Cloudflare Dashboard, NOT in code -->
```

See [third-party scripts reference](references/third-party-scripts.md) for Cloudflare Tag Gateway details.

### 5. CSS Strategy

- ONE main CSS file (Layout.css) — this is the only render-blocking CSS allowed
- Component CSS that's only used below-fold: use `<style is:inline>` to move it into the HTML body (not a blocking `<link>` in `<head>`)
- Never add extra `<link rel="stylesheet">` in `<head>` unless absolutely needed above-fold
- Below-fold component CSS total impact: monitor, should not add >2KB inline

**Render-blocking CSS quick-fix for small sites:** on sites with <100 pages and <20KB CSS/page, set `build: { inlineStylesheets: 'always' }` in `astro.config.mjs`. Astro inlines the stylesheet into each HTML document, eliminating the CSS request from the critical path. PageSpeed's "Eliminate render-blocking resources" flag disappears with one config line — no `critters`/`beasties` plugin needed. Only revert to `'auto'` if HTML size becomes the actual bottleneck.

### 6. CLS Prevention

- Every `<img>` and `<iframe>` needs `width` + `height` attributes
- **SVG `<img>` tags included** — read dimensions from SVG `viewBox`
- Use `aspect-ratio` CSS as backup
- Reserve space for dynamic content with `min-height`
- See [CLS reference](references/cls-prevention.md)

### 7. Bundle Size

| Asset Type | Budget |
|------------|--------|
| Total JS (own code) | <50KB gzipped |
| Total JS (with 3rd party) | <100KB gzipped |
| Total CSS | <50KB gzipped |
| Hero image | <200KB |
| Any single image | <100KB |
| OG images | <150KB each (JPG q80) |

### 8. Caching

- Hashed assets (`/_astro/*`): `Cache-Control: public, max-age=31536000, immutable`
- HTML: `Cache-Control: public, max-age=0, must-revalidate`
- Fonts: `Cache-Control: public, max-age=31536000, immutable`
- See [caching reference](references/caching.md)

## Lighthouse Score Variability

**Lighthouse mobile scores fluctuate ±10–15 points between runs.** This is normal.

The slow 4G emulation is non-deterministic — the same page can score 65 on one run and 92 on the next. Same CSS file might take 150ms or 330ms to "load" in the emulation.

**Best practice:**
- Run 3–5 times and take the **median** score
- Use `lighthouse --preset=perf` locally for consistent results
- Google uses **real user data (CrUX)** for ranking, not single Lighthouse runs
- Don't chase single-digit improvements after 90+

```bash
# Local batch testing
for i in 1 2 3 4 5; do
  lighthouse https://example.com --only-categories=performance \
    --preset=perf --form-factor=mobile --output=json \
    --output-path="./lh-run-$i.json" --chrome-flags="--headless"
  score=$(cat "lh-run-$i.json" | node -e "process.stdin.on('data',d=>console.log(Math.round(JSON.parse(d).categories.performance.score*100)))")
  echo "Run $i: $score"
done
```

## Subpage Performance Checklist

**Don't only test the homepage.** Different page types have different performance profiles.

Test at minimum:
- Homepage `/`
- Longest service page (most content)
- An area/location page
- Reviews page (many DOM elements)
- Calculator page (JS-heavy)

Common subpage-specific issues:
- **Large inline JSON-LD schema** in `<head>` → move to `</body>` or minimize
- **Many review cards** rendered at once → large DOM, slow layout
- **Missing `preloadImage` prop** → hero image discovered late
- **Extra `<style is:inline>` blocks** from components → HTML size bloat

## Integration with Other Skills

| Skill | How it connects |
|-------|----------------|
| **astro-images** | Use `<Picture>` component with patterns. LCP image = `lcp` prop. |
| **design-tokens** | Color contrast (WCAG AA 4.5:1) — poor contrast = a11y failure, not perf, but Lighthouse reports both |
| **schema-entity-graph** | Sitemap `<lastmod>` must sync with `dateModified` in schema — not a perf issue but often fixed in same pass |
| **deployment** | Pre-deploy checks, Cloudflare Workers config, `output: 'static'` for build-time image processing |

## Boilerplate

**On first use in a project, copy the BaseLayout:**

```bash
cp assets/boilerplate/layouts/BaseLayout.astro → src/layouts/BaseLayout.astro
```

**Skip if the project already has it.** The BaseLayout handles LCP preloading, GTM deferral, Schema.org rendering, and meta tags.

## References

### Core Web Vitals
- [LCP Optimization](references/lcp-optimization.md) — Preload via Layout prop, critical path, hero image pattern
- [CLS Prevention](references/cls-prevention.md) — Dimensions, skeletons, font display, SVG width/height
- [INP Optimization](references/inp-optimization.md) — Task chunking, debouncing, content-visibility

### Assets & Resources
- [Bundle Size](references/bundle-size.md) — Analysis, tree shaking, dynamic imports
- [Fonts](references/fonts.md) — Swap vs optional, lazy CSS for non-critical, subsetting
- [Images](references/images.md) — Pattern-based srcset, format priority, SVG rules

### Infrastructure
- [Third-Party Scripts](references/third-party-scripts.md) — GTM defer, Tag Gateway, FB Pixel, facade pattern
- [Caching](references/caching.md) — Cloudflare headers, cache control
- [Testing](references/testing.md) — Lighthouse CLI, batch runs, real user monitoring

## Forbidden

- Extra `<link rel="stylesheet">` in `<body>` (use `<style is:inline>` instead for below-fold component CSS)
- Extra `<link rel="stylesheet">` in `<head>` for below-fold components
- Synchronous third-party scripts in `<head>` (defer or use `deferGtmMs`)
- PNG fallback for photo images (use JPG)
- Unoptimized images / missing AVIF+WebP variants
- `font-display: swap` on non-critical font variants (use `optional` + lazy CSS)
- Non-critical font variants loaded in render-blocking CSS
- `font-display: block` (blocks rendering up to 3s)
- Preloading non-critical fonts (defeats lazy loading)
- `loading="lazy"` on hero images
- `loading="eager"` on below-fold images
- Missing `width`/`height` on any `<img>` or `<iframe>` (including SVGs)
- `width`/`height` set to original source dimensions instead of delivered size
- Layout shifts from dynamic content without reserved space
- Main thread blocking >50ms without chunking
- More than ONE `fetchpriority="high"` per page
- Hardcoded preload URL in Layout (use `preloadImage` prop per page)
- Modifying Cloudflare Tag Gateway scripts (`/ry2s/`) in HTML

## Definition of Done

- [ ] Lighthouse mobile ≥90 on homepage (median of 3 runs)
- [ ] Lighthouse mobile ≥85 on worst subpage (median of 3 runs)
- [ ] LCP ≤2.5s (homepage) / ≤3.5s (subpages)
- [ ] CLS ≤0.1 on all pages
- [ ] INP ≤200ms on calculator/interactive pages
- [ ] Critical path: max 3 hops (HTML → CSS → LCP image)
- [ ] No font in critical path chain (italic/display = lazy CSS)
- [ ] Total own JS <50KB gzipped
- [ ] Every page has `preloadImage` prop with correct hero
- [ ] Hero image preloaded, `loading="eager"`, `fetchpriority="high"`
- [ ] All below-fold images: `loading="lazy"`
- [ ] All `<img>` and `<iframe>` have `width` + `height` (including SVGs)
- [ ] Fonts self-hosted with correct display strategy
- [ ] Third-party scripts deferred (GTM: `deferGtmMs`, FB: setTimeout)
- [ ] OG images generated from hero (5 variants, JPG)
- [ ] Tested on ≥3 different page types, not just homepage
