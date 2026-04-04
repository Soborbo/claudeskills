# Image Optimization

## Format Priority

1. AVIF (best compression, ~50% smaller than JPEG)
2. WebP (broad support, ~30% smaller than JPEG)
3. JPG (final fallback — never PNG for photos)

## Responsive Images — Use Patterns

**Always use pattern-based widths from the astro-images skill.**
Never use custom/arbitrary width arrays.

```astro
<!-- Correct: pattern-based -->
<Picture src={image} pattern="HALF" alt="Feature" />

<!-- Wrong: arbitrary widths -->
<Picture src={image} widths={[400, 800, 1200, 1600]} sizes="..." alt="Feature" />
```

## Pattern Selection Guide

| Layout | Pattern |
|--------|---------|
| Full-bleed hero | FULL |
| 50/50 split | HALF |
| Card with max-height | HALF_CARD |
| 3-column grid | THIRD |
| Logo, avatar | FIXED (use FixedImage component) |

See astro-images SKILL.md for the complete pattern table.

## Size Budgets

| Image Type | Max Size |
|------------|----------|
| Hero (LCP) | ≤200KB |
| Content image | ≤100KB |
| Thumbnail/avatar | ≤10KB |
| Logo/icon | ≤5KB |

## SVG Images

SVG `<img>` tags MUST have explicit `width` and `height` attributes to prevent CLS:
```html
<img src="/images/logo.svg" alt="Logo" width="96" height="24">
```
Read dimensions from the SVG's `viewBox` attribute.
