# Performance Budget

> **Single source of truth for all performance thresholds.**
> Guardian agents (03-performance-guardian, 11-qa) use these values for VETO decisions.

## Core Web Vitals

| Metric | Target | VETO Threshold | Notes |
|--------|--------|----------------|-------|
| LCP | < 2.5s | > 4.0s | Largest Contentful Paint |
| CLS | < 0.1 | > 0.25 | Cumulative Layout Shift |
| INP | < 200ms | > 500ms | Interaction to Next Paint |

## Lighthouse Scores

| Metric | Target | VETO Threshold |
|--------|--------|----------------|
| Performance (Mobile) | ≥ 90 | < 85 |
| Performance (Desktop) | ≥ 95 | < 90 |
| Accessibility | ≥ 90 | < 85 |
| Best Practices | ≥ 90 | < 85 |
| SEO | ≥ 95 | < 90 |

## Bundle Size Limits

| Asset Type | Target | VETO Threshold | Notes |
|------------|--------|----------------|-------|
| Total JS | < 100KB | > 150KB | Gzipped |
| Total CSS | < 50KB | > 75KB | Gzipped |
| Hero Image | < 200KB | > 400KB | Optimized AVIF/WebP |
| Per-page JS | < 30KB | > 50KB | Excluding shared chunks |

## Per-Page Hydration

| Page Type | Max Hydrated Components | Notes |
|-----------|-------------------------|-------|
| Landing page | 2 | Form + one interactive element |
| Service page | 3 | Form + calculator + nav |
| Blog post | 1 | Share buttons only |
| Thank-you | 0 | Static only |

## Third-Party Scripts

| Script Type | Load Strategy | Max Impact |
|-------------|---------------|------------|
| Analytics (GTM) | Delayed 2s | < 50ms blocking |
| Chat widget | After interaction | 0ms initial |
| Maps | Facade pattern | 0ms until click |
| Video embeds | Facade pattern | 0ms until click |

## Font Loading

| Metric | Target |
|--------|--------|
| Font files | ≤ 4 (2 weights × 2 families max) |
| Total font size | < 100KB |
| Font display | `swap` always |
| Preload | Critical fonts only |

## Image Optimization

| Format | Use Case | Quality |
|--------|----------|---------|
| AVIF | Primary format | 75-80 |
| WebP | Fallback | 80-85 |
| JPEG | Legacy fallback | 85 |

| Image Type | Max Width | Notes |
|------------|-----------|-------|
| Hero | 1920px | With srcset |
| Content | 1200px | With srcset |
| Thumbnail | 400px | Single size |
| Icon | 64px | SVG preferred |

## Caching

| Asset Type | Cache Duration |
|------------|----------------|
| Static assets | 1 year (immutable) |
| HTML pages | No cache / revalidate |
| API responses | Context-dependent |

## Usage

Guardians should reference this file when issuing VETOs:

```yaml
veto:
  rule: "Total JS > 150KB"
  reference: "_PERFORMANCE-BUDGET.md#bundle-size-limits"
  measured: "187KB"
  required: "< 150KB"
```
