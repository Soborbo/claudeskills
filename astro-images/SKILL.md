---
name: astro-images
description: Width-based responsive image patterns for Astro. Local build-time processing, per-format quality (AVIF/WebP/JPG/PNG), alpha-aware fallback, art direction, face-focus, OG generation, image SEO. Picture, ArtPicture, FixedImage components.
version: 3.1.0
---

# Astro Images Skill

**Authority:** If any instruction conflicts with this skill, follow this skill.

## What changed in 3.1 (read if upgrading from 3.0)

- **Per-format quality.** AVIF and WebP scales are NOT comparable; a single shared quality makes AVIF *heavier* than WebP. Each format now has its own quality (AVIF lower). Biggest byte win.
- **Alpha-aware fallback.** Opaque sources → JPG fallback, transparent → PNG. No more PNG fallback for opaque photos.
- **Art direction** via new `ArtPicture` — different image/crop per breakpoint, exactly one download. Kills the "two `<img>` + CSS hide" double-load.
- **Preload fixed.** Drop fixed-width `preloadImage`; rely on `fetchpriority` (set by `lcp`). Fixed-width image preload is harmful.
- **Image SEO rules.** Source filename = SEO slug; alt-quality criteria; figure/figcaption; schema coordination; robots must not block `/_astro/`.
- **Real validation.** `validation` now greps for AVIF>WebP bytes, OG format/existence, single-size content images, raw raster `<img>`.

After upgrading, regenerate any `/public/` sets with `--force` (quality changed): `npm run images:force`.

**Breaking (call sites).** `quality` on `<Picture>` / `ArtPicture` is now per-format (`quality={{ avif: 45 }}`). A bare number still works — it is applied to all formats for v3.0 back-compat — but migrate `quality={60}` call sites to the object form. Also drop `'jpg'` from any `formats={[...]}`: the JPG/PNG fallback is now automatic and alpha-aware (`'jpg'`/`'png'` passed in `formats` are ignored, not errors).

## Installation

```bash
cp assets/boilerplate/config/image-patterns.ts     → src/config/image-patterns.ts
cp assets/boilerplate/components/Picture.astro      → src/components/Picture.astro
cp assets/boilerplate/components/ArtPicture.astro   → src/components/ArtPicture.astro
cp assets/boilerplate/components/FixedImage.astro   → src/components/FixedImage.astro
cp assets/boilerplate/lib/og-image.ts              → src/lib/og-image.ts
cp assets/boilerplate/scripts/optimize-images.mjs   → scripts/optimize-images.mjs   # only for /public/ pre-optimized sets
```

Check before copying:
```bash
ls src/components/Picture.astro src/components/ArtPicture.astro src/components/FixedImage.astro src/config/image-patterns.ts 2>/dev/null
```

| File | Purpose |
|------|---------|
| `image-patterns.ts` | Patterns (widths/sizes/minSourceWidth) + per-format `QUALITY` — single source of truth |
| `Picture.astro` | Responsive `<picture>`, per-format quality, alpha-aware JPG/PNG fallback, LCP |
| `ArtPicture.astro` | Art direction: different image/crop per breakpoint via `<source media>`, one download |
| `FixedImage.astro` | Fixed-dimension images (logos, avatars), 1x/2x/3x, AVIF+WebP |
| `og-image.ts` | Build-time OG/social image generation (JPG) |
| `optimize-images.mjs` | `/public/` preprocessor: per-format quality + alpha-aware fallback + incremental |

If using `optimize-images.mjs`, add to package.json:
```json
"scripts": {
  "images": "node scripts/optimize-images.mjs",
  "images:force": "node scripts/optimize-images.mjs --force",
  "images:clean": "node scripts/optimize-images.mjs --clean"
}
```
`optimize-images.mjs` imports `sharp` directly — already a transitive dep of Astro's image service, so no extra install in a standard Astro project. `images:clean` purges stale variants (incremental never deletes); `OUT_DIR` must be a dir the script owns.

## Core Principles

1. **All image processing happens locally at build time** — never at runtime, never on a CDN.
2. Pattern = rendered width. Aspect ratio is independent. Browser downloads: `sizes CSS px × DPR`.
3. **Three formats: AVIF → WebP → (JPG | PNG).** Each with its OWN quality. Fallback is JPG for opaque, PNG only for transparent.
4. **One download per layout slot.** Same image at different sizes = one `<Picture>`. Different image/crop per breakpoint = `ArtPicture` (one download via `media`). Never two `<img>` + CSS hide.
5. **480px width is mandatory** in every pattern's widths array.
6. Container queries: approximate with viewport breakpoints. Never omit `sizes`. Lazy images may use `sizes="auto"`.

