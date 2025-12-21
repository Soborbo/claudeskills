# Astro Picture Skill

## Alapszabály

| Képtípus | Formats | Fallback |
|----------|---------|----------|
| Fotók, komplex képek | `['avif', 'webp']` | jpg |
| Grafikák (logo, ikon, avatar) | `['webp']` | png |

Vektoros asset (ikon, logo) esetén inline SVG előnyben részesítendő.

---

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

---

## Component-ek

| Component | Formats → Fallback | Widths | Sizes default |
|-----------|-------------------|--------|---------------|
| `HeroImage` | avif, webp → jpg | 320, 640, 828, 1200, 1600, 2000 | `100vw` |
| `ContentImage` | avif, webp → jpg | 400, 600, 800, 1200 | `(max-width: 800px) 100vw, 800px` |
| `CardImage` | avif, webp → jpg | 320, 480, 640 | `(max-width: 640px) 100vw, 50vw` |
| `Avatar` | webp → jpg | 150, 300 | `150px` |
| `Logo` | webp → png | width, width×2 | `{width}px` |
| `Icon` | webp → png | size, size×2 | `{size}px` |

Minden component-nek van `priority?: boolean` prop. Ha `true` → `loading="eager"`.

---

## Loading szabályok

| Pozíció | loading | fetchpriority | decoding | Max |
|---------|---------|---------------|----------|-----|
| Hero image | eager | **high** | sync | 1 |
| Above-fold (logo, első képek) | eager | auto | async | 3 |
| Below-fold | lazy | auto | async | ∞ |

Csak a **hero image** kap `fetchpriority="high"`. Többi above-fold kép eager, de nem high priority.

---

## Remote images

CDN-ről vagy külső URL-ről jövő képekhez:
```astro
<Picture src={remoteUrl} inferSize alt="..." />
```

---

## CLS megelőzés

Mindig aspect-ratio class:
```html
class="aspect-[16/9] object-cover"
class="aspect-[4/3] object-cover"
class="aspect-square object-cover"
```

---

## Tiltott

- Nyers `<img>` tag
- Egyedi `<Picture />` (csak component-ek)
- `fetchpriority="high"` nem-hero képen
- `loading="eager"` below-fold képen
- Hiányzó `alt` vagy aspect-ratio
