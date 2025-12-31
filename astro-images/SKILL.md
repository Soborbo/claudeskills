---
name: astro-images
description: Responsive image optimization for Astro. Copy-paste patterns for all image types. No deviation permitted.
---

# Astro Images Skill

## The Four Patterns (Use Exactly)

### 1. HERO (Full-width, LCP)

```astro
<Picture
  src={heroImage}
  widths={[640, 750, 828, 1080, 1200, 1920, 2048, 2560]}
  sizes="100vw"
  formats={['avif', 'webp']}
  quality={60}
  width={1920}
  height={1080}
  alt="Descriptive alt text"
  loading="eager"
  fetchpriority="high"
/>
```

### 2. CONTENT (Article body, columns)

```astro
<Picture
  src={contentImage}
  widths={[320, 640, 960, 1280, 1920]}
  sizes="(min-width: 1024px) 720px, 100vw"
  formats={['avif', 'webp']}
  quality={60}
  width={960}
  height={640}
  alt="Descriptive alt text"
/>
```

### 3. THUMBNAIL (Cards, grids)

```astro
<Picture
  src={thumbImage}
  widths={[256, 384, 512, 640, 750]}
  sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
  formats={['avif', 'webp']}
  quality={60}
  width={400}
  height={300}
  alt="Descriptive alt text"
/>
```

### 4. FIXED (Logos, avatars, icons)

```astro
---
import { getImage } from 'astro:assets';
import logo from '../assets/logo.png';

const logo1x = await getImage({ src: logo, width: 200, quality: 80 });
const logo2x = await getImage({ src: logo, width: 400, quality: 60 });
---

<img
  src={logo1x.src}
  srcset={`${logo1x.src} 1x, ${logo2x.src} 2x`}
  width="200"
  height="50"
  alt="Company name logo"
/>
```

**Note:** Default to 1x + 2x. Add 3x only for icons ≥64px where fidelity matters.

---

## Alt Text Rule

- **Descriptive alt required** for content, product, and informational images
- **`alt=""`** only for purely decorative images (backgrounds, dividers)
- When in doubt, describe what the image shows

---

## Sizes Reference

| Layout | sizes value |
|--------|-------------|
| Full-width | `100vw` |
| Content column | `(min-width: 1024px) 720px, 100vw` |
| 2-column grid | `(min-width: 1024px) 50vw, 100vw` |
| 3-column grid | `(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw` |
| 4-column grid | `(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw` |
| Sidebar | `(min-width: 1024px) calc(25vw - 2rem), 100vw` |
| Fixed card | `(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw` |

**Rule:** `sizes="100vw"` is ONLY for true full-width images. Using it on grids/columns is a bug.

**Container queries:** `sizes` must approximate viewport-based layout. Never omit `sizes` because container width is unknown.

---

## Decision Tree

```
What type of image?
│
├─ SVG? → Use <img src="*.svg"> or inline. No <Picture>. STOP.
│
├─ Fixed size (logo/icon)? → Use FIXED pattern with x descriptors. STOP.
│
├─ Full-width hero/LCP? → Use HERO pattern. STOP.
│
├─ Article/content image? → Use CONTENT pattern. STOP.
│
├─ Card/thumbnail/grid? → Use THUMBNAIL pattern. STOP.
│
└─ Unknown? → Default to CONTENT pattern.
```

---

## Seven Rules

1. **Every `<Picture>` needs `widths` + `sizes` + `quality={60}` + `formats={['avif', 'webp']}`**
2. **Every image needs intrinsic dimensions** — explicit `width`/`height` or Astro metadata
3. **Images go in `/src/assets/`** — never `/public/`
4. **Only ONE image per page gets `fetchpriority="high"`** — never in loops/lists
5. **`sizes` must match actual CSS layout** — `100vw` only for true full-width
6. **Use the exact arrays above** — no custom, computed, or dynamic widths
7. **Descriptive `alt` text required** — `alt=""` only for decorative images

---

## Quick Checks Before Output

- [ ] Pattern matches HERO / CONTENT / THUMBNAIL / FIXED?
- [ ] `sizes` reflects actual layout (not defensive `100vw`)?
- [ ] `width` and `height` attributes present?
- [ ] `quality={60}` present?
- [ ] `fetchpriority="high"` on max ONE image, not in loops?
- [ ] Descriptive `alt` text (not empty unless decorative)?
- [ ] Image imported from `/src/assets/`?

---

## Performance Budget

| Type | AVIF Target | Fallback Target |
|------|-------------|-----------------|
| Hero | ≤ 250 KB | ≤ 400 KB |
| Content | ≤ 150 KB | ≤ 250 KB |
| Thumbnail | ≤ 80 KB | ≤ 120 KB |

If exceeded: lower `quality` first, then reduce source dimensions. Never remove width variants.

---

## Edge Cases

**SVGs:** Never through `<Picture>`. Use `<img src="*.svg">` or inline `<svg>`.

**CSS backgrounds:** Never for LCP/content. Only for decorative patterns/textures.

**CMS/Markdown:** Don't rewrite inline. Handle via MDX components or remark plugins upstream.

**Zoomable/4K:** Add `3840` to HERO array + `data-zoomable="true"` + `quality={70}`. Only for product zoom or photography portfolios.

**Art direction:** Only when image content changes (different crop/subject). Pure resizing uses `sizes`, not `<source media>`.

---

## Validation

```bash
# Images in /public/ (should be empty)
find public -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.webp" \) 2>/dev/null

# Picture without widths (should be empty)
grep -r "<Picture" src --include="*.astro" | grep -v "widths="

# Picture without quality (should be empty)  
grep -r "<Picture" src --include="*.astro" | grep -v "quality="

# Misused 100vw (review manually)
grep -r 'sizes="100vw"' src --include="*.astro"

# fetchpriority in loops (should be empty)
grep -r "fetchpriority" src --include="*.astro" | grep -E "\.(map|forEach)\("
```

---

## Why These Numbers

**Widths:** Tailwind breakpoints + iPhone physical pixels (750=375×2, 828=414×2) + 2560 max cap (3840 causes decode jank).

**Quality 60:** High-DPI hides artifacts. AVIF/WebP are efficient. File size > imperceptible quality.

**Sizes formula:** Browser downloads `(sizes CSS px) × (device DPR)`. Wrong sizes = wrong image = wasted bandwidth.

---

## Astro Config

```javascript
// astro.config.mjs
export default defineConfig({
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
});
```