## Format Rules & Quality

AVIF and WebP use **different, non-comparable quality scales.** One shared value (e.g. 60 for both) makes AVIF *larger* than WebP — the opposite of the point. Encode each format separately:

| Format | Role | Default quality | Notes |
|--------|------|-----------------|-------|
| AVIF | Primary | **50** (heavy heroes 45–48) | ≈ WebP 60 perceptually, ~25–40% smaller. `effort` 5–6 in the build script. |
| WebP | Fallback (no AVIF) | **60** | faster decode/encode than AVIF |
| JPG | Final fallback (opaque) | **62** | universal; progressive + mozjpeg in the script |
| PNG | Final fallback (transparent only) | lossless | logos/icons/graphics with alpha |

Defaults live in `image-patterns.ts` → `QUALITY`. Override per call: `<Picture quality={{ avif: 45 }} />`.

> **Astro caveat:** `getImage()` / `<Picture>` expose `quality` but not AVIF `effort`. The `effort` lever only applies in the manual `optimize-images.mjs` (direct Sharp). For Astro-processed images, quality is the main lever — and it is enough to make AVIF smaller than WebP.

**Forbidden formats in output:**
- **PNG for opaque photos** — JPG is always smaller. PNG only for transparency, screenshots with text, sharp-edged diagrams.
- **GIF/APNG** — use `<video>`.

## Image Processing Pipeline

### Astro config (build-time Sharp):
```js
export default defineConfig({
  output: 'static', // or 'server' if you have API routes / forms
  adapter: cloudflare({ imageService: 'compile' }), // Sharp at BUILD time
  image: { service: { entrypoint: 'astro/assets/services/sharp' } }
});
```
`imageService: 'compile'` is the key — works with both `static` and `server`.

### `/public/` pre-optimized sets → use `scripts/optimize-images.mjs`
For images that must live in `/public/` (client heroes, pre-optimized sets), DO NOT hand-roll `sharp-cli` with one quality. Use the canonical script, which:
- encodes AVIF/WebP with **separate** quality (AVIF q50, effort 5),
- picks the fallback by **alpha** (`sharp` `metadata.hasAlpha`): opaque → JPG, transparent → PNG,
- is **incremental** (mtime), with `--force` for full rebuilds,
- names outputs `${slug}-${w}w.${ext}` (source basename = SEO slug, preserved in the URL).

```bash
IMG_SRC=src/assets/preprocess IMG_OUT=public/img npm run images        # incremental
npm run images:force                                                    # after quality/format/ladder/codec change
```

#### Source masters vs. output — keep sources private and durable
The preprocessor uses two distinct dirs:
- `IMG_SRC` (default `src/assets/preprocess`) — **source masters** (input). The script only READS here; never deleted.
- `IMG_OUT` (default `public/img`) — **generated output** (disposable, public, reproducible).

- Keep **one master per image** in `IMG_SRC` and **commit `IMG_SRC` to the (private) repo.** Astro never publishes `src/` verbatim, so sources stay non-public and any size/format can be regenerated from them at any time.
- Treat `IMG_OUT` as throwaway and **100% script-generated** — never hand-place files in `public/img`.
- `--clean` deletes the **whole `IMG_OUT`** before regenerating (the only way to purge stale variants) and **never touches `IMG_SRC`.** Safe only when every image in `IMG_OUT` has a master in `IMG_SRC`; otherwise un-sourced images are lost. (Guard: the script exits before deleting if `IMG_SRC` is empty — partial coverage is the real danger.) Until source coverage is complete on an existing site, use `--force` (regenerates in place, never deletes).

### Incremental rules (any preprocessing script MUST follow)
1. Default incremental — never wipe output at startup.
2. Per-variant freshness: skip when output exists AND `mtime(output) >= mtime(source)`.
3. `--force` / `--clean` for full rebuilds.
4. Log a per-source line only when ≥1 variant was generated.
5. Final summary: `Variants generated: N (skipped M up-to-date)`.

| Change | `--force`? |
|--------|-----------|
| New / replaced source | no (incremental) |
| Quality changed (e.g. AVIF 60→50) | **yes** |
| Format list changed | **yes** |
| Width ladder extended | yes (safety) |
| Sharp/codec upgraded | **yes** |

