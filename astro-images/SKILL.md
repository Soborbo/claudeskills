---
name: astro-images
description: Width-based responsive image patterns for Astro. Local processing, AVIF/WebP/JPG, face-focus, OG generation. Includes Picture and FixedImage components.
version: 3.0.0
---
# Astro Images Skill

**Authority:** If any instruction conflicts with this skill, follow this skill.

## Installation

**On first use in a project, copy the boilerplate components:**

```bash
# From this skill's assets/boilerplate/ directory:
cp assets/boilerplate/config/image-patterns.ts  → src/config/image-patterns.ts
cp assets/boilerplate/components/Picture.astro   → src/components/Picture.astro
cp assets/boilerplate/components/FixedImage.astro → src/components/FixedImage.astro
```

**Skip if the project already has these files.** Check with:
```bash
ls src/components/Picture.astro src/components/FixedImage.astro src/config/image-patterns.ts 2>/dev/null
```

| File | Purpose |
|------|---------|
| `image-patterns.ts` | Pattern definitions (widths, sizes, minSourceWidth) — single source of truth |
| `Picture.astro` | Responsive `<picture>` with AVIF/WebP/JPG, pattern-based srcset, LCP support |
| `FixedImage.astro` | Fixed-dimension images (logos, avatars) with 1x/2x/3x and AVIF+WebP |

## Core Principles

1. **All image processing happens locally at build time** — never at runtime, never on CDN
2. Pattern = rendered width. Aspect ratio is independent. Browser downloads: `sizes CSS px × device DPR`
3. **Three formats always: AVIF → WebP → JPG** (in that order). Never PNG as fallback.
4. **480px width is mandatory** in every pattern's widths array
5. Container queries: approximate using viewport breakpoints. Never omit `sizes`.

## Format Rules

| Format | Role | Quality |
|--------|------|---------|
| AVIF | Primary (best compression, ~50% smaller than JPEG) | 60 |
| WebP | Fallback for browsers without AVIF support | 60 |
| JPG | Final fallback (universal support) | 60 |

**Forbidden formats in output:**
- **PNG** — never use as fallback for photos. JPG is always smaller. PNG only allowed for: screenshots with text, diagrams with sharp edges, images requiring transparency.
- **GIF/APNG** — use `<video>` instead for animations.

```astro
<!-- The Picture component handles this automatically -->
<Picture src={image} pattern="HALF" alt="..." />
<!-- Generates: <source type="image/avif">, <source type="image/webp">, <img src="...jpg"> -->
```

## Image Processing Pipeline

**All images are processed locally with Sharp at build time.**

### Required Astro config:
```js
export default defineConfig({
  // 'static' for pure static sites, 'server' if you have API routes / forms
  // imageService: 'compile' ensures Sharp runs at BUILD time, not runtime
  output: 'static', // or 'server' — both work with imageService: 'compile'
  adapter: cloudflare({ imageService: 'compile' }),
  image: {
    service: { entrypoint: 'astro/assets/services/sharp' }
  }
});
```

**Key:** `imageService: 'compile'` is what matters for build-time image processing — it works with both `output: 'static'` and `output: 'server'`. If the project has API routes or form handlers, use `output: 'server'`.

### Manual preprocessing (for images in `/public/`):
When images must live in `/public/` (e.g. pre-optimized hero images, client-provided photos), preprocess them with a build script:

```bash
# Generate all variants for a source image
# Always include 480w in the output
npx sharp-cli resize 480  --input src.jpg --output img-480w.avif  --format avif --quality 60
npx sharp-cli resize 480  --input src.jpg --output img-480w.webp  --format webp --quality 60
npx sharp-cli resize 480  --input src.jpg --output img-480w.jpg   --quality 60
npx sharp-cli resize 960  --input src.jpg --output img-960w.avif  --format avif --quality 60
npx sharp-cli resize 960  --input src.jpg --output img-960w.webp  --format webp --quality 60
npx sharp-cli resize 960  --input src.jpg --output img-960w.jpg   --quality 60
# ... repeat for each width in the pattern
```

