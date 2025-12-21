# LCP Optimization

## Identify LCP Element

Usually: Hero image, hero heading, or above-fold video poster.

## Preload LCP Image

```astro
---
// In BaseLayout.astro head
---
<link
  rel="preload"
  as="image"
  href="/hero-image.webp"
  type="image/webp"
  fetchpriority="high"
>
```

## Hero Image Pattern

```astro
<Picture
  src={heroImage}
  alt="..."
  widths={[640, 1024, 1600, 2000]}
  formats={['avif', 'webp']}
  loading="eager"
  fetchpriority="high"
  decoding="sync"
/>
```

## Server Response Time

- Use Cloudflare edge caching
- Enable Brotli compression
- Minimize server-side processing