### Verify after build:
```bash
ls dist/_astro/*.avif | head; ls dist/_astro/*.webp | head; ls dist/_astro/*.jpg | head
# AVIF must be SMALLER than WebP at the same width. Spot-check a hero at 1600w:
#   ls -l dist/_astro/<hero>*1600*.avif dist/_astro/<hero>*1600*.webp
# If AVIF >= WebP -> lower AVIF quality and regen with --force.
find dist -name "*.png" -not -path "*/icons/*" -not -path "*/svg/*"   # opaque PNG photos = wrong
```

## Pattern Reference
Every pattern includes 480w.

| Pattern | Width | sizes |
|---------|-------|-------|
| FULL | 100vw | `100vw` |
| TWO_THIRDS | 66vw | `(min-width:1024px) 66vw, 100vw` |
| LARGE | 60vw | `(min-width:1024px) 60vw, 100vw` |
| HALF | 50vw | `(min-width:1024px) 50vw, 100vw` |
| HALF_CARD | 50vw card | `(min-width:1024px) 50vw, 100vw` |
| SMALL | 40vw | `(min-width:1024px) 40vw, 100vw` |
| THIRD | 33vw | `(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw` |
| QUARTER | 25vw | `(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw` |
| FIFTH | 20vw | `(min-width:1024px) 20vw, (min-width:640px) 33vw, 50vw` |
| SIXTH | 16vw | `(min-width:1024px) 16vw, (min-width:640px) 33vw, 50vw` |

(Exact width arrays are in `image-patterns.ts`.) **Unknown layout → HALF.**

## Layout → Pattern Mapping
Full-bleed hero → FULL; 66/33, 60/40 → TWO_THIRDS, LARGE; 50/50, checkerboard → HALF; card 50% → HALF_CARD; 40/60 → SMALL; 3-col → THIRD; 4-col → QUARTER; 5/6-col → FIFTH, SIXTH; logo/avatar/icon → FixedImage. Aspect ratio is independent of pattern.

## Art Direction (different image/crop per breakpoint)

Use `ArtPicture` ONLY when mobile and desktop need a genuinely **different image or crop** (e.g. wide 16:9 desktop hero vs tall 3:4 mobile crop). It emits `<source media>` per breakpoint, so the browser downloads **exactly one** image.

```astro
<ArtPicture
  mobileSrc={heroTall} desktopSrc={heroWide} breakpoint={768}
  alt="Painless Removals crew loading a van in Bristol"
  lcp class="w-full aspect-[3/4] md:aspect-video object-cover" />
```