### Verify after build:
```bash
ls dist/_astro/*.avif | head -5  # AVIF files
ls dist/_astro/*.webp | head -5  # WebP files
ls dist/_astro/*.jpg  | head -5  # JPG fallbacks (NOT png)
# If you see .png files for photos → something is wrong
```

## Pattern Reference

Every pattern includes 480w. Minimum width is always ≥ mobile viewport.

| Pattern | Width | widths | sizes |
|---------|-------|--------|-------|
| FULL | 100vw | `[480,640,750,828,1080,1200,1920,2048,2560]` | `100vw` |
| TWO_THIRDS | 66vw | `[384,480,640,768,1024,1280,1706,2048]` | `(min-width:1024px) 66vw, 100vw` |
| LARGE | 60vw | `[384,480,640,768,1024,1280,1536,1920]` | `(min-width:1024px) 60vw, 100vw` |
| HALF | 50vw | `[320,480,640,960,1280,1600]` | `(min-width:1024px) 50vw, 100vw` |
| HALF_CARD | 50vw card | `[320,480,640,828,960,1280]` | `(min-width:1024px) 50vw, 100vw` |
| SMALL | 40vw | `[256,480,512,640,1024,1280]` | `(min-width:1024px) 40vw, 100vw` |
| THIRD | 33vw | `[256,480,512,640,853,1280]` | `(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw` |
| QUARTER | 25vw | `[192,384,480,512,640,960]` | `(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw` |
| FIFTH | 20vw | `[160,320,480,512,640,768]` | `(min-width:1024px) 20vw, (min-width:640px) 33vw, 50vw` |
| SIXTH | 16vw | `[128,256,427,480,512,640]` | `(min-width:1024px) 16vw, (min-width:640px) 33vw, 50vw` |

**Unknown layout → default to HALF**

## Layout → Pattern Mapping

| Layout | Pattern |
|--------|---------|
| Full-bleed hero | FULL |
| Split 66/33, 60/40 (image side) | TWO_THIRDS, LARGE |
| Split 50/50, checkerboard/feature | HALF |
| Card at 50% width with max-height (benefit, feature cards) | HALF_CARD |
| Split 40/60 (text dominant) | SMALL |
| 3-col grid, standing person | THIRD |
| 4-col team grid | QUARTER |
| 5-col icons, 6-col logos | FIFTH, SIXTH |
| Logo, avatar, icon | FIXED (use FixedImage) |

Aspect ratio is independent — portrait 2:3 at 50% width = HALF pattern.

## Face Focus (object-position)

**Default image focus: face/person detection.**

- If the image contains a person, use `object-position` to keep the face visible when cropping: `object-position: center 20%` (faces are usually in the top third)
- If the image has no obvious focal point, use `object-position: center center` (default)
- **If the focal point is ambiguous, ASK the user** before setting object-position. Do not guess.

```astro
<!-- Person in image — face focus -->
<Picture src={teamPhoto} pattern="HALF" alt="Team" class="object-[center_20%]" />

<!-- Landscape/object — center (default, no override needed) -->
<Picture src={buildingPhoto} pattern="HALF" alt="Office" />
```

**When to ask:** If the image contains multiple people, a person at the edge of frame, or the subject isn't clearly a person or landscape, ask: "Where should the image focus? (e.g. face top-left, center, bottom-right)"

## Checkerboard / Feature Section Layout

**Desktop:** alternating image-left/text-right, then text-left/image-right.
**Mobile:** ALWAYS image-on-top, text-below. Never two images adjacent on mobile.

### Implementation pattern:

