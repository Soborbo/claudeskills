---
name: astro-performance
description: Core Web Vitals and performance optimization for Astro sites. LCP, CLS, INP optimization, bundle size, fonts, third-party scripts. Use for performance tuning.
---

# Astro Performance Skill

## Purpose

Achieve 90+ Lighthouse scores and pass Core Web Vitals. Direct impact on SEO rankings and conversion rates.

## Core Web Vitals Targets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤2.5s | 2.5-4s | >4s |
| **INP** (Interaction to Next Paint) | ≤200ms | 200-500ms | >500ms |
| **CLS** (Cumulative Layout Shift) | ≤0.1 | 0.1-0.25 | >0.25 |

## LCP Optimization

### Identify LCP Element

Usually: Hero image, hero heading, or above-fold video poster.

### Preload LCP Image

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

### Hero Image Pattern

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

### Server Response Time

- Use Cloudflare edge caching
- Enable Brotli compression
- Minimize server-side processing

## CLS Prevention

### Always Set Dimensions

```astro
<!-- Images -->
<Picture
  src={image}
  width={800}
  height={600}
  class="aspect-[4/3]"
/>

<!-- Iframes -->
<iframe
  width="560"
  height="315"
  class="aspect-video"
></iframe>
```

### Reserve Space for Dynamic Content

```css
/* Skeleton for loading state */
.testimonial-skeleton {
  min-height: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Font Display Swap

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2');
  font-display: swap; /* Prevents invisible text */
}
```

### Avoid Layout-Shifting Ads/Embeds

```html
<!-- Reserve space for third-party embeds -->
<div class="min-h-[250px]">
  <!-- Ad or embed loads here -->
</div>
```

## INP Optimization

### Minimize Main Thread Work

```typescript
// Break up long tasks
function processLargeList(items: Item[]) {
  const chunk = 50;
  let index = 0;

  function processChunk() {
    const end = Math.min(index + chunk, items.length);
    for (; index < end; index++) {
      processItem(items[index]);
    }
    if (index < items.length) {
      requestIdleCallback(processChunk);
    }
  }

  requestIdleCallback(processChunk);
}
```

### Debounce Input Handlers

```typescript
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Usage
input.addEventListener('input', debounce(handleSearch, 300));
```

### Use `content-visibility`

```css
/* Skip rendering off-screen sections */
.below-fold-section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px; /* Estimated height */
}
```

## Bundle Size

### Target Budgets

| Asset Type | Budget |
|------------|--------|
| Total JS | <100KB (gzipped) |
| Total CSS | <50KB (gzipped) |
| Hero image | <200KB |
| Any single image | <100KB |

### Analyze Bundle

```bash
# Add to package.json
"scripts": {
  "analyze": "astro build && npx source-map-explorer dist/**/*.js"
}
```

### Tree Shaking

```typescript
// ✅ Import only what you need
import { formatDate } from 'date-fns';

// ❌ Imports entire library
import * as dateFns from 'date-fns';
```

### Dynamic Imports

```astro
---
// Only load on pages that need it
const Calculator = await import('../components/Calculator.astro');
---
```

## Font Loading

### Self-Host Fonts

```astro
---
// In BaseLayout.astro
---
<link rel="preconnect" href="/fonts" crossorigin>
<link
  rel="preload"
  as="font"
  type="font/woff2"
  href="/fonts/inter-var.woff2"
  crossorigin
>
```

### Subset Fonts

```bash
# Only include characters you need
npx glyphhanger --whitelist="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?@£$%&()+-=:;'\"" --subset=Inter.ttf
```

### Variable Fonts

Use variable fonts instead of multiple weights:
- `Inter-var.woff2` instead of `Inter-400.woff2` + `Inter-700.woff2`

## Third-Party Scripts

### Load GTM Properly

```html
<!-- After user interaction or consent -->
<script>
  window.addEventListener('load', () => {
    setTimeout(() => {
      const script = document.createElement('script');
      script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-XXXX';
      script.async = true;
      document.head.appendChild(script);
    }, 2000); // Delay non-critical scripts
  });
</script>
```

### Facade Pattern for Embeds

```astro
<!-- YouTube: Load iframe only on click -->
<div class="video-facade" data-video-id="xxx">
  <img src="/poster.webp" alt="Video thumbnail">
  <button>Play</button>
</div>
```

### Script Loading Attributes

| Attribute | Use Case |
|-----------|----------|
| `async` | Independent scripts (analytics) |
| `defer` | Scripts that need DOM |
| `type="module"` | ES modules |

## Image Optimization

### Format Priority

1. AVIF (best compression)
2. WebP (broad support)
3. JPEG/PNG (fallback)

### Responsive Images

```astro
<Picture
  src={image}
  widths={[400, 800, 1200, 1600]}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
  formats={['avif', 'webp']}
/>
```

## Caching Strategy

### Cloudflare Headers

```toml
# wrangler.toml or _headers file
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

## Performance Testing

### Tools

| Tool | Use For |
|------|---------|
| Lighthouse | Overall audit |
| WebPageTest | Detailed waterfall |
| Chrome DevTools → Performance | Runtime analysis |
| `web-vitals` library | Real user monitoring |

### Real User Monitoring

```typescript
import { onLCP, onINP, onCLS } from 'web-vitals';

onLCP(console.log);
onINP(console.log);
onCLS(console.log);
```

## Forbidden

- ❌ Render-blocking CSS in body
- ❌ Synchronous third-party scripts in head
- ❌ Unoptimized images
- ❌ Web fonts without `font-display: swap`
- ❌ Layout shifts from dynamic content
- ❌ Main thread blocking >50ms

## Definition of Done

- [ ] Lighthouse Performance ≥90
- [ ] LCP ≤2.5s
- [ ] CLS ≤0.1
- [ ] INP ≤200ms
- [ ] Total JS <100KB gzipped
- [ ] Hero image preloaded
- [ ] Fonts self-hosted with swap
- [ ] Third-party scripts deferred