- Same image, different size only → use `<Picture>` (already one download — do NOT reach for ArtPicture).
- Art direction = different aspect per breakpoint, so set `aspect-ratio` per breakpoint via class (one width/height can't cover both).
- **Never** two `<img>` + `hidden md:block` — `display:none` images are still downloaded → double load.

## Checkerboard / Feature Sections
Desktop alternates image-left/right; mobile ALWAYS image-on-top. ONE image reordered via CSS `order` — not two images. Image first in DOM = first on mobile.

```astro
{features.map((f, i) => (
  <div class={`grid grid-cols-1 md:grid-cols-2 gap-8 items-center ${i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}>
    <div><Picture src={f.image} pattern="HALF" alt={f.alt} /></div>
    <div><h3>{f.title}</h3><p>{f.text}</p></div>
  </div>
))}
```
Forbidden: `flex-col-reverse` / `order-first|last` on mobile that puts text above the image.

## Image SEO

Image SEO is alt + surrounding context + Core Web Vitals ≫ filename. Do all of it; the filename is a weak but free signal.

**Filename.** Astro preserves the **source basename** in the served URL (`bristol-removals-van.{hash}.avif`), so the SEO name depends entirely on the source file. Name source files as kebab-case **keyword-locality** slugs.
- Forbidden source names: `IMG_*`, spaces, accents, generic `hero.jpg` / `image.jpg` / `photo.jpg`.
- Rename the source to the page's target keyword **before** import.
- `optimize-images.mjs` keeps the slug in `${slug}-${w}w.ext`.

**Alt text.** Required on every content image. Quality criteria:
- Describe what is actually in the image, in natural language.
- Include keyword/locality only where it fits naturally — **no keyword stuffing**.
- No "image of" / "photo of" prefix (assistive tech already announces it).
- ~125 char practical cap. Decorative → `alt=""`.
- **If image content, target keyword, or locality is unknown → ASK. Do not invent.** (Same rule as face-focus.)

**Context & structured data.**
- Use `<figure>` + `<figcaption>` where a caption adds real context (read by users and Google).
- Hero / key images should also appear in `ImageObject` / `Article` / `LocalBusiness` / `Service` schema — coordinate with the `schema-audit` skill, don't duplicate.
- **`robots.txt` must NOT block `/_astro/`** (or the image dir) or Google Images can't index. Verify.
- Hash-churn: re-touching a source changes its URL → Google re-discovers. Don't needlessly re-export evergreen images.

## Face Focus (object-position)
Person → `object-position: center 20%`. No focal point → center. Ambiguous (multiple people, subject at edge, unclear) → **ASK**.

```astro
<Picture src={teamPhoto} pattern="HALF" alt="..." class="object-[center_20%]" />
```

## OG Image Generation

Every page's hero generates OG images at build time. **OG images MUST be JPG** (social platforms don't render AVIF/WebP — the preview goes blank).

| Platform | Ratio | Dimensions | Tag |
|----------|-------|------------|-----|
| Facebook/LinkedIn/Generic | 1.91:1 | 1200×630 | `og:image` |
| Twitter/X large | 2:1 | 1200×600 | `twitter:image` |
| Schema 16:9 | 16:9 | 1200×675 | Schema `image` |
| Schema 4:3 | 4:3 | 1200×900 | Schema `image` |
| Schema 1:1 | 1:1 | 1200×1200 | Schema `image` (WhatsApp) |

Use `lib/og-image.ts` (`position:'attention'`, JPG q80, progressive). **Also add the type meta:**
```astro
<meta property="og:image" content={`/og/${slug}-og.jpg`} />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```
**Never** point `ogImage` at a WebP/AVIF, and never at a width that wasn't generated (404 = blank preview). A `og-default.png` fallback is fine (PNG renders on every platform) — but then `og:image:type` must read `image/png` on pages that use it: **the type meta must match the actual file.** The bug to kill is per-page overrides in WebP/AVIF.

## LCP Priority & Preloading

- Hero (1 only): `<Picture ... lcp>` → sets `loading="eager"` + `fetchpriority="high"`.
- Above-fold (2–3): `aboveFold` → `loading="eager"`.
- Below-fold: lazy (default).

**Do NOT preload a fixed-width image file.** The old `preloadImage="/img/hero-480w.avif"` pattern is harmful: it points at a fixed path/width that usually isn't what `<picture>` paints (desktop picks ~1920w), so you get a wasted download or a blurry-then-swap, and hashed `/_astro/` paths won't even match. For an `<img>` in the initial HTML, the preload scanner finds it instantly — `fetchpriority="high"` (set by `lcp`) is sufficient.

If a hero is genuinely discovered late (CSS background, JS-injected) and must be preloaded, use a **responsive** preload matching the picture exactly:
```html
<link rel="preload" as="image" type="image/avif"
      imagesrcset="/_astro/hero.{hash}-960w.avif 960w, /_astro/hero.{hash}-1920w.avif 1920w"
      imagesizes="100vw" />
