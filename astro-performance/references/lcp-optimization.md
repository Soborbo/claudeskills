# LCP Optimization

## Identify LCP Element

Usually: Hero image, hero heading, or above-fold video poster.
Use Chrome DevTools → Performance → check "LCP" marker to confirm.

## Preload LCP Image via Layout Prop

**Every page must pass its hero image to BaseLayout for preloading.**
Do NOT hardcode a static preload URL — each page has its own LCP image.

```astro
---
// In your page file (e.g. src/pages/index.astro)
---
<BaseLayout
  title="Page Title"
  preloadImage="/img/homepage/hero-750w.avif"
>
  <!-- page content -->
</BaseLayout>
```

BaseLayout renders this as:
```html
<link rel="preload" as="image" href="/img/homepage/hero-750w.avif" type="image/avif" fetchpriority="high">
```

The MIME type is auto-detected from file extension (.avif → image/avif, .webp → image/webp).

## Hero Image Pattern

Use the `<Picture>` component with the correct pattern from astro-images skill:

```astro
<Picture
  src={heroImage}
  pattern="FULL"
  lcp
  alt="Descriptive hero text"
/>
```

The `lcp` flag sets `loading="eager"` and `fetchpriority="high"`.
Only ONE image per page should have `lcp`.

**Do NOT use:**
- Custom widths arrays — use patterns from astro-images skill
- `decoding="sync"` — omit decoding on LCP images (let browser decide)
- `loading="lazy"` on hero images

## Critical Path Checklist

1. HTML → CSS → LCP image should be the only chain (max 3 hops)
2. No font in the critical chain — use `font-display: optional` for non-essential variants
3. Preload link must be in `<head>` BEFORE any render-blocking CSS if possible
4. Hero image should be ≤200KB (ideally ≤100KB in AVIF)

## Server Response Time

- Use Cloudflare edge caching
- Enable Brotli compression
- Minimize server-side processing
- Target TTFB <200ms