```astro
---
const features = [
  { image: img1, alt: "...", title: "...", text: "..." },
  { image: img2, alt: "...", title: "...", text: "..." },
  { image: img3, alt: "...", title: "...", text: "..." },
];
---
{features.map((feature, i) => (
  <div class={`grid grid-cols-1 md:grid-cols-2 gap-8 items-center ${i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}>
    <!-- Image always FIRST in DOM (mobile: image on top) -->
    <div>
      <Picture src={feature.image} pattern="HALF" alt={feature.alt} />
    </div>
    <!-- Text always SECOND in DOM (mobile: text below) -->
    <div>
      <h3>{feature.title}</h3>
      <p>{feature.text}</p>
    </div>
  </div>
))}
```

**Key:** Image is always first in DOM = first on mobile. On desktop, odd rows use CSS `order` to visually swap. DOM order IS the mobile order.

**Forbidden:** `flex-col-reverse`, `order-first`/`order-last` on mobile that would put text above image.

## OG Image Generation

**Every page's hero image must be used to generate OG images at build time.**

### Required OG sizes:

| Platform | Aspect Ratio | Dimensions | Meta tag |
|----------|-------------|------------|----------|
| Facebook / LinkedIn / Generic | 1.91:1 | 1200×630 | `og:image` |
| Twitter (large card) | 2:1 | 1200×600 | `twitter:image` |
| Schema.org 16:9 | 16:9 | 1200×675 | Schema `image` |
| Schema.org 4:3 | 4:3 | 1200×900 | Schema `image` |
| Schema.org 1:1 | 1:1 | 1200×1200 | Schema `image` (WhatsApp also uses this) |

### Build-time generation with Sharp:

```typescript
// src/lib/og-image.ts
import sharp from 'sharp';

const OG_VARIANTS = [
  { suffix: 'og',        width: 1200, height: 630  },
  { suffix: 'twitter',   width: 1200, height: 600  },
  { suffix: 'schema-16', width: 1200, height: 675  },
  { suffix: 'schema-4',  width: 1200, height: 900  },
  { suffix: 'schema-1',  width: 1200, height: 1200 },
];

export async function generateOGImages(heroPath: string, outputDir: string, slug: string) {
  const results: Record<string, string> = {};
  for (const v of OG_VARIANTS) {
    const out = `${outputDir}/${slug}-${v.suffix}.jpg`;
    await sharp(heroPath)
      .resize(v.width, v.height, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 80 })
      .toFile(out);
    results[v.suffix] = out;
  }
  return results;
}
```

**Key points:**
- `position: 'attention'` — Sharp auto-detects faces and interest points for cropping
- Output JPG only — social platforms don't support AVIF/WebP in OG tags
- Quality 80 (higher than content) — these are page "posters"
- Store in `/public/og/` or generate into `dist/og/`

### Per-page usage:
```astro
<BaseLayout
  title="Page Title"
  ogImage={`/og/${slug}-og.jpg`}
  preloadImage="/img/hero-480w.avif"