```

## Templates
```astro
<Picture src={img} pattern="HALF" alt="Descriptive, keyword-where-natural" />
<Picture src={hero} pattern="FULL" lcp alt="Hero description" />
<Picture src={logo} pattern="QUARTER" transparent alt="Brand logo" />
<ArtPicture mobileSrc={m} desktopSrc={d} alt="..." lcp class="aspect-[3/4] md:aspect-video" />
<FixedImage src={logo} width={200} alt="Company Logo" />
```

## Rules
1. `<Picture>` with `pattern` for content images; `ArtPicture` for per-breakpoint art direction.
2. **Per-format quality** — AVIF lower than WebP. Never one quality for all. AVIF output must be SMALLER than WebP at the same width.
3. Three formats: AVIF → WebP → JPG(opaque) / PNG(transparent). No PNG fallback for opaque photos.
4. **One download per slot** — never two `<img>` + CSS hide.
5. 480px width in every pattern.
6. Every image needs dimensions (explicit or from asset import).
7. Images in `/src/assets/` (or `/public/` only when pre-processed by `optimize-images.mjs`).
8. Only ONE `lcp` per page. No fixed-width image preload.
9. `sizes` matches layout (pattern handles it). Lazy images may use `sizes="auto"`.
10. Face focus by default; ASK if ambiguous.
11. Checkerboard: image first in DOM.
12. OG images: 5 variants, **JPG**, must exist, with `og:image:type`.
13. **Source filename = SEO slug** (keyword-locality, kebab-case).
14. **Alt: accurate + natural keyword, no stuffing, no "image of", decorative empty; ASK if unknown.**
15. width/height = delivered dimensions, not source.
16. Unknown layout → HALF.
17. Hero never lazy; below-fold never eager.
18. `robots.txt` must not block `/_astro/`.

## Raw `<img>` Rules
Raw `<img>` allowed ONLY for: FixedImage component output, SVGs, external URLs. **Raster content images via raw `<img>` (PNG/JPG without the pipeline) are forbidden.**
- SVG: explicit `width` / `height` (from viewBox).
- External URLs: `width`, `height`, `loading="lazy"`, `decoding="async"`.

## Pre-Output Checklist
- [ ] `<Picture>` / `ArtPicture` for content images (not raw `<img>`)?
- [ ] **Per-format quality? AVIF actually smaller than WebP at same width?**
- [ ] Pattern matches layout?
- [ ] Fallback = JPG for opaque, PNG only for transparent? No opaque-PNG?
- [ ] 480w in every srcset?
- [ ] One `lcp` per page? **No fixed-width image preload?**
- [ ] Art direction via `ArtPicture` (one download), not two `<img>`?
- [ ] Face-focus on people images?
- [ ] Checkerboard: image first in DOM?
- [ ] **OG = JPG, exists, `og:image:type` set?**
- [ ] **Source filenames = SEO slugs? Alt quality (natural keyword, no stuffing, no "image of")?**
- [ ] `<figure>/<figcaption>` where context helps? Hero in schema?
- [ ] `robots.txt` not blocking `/_astro/`?
- [ ] All raw `<img>` (SVG, external) have explicit `width`/`height`?
- [ ] Heading hierarchy correct?

**If any NO → fix before outputting.**

## Forbidden
- One quality for all formats / AVIF quality == WebP quality (makes AVIF heavier)
- PNG fallback for opaque photos
- Two `<img>` + `hidden md:block` for art direction (double download)
- `ArtPicture` for same-image-different-size (use `<Picture>`)
- Fixed-width image preload (`preloadImage="/img/x-480w.avif"`)
- OG images in AVIF/WebP, or pointing at a non-generated width (blank/404 preview)
- Single-size content images (no responsive srcset)
- Raw raster `<img>` for content (PNG/JPG without pipeline)
- SEO-poor source filenames (`IMG_*`, spaces, generic `hero.jpg`)
- `<Picture>` for SVGs; animated GIF/APNG; CSS backgrounds for LCP
- Images in `/public/` without `optimize-images.mjs`; upscaling; dynamic width arrays
- Hand-placing files in `public/img` (IMG_OUT) — `--clean` wipes it wholesale
- Running `--clean` without a complete source-master set in `IMG_SRC`
- `loading="lazy"` on hero; `loading="eager"` on below-fold
- Missing `object-position` on cropped images with faces
- Blocking `/_astro/` in robots.txt; heading hierarchy skips

## Undersized Source Fallback
Source < pattern minimum: cap widths at source width, keep sizes, flag. FULL/LCP undersized = ERROR.

## Source Minimums
FULL 2560 | TWO_THIRDS 2048 | LARGE 1920 | HALF 1600 | HALF_CARD 1280 | SMALL/THIRD 1280 | QUARTER 960 | FIFTH 768 | SIXTH 640

## Validation
```bash
# Picture without pattern
grep -rn "<Picture" src --include="*.astro" | grep -v "pattern="

# Fixed-width image preload (should be empty)
grep -rn "preloadImage" src --include="*.astro"
grep -rn 'rel="preload"' dist --include="*.html" | grep 'as="image"' | grep -v "imagesrcset"

# AVIF heavier than WebP at same width — spot-check a hero (should NOT be larger)
#   ls -l dist/_astro/<hero>*1600*.avif dist/_astro/<hero>*1600*.webp

# Opaque PNG photos in output (should be empty)
find dist -name "*.png" -not -path "*/icons/*" -not -path "*/svg/*"

# OG must be JPG (no webp/avif ogImage)
grep -rEn 'ogImage\s*[:=].*\.(webp|avif)' src --include="*.astro"
# og:image:type present (search all of src — OG tags may live in a SEO component, not just layouts)
grep -rn 'og:image:type' src --include="*.astro" || echo "MISSING og:image:type"

# Raw raster content <img> (review hits)
grep -rEn '<img[^>]+\.(png|jpe?g)' src --include="*.astro" | grep -v "FixedImage"

# robots.txt must not block /_astro/
grep -n "_astro" public/robots.txt 2>/dev/null && echo "WARNING: check robots does not Disallow /_astro/"

# fetchpriority inside a loop (review — only one LCP per page)
grep -rn "fetchpriority" src --include="*.astro"
```
