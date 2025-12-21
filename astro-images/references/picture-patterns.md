# Picture Component Patterns

## Config (astro.config.mjs)

```typescript
image: {
  service: {
    config: {
      avif: { quality: 65 },
      webp: { quality: 75 },
      jpeg: { quality: 80 },
    }
  }
}
```

## Components

| Component | Formats → Fallback | Widths | Sizes default |
|-----------|-------------------|--------|---------------|
| `HeroImage` | avif, webp → jpg | 320, 640, 828, 1200, 1600, 2000 | `100vw` |
| `ContentImage` | avif, webp → jpg | 400, 600, 800, 1200 | `(max-width: 800px) 100vw, 800px` |
| `CardImage` | avif, webp → jpg | 320, 480, 640 | `(max-width: 640px) 100vw, 50vw` |
| `Avatar` | webp → jpg | 150, 300 | `150px` |
| `Logo` | webp → png | width, width×2 | `{width}px` |
| `Icon` | webp → png | size, size×2 | `{size}px` |

All components have `priority?: boolean` prop. If `true` → `loading="eager"`.

## Loading Rules

| Position | loading | fetchpriority | decoding | Max |
|---------|---------|---------------|----------|-----|
| Hero image | eager | **high** | sync | 1 |
| Above-fold (logo, first images) | eager | auto | async | 3 |
| Below-fold | lazy | auto | async | ∞ |

Only the **hero image** gets `fetchpriority="high"`. Other above-fold images are eager but not high priority.

## Remote Images

For images from CDN or external URLs:
```astro
<Picture src={remoteUrl} inferSize alt="..." />
```

## CLS Prevention

Always use aspect-ratio classes:
```html
class="aspect-[16/9] object-cover"
class="aspect-[4/3] object-cover"
class="aspect-square object-cover"
```