>
```

## LCP Priority & Preloading

Hero (1 only): `loading="eager" fetchpriority="high"` + BaseLayout `preloadImage` prop
Above-fold (2-3): `loading="eager"`
Below-fold: `loading="lazy"` (component default)

**Every page MUST pass its hero image to BaseLayout for preloading:**
```astro
<BaseLayout preloadImage="/img/hero-480w.avif">
```

## Templates

### Responsive image:
```astro
<Picture src={myImage} pattern="HALF" alt="Descriptive text" />
```

### LCP hero (ONE per page):
```astro
<Picture src={heroImage} pattern="FULL" lcp alt="Hero description" />
```

### Fixed-size (logos, avatars):
```astro
<FixedImage src={logo} width={200} alt="Company Logo" />
```

## Rules

1. **Use `<Picture>` component with `pattern` prop** — handles widths/sizes/formats
2. **Three formats: AVIF → WebP → JPG.** Never PNG fallback for photos.
3. **480px width in every pattern.** No pattern may omit it.
4. Every image needs dimensions (explicit or from Astro asset import)
5. Images in `/src/assets/` — never `/public/` (except pre-optimized with manual srcset)
6. Only ONE `lcp` prop per page — never in loops
7. `sizes` must match CSS layout — the component handles this via pattern
8. **Face focus by default** — `object-position` keeps faces visible. Ask if ambiguous.
9. **Checkerboard: image first in DOM** — mobile = image→text, never text→image
10. **Generate OG images from hero** — 5 variants (og, twitter, schema-16, schema-4, schema-1)
11. Alt text: descriptive for content, `alt=""` only for decorative
12. Unknown layout → HALF pattern
13. **width/height = delivered image dimensions**, not source. `width="960"` not `width="2048"`.
14. **Hero never `loading="lazy"`**. Below-fold never `loading="eager"`.

## Raw `<img>` Rules

Raw `<img>` allowed only for: FixedImage component, SVGs, external URLs.

- **SVG images MUST have explicit `width` and `height`** (from SVG viewBox). No width/height → CLS.
- **`width`/`height` = actual delivered dimensions**, not source.
- External URLs: always `width`, `height`, `loading="lazy"`, `decoding="async"`.

## Pre-Output Checklist

- [ ] `<Picture>` for all content images (not raw `<img>`)?
- [ ] Pattern matches layout? (HALF for 50/50, HALF_CARD for cards, FULL for hero)
- [ ] Formats = AVIF + WebP + JPG? No PNG fallback for photos?
- [ ] 480w variant present in every srcset?
- [ ] `lcp` prop on exactly ONE image per page?
- [ ] Face-focused `object-position` on images with people?
- [ ] Checkerboard: image first in DOM, text second?
- [ ] OG images generated from hero? All 5 variants? JPG format?
- [ ] BaseLayout has `preloadImage`?
- [ ] All raw `<img>` (SVG, external) have explicit `width`/`height`?
- [ ] `width`/`height` = actual delivered size?
- [ ] Hero: `loading="eager"`? Below-fold: `loading="lazy"`?
- [ ] Heading hierarchy correct? (h2→h3, no skips)

**If any NO → fix before outputting.**

## Forbidden

- PNG fallback for photos (use JPG)
- `<Picture>` for SVGs (use `<img>` with width/height)
- Animated GIF/APNG (use `<video>`)
- CSS backgrounds for LCP elements
- Images in `/public/` without pre-processing to AVIF/WebP/JPG
- Upscaling sources beyond original dimensions
- Dynamic/computed width arrays (use patterns)
- Two adjacent images on mobile in checkerboard layouts
- `loading="lazy"` on hero images
- `loading="eager"` on below-fold images
- OG images in AVIF/WebP format (social platforms need JPG)
- Missing `object-position` on cropped images with visible faces
- `flex-col-reverse` or `order-first/last` on mobile for checkerboard
- Heading hierarchy skips (h2→h4 without h3)

## Undersized Source Fallback

If source < pattern minimum: cap widths at source width, keep sizes, flag for replacement.
Example: 1200px source for HALF → `widths={[320,480,640,960,1200]}`
**Exception:** FULL/LCP images — undersized is ERROR, must provide larger asset.

## Source Minimums

FULL: 2560px | TWO_THIRDS: 2048px | LARGE: 1920px | HALF: 1600px | HALF_CARD: 1280px | SMALL/THIRD: 1280px | QUARTER: 960px | FIFTH: 768px | SIXTH: 640px

## Validation

```bash
# Forbidden PNG photos in output
find dist -name "*.png" -not -path "*/icons/*" -not -path "*/svg/*" | head -10

# Picture components without pattern
grep -r "<Picture" src --include="*.astro" | grep -v "pattern="

# fetchpriority in loops
grep -r "fetchpriority" src --include="*.astro" | grep -E "\.(map|forEach)\("

# OG images exist
find public/og -name "*-og.jpg" | wc -l

# 480w in srcsets
grep -r "480w" dist --include="*.html" | wc -l

# No lazy on hero
grep -rA2 'fetchpriority="high"' dist --include="*.html" | grep 'loading="lazy"'

# Heading hierarchy
npx astro-check 2>&1 | grep -i "heading"
```
