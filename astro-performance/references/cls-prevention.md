# CLS Prevention

## Always Set Dimensions

**Every `<img>`, `<iframe>`, and `<video>` MUST have explicit `width` and `height` attributes.**

```astro
<!-- Images — use Picture component (handles dimensions automatically) -->
<Picture src={image} pattern="HALF" alt="..." />

<!-- SVG images — MUST have width/height even though they're vector -->
<img src="/images/logo.svg" alt="Logo" width="96" height="24">
<!-- Read dimensions from SVG viewBox: viewBox="0 0 96 24" → width="96" height="24" -->

<!-- Iframes -->
<iframe width="560" height="315" class="aspect-video" loading="lazy"></iframe>
```

### SVG width/height (commonly missed)

SVGs without `width`/`height` cause CLS because the browser can't reserve space. This is the #1 CLS cause on review pages (Trustpilot, Yell, Google logos).

```bash
# Find SVG img tags missing width/height
grep -rn 'src=.*\.svg"' src/ --include="*.astro" | grep -v 'width=' | head -20
```

### width/height must match delivered size

```html
<!-- WRONG: source is 2048px but we serve 960w -->
<img src="image-960w.avif" width="2048" height="1366">

<!-- CORRECT: matches the actual delivered variant -->
<img src="image-960w.avif" width="960" height="640">
```

When using `<Picture>` component, this is handled automatically.

## Reserve Space for Dynamic Content

```css
/* Skeleton for loading state */
.skeleton {
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

## Font Display Strategy

```css
/* Primary font: swap (prevents invisible text) */
/* Font family comes from siteConfig.fonts.body / siteConfig.fonts.heading */
@font-face {
  font-family: 'BodyFont';
  font-style: normal;
  src: url('/fonts/body-font.woff2') format('woff2');
  font-display: swap;
}

/* Non-critical: optional (in a separate lazy-loaded CSS file) */
@font-face {
  font-family: 'BodyFont';
  font-style: italic;
  src: url('/fonts/body-font-italic.woff2') format('woff2');
  font-display: optional;
}
```

See [fonts reference](fonts.md) for the full lazy loading strategy.

## Avoid Layout-Shifting Embeds

```html
<!-- Reserve space for third-party embeds -->
<div class="min-h-[250px]">
  <!-- Ad, map, or embed loads here -->
</div>
```

## Checkerboard/Feature Sections

Images must be first in DOM order so mobile layout is always image→text.
Desktop alternation achieved via CSS `order`, not DOM reordering.
See astro-images skill for the pattern.

## CLS Debugging

```bash
# In Chrome DevTools:
# 1. Performance tab → Record → scroll page → Stop
# 2. Look for "Layout Shift" markers
# 3. Click to see which elements shifted

# Lighthouse will also flag elements causing shifts
```
